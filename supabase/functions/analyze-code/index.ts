import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileAnalysis {
  file: string;
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  propagationScore: number;
  issues: string[];
  metrics: Record<string, number>;
  linesOfCode: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
  explanation: string;
  datasetScore: number;
}

interface AnalysisResult {
  repoName: string;
  totalFiles: number;
  files: FileAnalysis[];
  summary: {
    avgAiLikelihood: number;
    avgTechnicalDebt: number;
    avgCognitiveDebt: number;
    totalIssues: number;
    highRiskFiles: number;
    topRefactorTargets: string[];
    aiContribution?: number;
  };
}

// ── AI DETECTION ──
function detectAIPatterns(content: string): {
  aiLikelihood: number;
  issues: string[];
  sus: number;
  tdd: number;
  pri: number;
  crs: number;
  scs: number;
} {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const neLen = nonEmptyLines.length || 1;
  const issues: string[] = [];

  // SUS
  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?\}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/[\w]+/g, 'X').substring(0, 50));
    const uniq = new Set(stripped).size;
    sus = Math.round((1 - uniq / funcBodies.length) * 100) / 100;
  }
  let score = 0;
  if (sus > 0.65) { score += 0.22; issues.push('high structural uniformity'); }

  // TDD
  const tokens = content.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, Math.max(5, Math.floor(freqs.length * 0.15))).reduce((s, v) => s + v, 0);
  const tdd = Math.round(Math.min(topFreqSum / (tokens.length || 1), 1) * 100) / 100;
  if (tdd > 0.35) { score += 0.15; issues.push('skewed token distribution'); }

  // PRI
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 15) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  const pri = Math.round(Math.min(duplicated / Math.max(neLen * 0.12, 1), 1) * 100) / 100;
  if (pri > 0.40) { score += 0.22; issues.push('high pattern repetition'); }

  // CRS
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*');
  });
  const obviousComments = commentLines.filter(l => {
    const t = l.trim().toLowerCase();
    return /\b(get|set|create|initialize|check|return|call|loop|iterate|update|delete|add|fetch|render|handle|process)\b/.test(t);
  });
  const crs = commentLines.length > 0 ? Math.round(Math.min(obviousComments.length / commentLines.length, 1) * 100) / 100 : 0;
  const commentRatio = Math.round((commentLines.length / totalLines) * 100) / 100;
  if (crs > 0.60) { score += 0.15; issues.push('highly redundant comments'); }
  if (commentRatio > 0.25) { score += 0.12; issues.push('excessive comment density'); }

  // SCS
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / (lineLens.length || 1);
  const variance = lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / (lineLens.length || 1);
  const stdDev = Math.sqrt(variance);
  const scs = Math.round(Math.max(0, 1 - Math.min(stdDev / 25, 1)) * 100) / 100;
  if (scs > 0.75 && neLen > 25) { score += 0.12; issues.push('suspiciously uniform formatting'); }

  // Generic names
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|x|y|z|i|j|k)\b/g);
  const genericDensity = genericNames ? Math.round(Math.min((genericNames.length / (tokens.length || 1)) * 100, 1) * 100) / 100 : 0;
  if (genericDensity > 0.10) { score += 0.15; issues.push('overly generic identifier names'); }

  const entropy = Math.round((Math.min(stdDev / 25, 1)) * 100) / 100;
  if (entropy < 0.35) { score += 0.10; issues.push('low code entropy'); }

  const aiSignature = { sus: 0.58, tdd: 0.40, pri: 0.42, crs: 0.48, genericDensity: 0.09, entropy: 0.32 };
  const humanSignature = { sus: 0.22, tdd: 0.18, pri: 0.12, crs: 0.15, genericDensity: 0.03, entropy: 0.58 };
  
  const aiDist = Math.abs(sus - aiSignature.sus) + 
                 Math.abs(tdd - aiSignature.tdd) + 
                 Math.abs(pri - aiSignature.pri) + 
                 Math.abs(crs - aiSignature.crs) + 
                 Math.abs(genericDensity - aiSignature.genericDensity) + 
                 Math.abs(entropy - aiSignature.entropy);
  
  const humanDist = Math.abs(sus - humanSignature.sus) + 
                    Math.abs(tdd - humanSignature.tdd) + 
                    Math.abs(pri - humanSignature.pri) + 
                    Math.abs(crs - humanSignature.crs) + 
                    Math.abs(genericDensity - humanSignature.genericDensity) + 
                    Math.abs(entropy - humanSignature.entropy);
  
  const featureScore = aiDist / (aiDist + humanDist + 0.001);
  const aiLikelihood = Math.min(Math.max(score * 0.6 + featureScore * 0.4 + 0.02, 0.05), 1);

  return {
    aiLikelihood: Math.round(aiLikelihood * 100) / 100,
    issues: [...new Set(issues)].slice(0, 8),
    sus: Math.round(sus * 100) / 100,
    tdd: Math.round(tdd * 100) / 100,
    pri: Math.round(pri * 100) / 100,
    crs: Math.round(crs * 100) / 100,
    scs: Math.round(scs * 100) / 100,
  };
}

