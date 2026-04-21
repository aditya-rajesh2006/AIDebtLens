import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  signals: string[];
  verdict: "ai-generated" | "human-written" | "mixed";
  explanation: string;
  method: string;
}

// ── CALIBRATED FEATURE EXTRACTION ──
function extractEnhancedFeatures(code: string): { vector: number[]; metrics: Record<string, number> } {
  const lines = code.split('\n');
  const totalLines = lines.length || 1;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const neLen = nonEmptyLines.length || 1;

  // 1. Structural Uniformity Score (SUS)
  const funcBodies = code.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?\}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/[\w]+/g, 'X').substring(0, 50));
    const uniq = new Set(stripped).size;
    sus = Math.round((1 - uniq / funcBodies.length) * 100) / 100;
  }

  // 2. Token Distribution Divergence (TDD)
  const tokens = code.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, 10).reduce((s, v) => s + v, 0);
  const tdd = Math.round(Math.min(topFreqSum / (tokens.length || 1), 1) * 100) / 100;

  // 3. Pattern Repetition Index (PRI)
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 12) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  const pri = Math.round(Math.min(duplicated / Math.max(neLen * 0.1, 1), 1) * 100) / 100;

  // 4. Comment Redundancy Score (CRS)
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*');
  });
  const obviousComments = commentLines.filter(l => {
    const t = l.trim().toLowerCase();
    return /\/\/ (get|set|return|create|initialize|update|delete|add|check|validate|parse|handle|process|render|fetch|load|save|close|open|read|write|send|receive|increment|decrement)\b/.test(t);
  });
  const crs = Math.round(Math.min(obviousComments.length / Math.max(commentLines.length, 1), 1) * 100) / 100;

  // 5. Style Consistency Score (SCS)
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / (lineLens.length || 1);
  const stdDev = Math.sqrt(lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / (lineLens.length || 1));
  const scs = Math.round(Math.max(0, 1 - stdDev / 30) * 100) / 100;

  // 6. Generic Identifier density (proxy for IAS)
  const genericNames = code.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|myFunction|myData|info|stuff|thing|element|node|entry|record|payload|response|request|handler|callback|args|params|options|config|settings|state|props|context|ref|el|str|num|idx|cnt|len|flag|status|type|kind|mode|key|id|x|y|z|n|i|j|k)\b/g);
  const ias = genericNames ? Math.round(Math.min((genericNames.length / Math.max(totalLines * 0.01, 1))) * 100) / 100 : 0;

  // 7. Code entropy (uniformity of structure)
  const entropy = Math.round((stdDev / 30) * 100) / 100;

  // 8. Complexity metrics
  const ccn = (code.match(/\b(if|else|for|while|switch|case|catch|&&|\|\|\?)\b/g) || []).length + 1;
  const nesting = code.split('{').length - 1;

  // 9. Comment ratio
  const commentRatio = Math.round((commentLines.length / totalLines) * 100) / 100;

  // 10. Function length variance
  const funcMatches = code.match(/(?:function|=>)\s*{[\s\S]{0,}?}(?=\s*(?:;|function|const|let|var|export|class))/g) || [];
  const funcLengths = funcMatches.map(f => f.length);
  const avgFuncLen = funcLengths.reduce((a, b) => a + b, 0) / (funcLengths.length || 1);
  const funcLenVar = funcLengths.length > 1 
    ? Math.sqrt(funcLengths.reduce((s, l) => s + Math.pow(l - avgFuncLen, 2), 0) / funcLengths.length) / 100
    : 0;

  const vector = [sus, tdd, pri, crs, scs, ias, entropy, ccn / 20, nesting / 10, commentRatio, funcLenVar];
  const metrics = { sus, tdd, pri, crs, scs, ias, entropy, ccn, nesting, commentRatio };

  return { vector, metrics };
}

