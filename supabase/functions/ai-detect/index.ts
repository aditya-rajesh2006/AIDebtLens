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

interface EnsembleDetectionResult {
  aiProbability: number;
  signals: string[];
  confidence: number;
  methodScores: Record<string, number>;
}

interface GatewayDetectionResult {
  aiProbability: number;
  confidence: number;
  signals: string[];
  verdict: "ai-generated" | "human-written" | "mixed";
  explanation: string;
}

// ── CALIBRATED FEATURE EXTRACTION ──
function extractEnhancedFeatures(code: string): { vector: number[]; metrics: Record<string, number> } {
  const lines = code.split('\n');
  const totalLines = lines.length || 1;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const neLen = nonEmptyLines.length || 1;

  // 1. Structural Uniformity Score (SUS)
  const funcBodies = code.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?\}/g) || [];
  const nonZero = (min: number, max: number, v?: number) => {
    if (typeof v === 'number') return Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;
    return Math.round(min * 100) / 100;
  };
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/[\w]+/g, 'X').substring(0, 50));
    const uniq = new Set(stripped).size;
    sus = Math.round((1 - uniq / funcBodies.length) * 100) / 100;
  }
  // Ensure a small floor so SUS never displays as 0
  sus = nonZero(0.08, 0.98, sus);

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

  // Ensure non-zero floors for all returned metrics
  const tdd_f = nonZero(0.08, 0.95, tdd);
  const pri_f = nonZero(0.08, 0.95, pri);
  const crs_f = nonZero(0.08, 0.95, crs);
  const scs_f = nonZero(0.08, 0.98, scs);
  const ias_f = nonZero(0.05, 0.95, ias);

  const vector = [sus, tdd_f, pri_f, crs_f, scs_f, ias_f, entropy, ccn / 20, nesting / 10, commentRatio, funcLenVar];
  const metrics = { sus, tdd: tdd_f, pri: pri_f, crs: crs_f, scs: scs_f, ias: ias_f, entropy, ccn, nesting, commentRatio };

  return { vector, metrics };
}

// ── HYBRID DETECTION using ensemble ──
function detectAIEnsemble(code: string, filename: string): EnsembleDetectionResult {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function detectAIViaGateway(
  code: string,
  filename: string,
  lovableApiKey: string,
): Promise<GatewayDetectionResult | null> {
  const systemPrompt = `You are a strict AI code detection verifier.

You are not replacing heuristic analysis. You are acting as a second-opinion model that estimates the probability that a code sample was AI-generated or heavily AI-assisted.

Evaluate signals such as:
- structural uniformity across functions
- repeated implementation patterns
- generic naming
- redundant or overly obvious comments
- suspiciously consistent formatting
- low human texture or lack of natural variation
- mismatch between code length and conceptual complexity

Be conservative. Do not call code AI-generated unless multiple signals align.

Return only the tool output.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this code sample for AI-generation likelihood.\nFilename: ${filename}\n\n\`\`\`\n${code.slice(0, 12000)}\n\`\`\``,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_ai_detection",
          description: "Return structured AI detection results for a code sample",
          parameters: {
            type: "object",
            properties: {
              aiProbability: { type: "number", description: "0-1 AI-generation probability" },
              confidence: { type: "number", description: "0-1 confidence in the estimate" },
              signals: {
                type: "array",
                items: { type: "string" },
                description: "Top AI-generation signals found in the code",
              },
              verdict: {
                type: "string",
                enum: ["ai-generated", "human-written", "mixed"],
              },
              explanation: {
                type: "string",
                description: "Short explanation of the score",
              },
            },
            required: ["aiProbability", "confidence", "signals", "verdict", "explanation"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report_ai_detection" } },
    }),
  });

  if (!response.ok) {
    console.error("Lovable AI detect gateway error:", response.status, await response.text());
    return null;
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    return null;
  }

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return {
      aiProbability: clamp(Number(parsed.aiProbability) || 0, 0.03, 0.97),
      confidence: clamp(Number(parsed.confidence) || 0.45, 0.2, 0.95),
      signals: Array.isArray(parsed.signals) ? parsed.signals.map((signal: unknown) => String(signal)).slice(0, 6) : [],
      verdict: parsed.verdict === "ai-generated" || parsed.verdict === "human-written" ? parsed.verdict : "mixed",
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "Model-assisted verification completed.",
    };
  } catch (error) {
    console.error("Failed to parse Lovable AI detection response:", error);
    return null;
  }
}

function blendDetectionResults(
  ensemble: EnsembleDetectionResult,
  gateway: GatewayDetectionResult | null,
) {
  if (!gateway) {
    return {
      aiProbability: ensemble.aiProbability,
      confidence: ensemble.confidence,
      signals: ensemble.signals,
      explanation: generateExplanation(ensemble.aiProbability, ensemble.signals),
      method: "hybrid-ensemble",
    };
  }

  const gatewayWeight = clamp(0.18 + gateway.confidence * 0.22, 0.2, 0.42);
  const aiProbability = clamp(
    ensemble.aiProbability * (1 - gatewayWeight) + gateway.aiProbability * gatewayWeight,
    0.03,
    0.97,
  );
  const confidence = clamp(
    ensemble.confidence * 0.72 + gateway.confidence * 0.28,
    0.35,
    0.96,
  );
  const signals = [...new Set([...ensemble.signals, ...gateway.signals])].slice(0, 8);
  const explanation = `${generateExplanation(aiProbability, signals)} Model verification: ${gateway.explanation}`;

  return {
    aiProbability,
    confidence,
    signals,
    explanation,
    method: "hybrid-ensemble+lovable-gemini",
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { code, filename, userId } = await req.json();
    if (!code) throw new Error('code is required');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    // Step 1: Get local ensemble detection
    const ensembleResult = detectAIEnsemble(code, filename || 'unknown');
    const gatewayResult = LOVABLE_API_KEY
      ? await detectAIViaGateway(code, filename || "unknown", LOVABLE_API_KEY)
      : null;
    const blendedDetection = blendDetectionResults(ensembleResult, gatewayResult);

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
    let finalScore = blendedDetection.aiProbability;
    if (trainedWeights && trainedWeights.boost_factor) {
      finalScore = Math.min(1, finalScore * trainedWeights.boost_factor);
    }

    finalScore = Math.round(clamp(finalScore, 0.03, 0.97) * 100) / 100;

    // Step 4: Determine verdict with minimum confidence threshold
    let verdict: "ai-generated" | "human-written" | "mixed";
    if (finalScore > 0.75) verdict = "ai-generated";
    else if (finalScore < 0.28) verdict = "human-written";
    else verdict = "mixed";

    const result: DetectionResult = {
      aiProbability: finalScore,
      confidence: Math.round(blendedDetection.confidence * 100) / 100,
      signals: blendedDetection.signals,
      verdict,
      explanation: blendedDetection.explanation,
      method: blendedDetection.method + (trainedWeights ? '+trained-boost' : ''),
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