// ── TECHNICAL DEBT ──
function detectTechnicalDebt(content: string): {
  technicalDebt: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  linesOfCode: number;
  issues: string[];
} {
  const lines = content.split('\n');
  const linesOfCode = lines.filter(l => l.trim().length > 0).length;
  const issues: string[] = [];
  let debt = 0;

  const branches = (content.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/g) || []).length;
  const cyclomaticComplexity = 1 + branches;
  if (cyclomaticComplexity > 15) { debt += 0.30; issues.push('high cyclomatic complexity'); }
  else if (cyclomaticComplexity > 8) { debt += 0.18; }

  let maxDepth = 0, depth = 0;
  for (const ch of content) {
    if (ch === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === '}') depth--;
  }
  if (maxDepth > 4) { debt += 0.30; issues.push('deep nesting'); }

  if (linesOfCode > 300) { debt += 0.25; issues.push('large file (>300 LOC)'); }
  else if (linesOfCode > 200) { debt += 0.15; }

  const dupeLines = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 20) dupeLines.set(t, (dupeLines.get(t) || 0) + 1);
  }
  const dups = [...dupeLines.values()].filter(v => v > 2).length;
  if (dups > 1) { debt += 0.15; issues.push('duplicate code blocks'); }

  const technicalDebt = Math.max(Math.min(debt, 1), 0.08);

  return {
    technicalDebt: Math.round(technicalDebt * 100) / 100,
    cyclomaticComplexity,
    nestingDepth: maxDepth,
    linesOfCode,
    issues
  };
}

// ── COGNITIVE DEBT ──
function detectCognitiveDebt(content: string, techDebt: number, aiLikelihood: number): number {
  const lines = content.split('\n');
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  let maxDepth = 0, depth = 0;
  for (const ch of content) {
    if (ch === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === '}') depth--;
  }

  const bases = [
    Math.min((Math.pow(maxDepth, 2) + controlFlow) / 20, 1),
    Math.min(aiLikelihood * 0.5, 1),
  ];

  const raw = 0.7 * bases[0] + 0.3 * bases[1];
  return Math.round(Math.max(Math.min(raw, 1), 0.12) * 100) / 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { code, fileName = "uploaded_file" } = await req.json();
    if (!code || !code.trim()) throw new Error('code is required');

    // Analyze the uploaded code
    const aiPatterns = detectAIPatterns(code);
    const techDebt = detectTechnicalDebt(code);
    const cogDebt = detectCognitiveDebt(code, techDebt.technicalDebt, aiPatterns.aiLikelihood);

    const fileAnalysis: FileAnalysis = {
      file: fileName,
      aiLikelihood: aiPatterns.aiLikelihood,
      technicalDebt: techDebt.technicalDebt,
      cognitiveDebt: cogDebt,
      propagationScore: (techDebt.technicalDebt * 0.6 + aiPatterns.aiLikelihood * 0.4),
      issues: [...new Set([...aiPatterns.issues, ...techDebt.issues])].slice(0, 8),
      metrics: {
        sus: aiPatterns.sus,
        tdd: aiPatterns.tdd,
        pri: aiPatterns.pri,
        crs: aiPatterns.crs,
        scs: aiPatterns.scs,
        ccn: techDebt.cyclomaticComplexity,
        nestingDepth: techDebt.nestingDepth,
      },
      linesOfCode: techDebt.linesOfCode,
      cyclomaticComplexity: techDebt.cyclomaticComplexity,
      nestingDepth: techDebt.nestingDepth,
      aiDebtContribution: aiPatterns.aiLikelihood > 0.4 ? 45 + aiPatterns.aiLikelihood * 50 : 10 + aiPatterns.aiLikelihood * 30,
      explanation: generateExplanation({
        aiLikelihood: aiPatterns.aiLikelihood,
        technicalDebt: techDebt.technicalDebt,
        cognitiveDebt: cogDebt,
        issues: [...aiPatterns.issues, ...techDebt.issues],
        nestingDepth: techDebt.nestingDepth,
        cyclomaticComplexity: techDebt.cyclomaticComplexity,
        linesOfCode: techDebt.linesOfCode,
        propagationScore: 0,
      }),
      datasetScore: 0.5,
    };

    const analysis: AnalysisResult = {
      repoName: fileName.split('/').pop() || "Uploaded Code",
      totalFiles: 1,
      files: [fileAnalysis],
      summary: {
        avgAiLikelihood: aiPatterns.aiLikelihood,
        avgTechnicalDebt: techDebt.technicalDebt,
        avgCognitiveDebt: cogDebt,
        totalIssues: fileAnalysis.issues.length,
        highRiskFiles: aiPatterns.aiLikelihood > 0.6 ? 1 : 0,
        topRefactorTargets: [fileName],
        aiContribution: fileAnalysis.aiDebtContribution,
      },
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("analyze-code error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateExplanation(f: {
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  issues: string[];
  nestingDepth: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  propagationScore: number;
}): string {
  const parts: string[] = [];
  if (f.aiLikelihood > 0.7) {
    const signals = f.issues.filter(i => /uniformity|repetition|generic|redundant|consistent/.test(i)).slice(0, 2);
    parts.push(`Strong AI-generation signals (${(f.aiLikelihood*100).toFixed(0)}%)${signals.length ? ' — ' + signals.join(', ') : ''}.`);
  } else if (f.aiLikelihood > 0.4) {
    parts.push(`Moderate AI indicators (${(f.aiLikelihood*100).toFixed(0)}%).`);
  }
  if (f.technicalDebt > 0.5) {
    const reasons: string[] = [];
    if (f.cyclomaticComplexity > 10) reasons.push(`complexity of ${f.cyclomaticComplexity}`);
    if (f.nestingDepth > 3) reasons.push(`${f.nestingDepth}-level nesting`);
    if (f.linesOfCode > 200) reasons.push(`${f.linesOfCode} LOC`);
    parts.push(`High technical debt${reasons.length ? ': ' + reasons.join(', ') : ''}.`);
  }
  if (f.cognitiveDebt > 0.5) {
    const cogSignals = f.issues.filter(i => /naming|readability|cognitive|abstraction/.test(i)).slice(0, 2);
    parts.push(`Hard to understand${cogSignals.length ? ' — ' + cogSignals.join(', ') : ''}.`);
  }
  return parts.length ? parts.join(' ') : 'Relatively clean with low debt indicators.';
}