// ── HYBRID DETECTION using ensemble ──
function detectAIEnsemble(code: string, filename: string): { 
  aiProbability: number; 
  signals: string[]; 
  confidence: number;
  methodScores: Record<string, number>;
} {
  const { vector, metrics } = extractEnhancedFeatures(code);
  const signals: string[] = [];
  let totalScore = 0;
  const methodScores: Record<string, number> = {};
  let strongSignals = 0;
  let humanPenalty = 0;
  let humanSignals = 0;

  // Method 1: Pattern-based scoring (40% weight)
  let patternScore = 0;
  if (metrics.sus > 0.5) { patternScore += 0.25; signals.push('high structural uniformity'); strongSignals++; }
  else if (metrics.sus > 0.3) patternScore += 0.12;
  
  if (metrics.pri > 0.3) { patternScore += 0.25; signals.push('high pattern repetition'); strongSignals++; }
  else if (metrics.pri > 0.1) patternScore += 0.10;
  
  if (metrics.tdd > 0.3) { patternScore += 0.15; signals.push('skewed token distribution'); strongSignals++; }
  
  if (metrics.crs > 0.5) { patternScore += 0.20; signals.push('redundant comments'); strongSignals++; }
  else if (metrics.crs > 0.3) patternScore += 0.08;
  
  if (metrics.ias > 0.35) { patternScore += 0.15; signals.push('generic identifier names'); strongSignals++; }
  
  methodScores.pattern = Math.min(patternScore, 1);
  totalScore += 0.40 * methodScores.pattern;

  // Method 2: Style-based scoring (25% weight)
  let styleScore = 0;
  if (metrics.scs > 0.7 && code.split('\n').length > 20) {
    styleScore += 0.35; signals.push('suspiciously uniform formatting'); strongSignals++;
  } else if (metrics.scs > 0.5) styleScore += 0.15;
  
  if (metrics.commentRatio > 0.2) { styleScore += 0.20; signals.push('excessive comments'); strongSignals++; }
  else if (metrics.commentRatio > 0.12) styleScore += 0.08;
  
  if (metrics.entropy < 0.4) { styleScore += 0.20; signals.push('low code entropy'); strongSignals++; }
  
  methodScores.style = Math.min(styleScore, 1);
  totalScore += 0.25 * methodScores.style;

  // Method 3: Complexity-based scoring (20% weight)
  let complexityScore = 0;
  if (metrics.ccn < 5) complexityScore += 0.25; // Too simple = AI-like
  if (metrics.nesting > 5) complexityScore += 0.25;
  if (code.split('\n').length > 200 && metrics.ccn < 10) complexityScore += 0.20;
  
  methodScores.complexity = Math.min(complexityScore, 1);
  totalScore += 0.20 * methodScores.complexity;

  // Method 4: Feature vector ML-style scoring (15% weight)
  const aiSignature = [0.6, 0.35, 0.35, 0.5, 0.65, 0.4, 0.35, 0.15, 0.15, 0.22, 0.15];
  const humanSignature = [0.25, 0.15, 0.08, 0.15, 0.35, 0.1, 0.55, 0.35, 0.25, 0.08, 0.40];
  
  let aiDist = 0, humanDist = 0;
  for (let i = 0; i < vector.length; i++) {
    aiDist += Math.pow(vector[i] - aiSignature[i], 2);
    humanDist += Math.pow(vector[i] - humanSignature[i], 2);
  }
  aiDist = Math.sqrt(aiDist);
  humanDist = Math.sqrt(humanDist);
  
  const mlScore = aiDist / (aiDist + humanDist || 1);
  methodScores.ml = mlScore;
  totalScore += 0.15 * mlScore;

  const assertionCount = (code.match(/\b(expect|assert|should|describe|it)\b/g) || []).length;
  if (assertionCount >= 3) { humanPenalty += 0.05; humanSignals++; }

  const hasAsync = code.includes('async') || code.includes('await') || code.includes('Promise');
  const hasErrorHandling = (code.includes('try') && code.includes('catch')) || code.includes('.catch');
  if (hasAsync && hasErrorHandling) { humanPenalty += 0.06; humanSignals++; }

  if (metrics.entropy > 0.55 && metrics.tdd < 0.24) { humanPenalty += 0.05; humanSignals++; }

  let aiProbability = totalScore - humanPenalty;
  if (strongSignals < 2) aiProbability = Math.min(aiProbability, 0.60);
  if (strongSignals >= 4) aiProbability += 0.04;
  if (humanSignals >= 2) aiProbability -= 0.04;
  aiProbability = Math.min(Math.max(aiProbability, 0.03), 0.97);
  
  // Confidence based on signal consistency
  const agreement = Math.max(...Object.values(methodScores)) - Math.min(...Object.values(methodScores));
  const confidence = Math.min(0.5 + signals.length * 0.06 + (0.2 - agreement * 0.1), 0.95);

  return { aiProbability, signals: [...new Set(signals)], confidence, methodScores };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { code, filename, userId } = await req.json();
    if (!code) throw new Error('code is required');

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // Step 1: Get local ensemble detection
    const ensembleResult = detectAIEnsemble(code, filename || 'unknown');

    // Step 2: Try to load user's trained model for boosting
    let trainedWeights: Record<string, number> | null = null;
    if (userId && SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data } = await supabase
          .from('model_weights')
          .select('weights')
          .eq('user_id', userId)
          .eq('model_name', 'cognitive-classifier')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data?.weights) trainedWeights = data.weights;
      } catch (e) {
        // Model not available, will use base detection
        console.log("No trained model available, using base detection");
      }
    }

    // Step 3: Boost score with trained model if available
    let finalScore = ensembleResult.aiProbability;
    if (trainedWeights && trainedWeights.boost_factor) {
      finalScore = Math.min(1, finalScore * trainedWeights.boost_factor);
    }

    // Step 4: Determine verdict with minimum confidence threshold
    let verdict: "ai-generated" | "human-written" | "mixed";
    if (finalScore > 0.75) verdict = "ai-generated";
    else if (finalScore < 0.28) verdict = "human-written";
    else verdict = "mixed";

    // Step 5: Generate comprehensive explanation
    const explanation = generateExplanation(finalScore, ensembleResult.signals);

    const result: DetectionResult = {
      aiProbability: Math.round(finalScore * 100) / 100,
      confidence: Math.round(ensembleResult.confidence * 100) / 100,
      signals: ensembleResult.signals,
      verdict,
      explanation,
      method: 'hybrid-ensemble' + (trainedWeights ? '+trained-boost' : ''),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ai-detect error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateExplanation(probability: number, signals: string[]): string {
  const parts: string[] = [];
  
  if (probability > 0.7) {
    parts.push(`Strong AI-generation indicators (${(probability*100).toFixed(0)}%)`);
  } else if (probability > 0.5) {
    parts.push(`Likely AI-generated (${(probability*100).toFixed(0)}%)`);
  } else if (probability > 0.35) {
    parts.push(`Possible AI involvement (${(probability*100).toFixed(0)}%)`);
  } else if (probability > 0.2) {
    parts.push(`Weak AI indicators (${(probability*100).toFixed(0)}%)`);
  } else {
    parts.push(`Appears human-written (${(probability*100).toFixed(0)}%)`);
  }
  
  if (signals.length > 0) {
    const topSignals = signals.slice(0, 2).join(', ');
    parts.push(`— ${topSignals}.`);
  }
  
  return parts.join(' ');
}
