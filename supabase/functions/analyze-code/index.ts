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
  functions: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
  explanation: string;
  datasetScore: number;
  featureVector?: number[];
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
  let strongSignals = 0;
  let humanSignals = 0;
  let humanPenalty = 0;

  // SUS
  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?\}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/[\w]+/g, 'X').substring(0, 50));
    const uniq = new Set(stripped).size;
    sus = Math.round((1 - uniq / funcBodies.length) * 100) / 100;
  }
  let score = 0;
  if (sus > 0.72) { score += 0.26; issues.push('high structural uniformity'); strongSignals++; }
  else if (sus > 0.52) { score += 0.14; issues.push('moderate structural uniformity'); }

  // TDD
  const tokens = content.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, Math.max(5, Math.floor(freqs.length * 0.15))).reduce((s, v) => s + v, 0);
  const tdd = Math.round(Math.min(topFreqSum / (tokens.length || 1), 1) * 100) / 100;
  if (tdd > 0.42) { score += 0.18; issues.push('skewed token distribution'); strongSignals++; }
  else if (tdd > 0.3) { score += 0.08; issues.push('unbalanced token usage'); }

  // PRI
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 15) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  const pri = Math.round(Math.min(duplicated / Math.max(neLen * 0.12, 1), 1) * 100) / 100;
  if (pri > 0.45) { score += 0.24; issues.push('high pattern repetition'); strongSignals++; }
  else if (pri > 0.2) { score += 0.1; issues.push('moderate pattern repetition'); }

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
  if (crs > 0.65) { score += 0.16; issues.push('highly redundant comments'); strongSignals++; }
  else if (crs > 0.4) { score += 0.08; issues.push('some redundant comments'); }
  if (commentRatio > 0.25) { score += 0.12; issues.push('excessive comment density'); strongSignals++; }
  else if (commentRatio > 0.15) { score += 0.05; issues.push('high comment ratio'); }

  // SCS
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / (lineLens.length || 1);
  const variance = lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / (lineLens.length || 1);
  const stdDev = Math.sqrt(variance);
  const scs = Math.round(Math.max(0, 1 - Math.min(stdDev / 25, 1)) * 100) / 100;
  if (scs > 0.8 && neLen > 25) { score += 0.14; issues.push('suspiciously uniform formatting'); strongSignals++; }
  else if (scs > 0.65 && neLen > 20) { score += 0.06; issues.push('very consistent style'); }

  // Generic names
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|x|y|z|i|j|k)\b/g);
  const genericDensity = genericNames ? Math.round(Math.min((genericNames.length / (tokens.length || 1)) * 100, 1) * 100) / 100 : 0;
  if (genericDensity > 0.11) { score += 0.17; issues.push('overly generic identifier names'); strongSignals++; }
  else if (genericDensity > 0.06) { score += 0.08; issues.push('some generic naming'); }

  const entropy = Math.round((Math.min(stdDev / 25, 1)) * 100) / 100;
  if (entropy < 0.3) { score += 0.12; issues.push('low code entropy'); strongSignals++; }
  else if (entropy < 0.45) { score += 0.05; issues.push('reduced structural variation'); }

  const importLines = lines.filter(l => l.trim().match(/^import\s+/));
  if (importLines.length > 8) {
    const sorted = [...importLines].sort();
    const isSorted = JSON.stringify(importLines.map(l => l.trim())) === JSON.stringify(sorted.map(l => l.trim()));
    if (isSorted) { score += 0.06; issues.push('perfectly sorted imports'); }
  }

  const hasAsync = content.includes('async') || content.includes('await') || content.includes('Promise');
  const hasTryCatch = content.includes('try') && content.includes('catch');
  const hasErrorHandling = hasTryCatch || content.includes('.catch');
  if (hasAsync && !hasErrorHandling) { score += 0.08; issues.push('missing error handling'); }

  const assertionCount = (content.match(/\b(expect|assert|should|describe|it)\b/g) || []).length;
  if (assertionCount >= 3) { humanPenalty += 0.05; humanSignals++; }
  if (hasAsync && hasErrorHandling) { humanPenalty += 0.05; humanSignals++; }
  const uniqueTokenRatio = Math.min(tokenFreq.size / Math.max(tokens.length, 1), 1);
  if (uniqueTokenRatio > 0.45 && entropy > 0.55) { humanPenalty += 0.05; humanSignals++; }

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
  let aiLikelihood = score * 0.62 + featureScore * 0.38 - humanPenalty;
  if (strongSignals < 2) aiLikelihood = Math.min(aiLikelihood, 0.58);
  if (strongSignals >= 4) aiLikelihood += 0.04;
  if (humanSignals >= 2) aiLikelihood -= 0.03;
  aiLikelihood = Math.min(Math.max(aiLikelihood, 0.03), 0.98);

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

function r(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function floorMetric(value: number, min = 0.08, max = 0.98) {
  return r(clamp(value, min, max));
}

function buildDeterministicMetrics(
  content: string,
  aiPatterns: ReturnType<typeof detectAIPatterns>,
  techDebt: ReturnType<typeof detectTechnicalDebt>,
  cognitiveDebt: number,
  combinedIssues: string[],
) {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const totalLines = Math.max(nonEmptyLines.length, 1);
  const tokens = content.match(/\b\w+\b/g) || [];
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgIdLen = identifiers.reduce((sum, id) => sum + id.length, 0) / (identifiers.length || 1);
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch|case)\b/g) || []).length;
  const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*\{)/g) || [];
  const functions = Math.max(functionMatches.length, 1);
  const commentLines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  });
  const obviousComments = commentLines.filter((line) => /\b(get|set|create|initialize|check|return|call|loop|iterate|update|delete|add|fetch|render|handle|process)\b/i.test(line)).length;
  const commentRatio = commentLines.length / totalLines;
  const lineLengths = nonEmptyLines.map((line) => line.length);
  const avgLineLength = lineLengths.reduce((sum, len) => sum + len, 0) / totalLines;
  const variance = lineLengths.reduce((sum, len) => sum + Math.pow(len - avgLineLength, 2), 0) / totalLines;
  const stdDev = Math.sqrt(variance);
  const mutableVars = (content.match(/\b(let|var)\s+\w+/g) || []).length;
  const reassignments = (content.match(/\b[a-zA-Z_]\w*\s*=[^=]/g) || []).length;
  const importCount = (content.match(/\b(import|require|from)\b/g) || []).length;
  const abstractionLayers = (content.match(/class\s+\w+|interface\s+\w+|abstract\s+/g) || []).length;
  const repeatedLines = (() => {
    const frequency = new Map<string, number>();
    for (const line of nonEmptyLines) {
      const trimmed = line.trim();
      if (trimmed.length > 15) frequency.set(trimmed, (frequency.get(trimmed) || 0) + 1);
    }
    return [...frequency.values()].filter((count) => count >= 2).reduce((sum, count) => sum + count, 0);
  })();

  const complexityFactor = clamp(techDebt.cyclomaticComplexity / 20);
  const nestingFactor = clamp(techDebt.nestingDepth / 6);
  const sizeFactor = clamp(techDebt.linesOfCode / 320);
  const functionFactor = clamp(functions / 20);
  const issueFactor = clamp(combinedIssues.length / 8);
  const identifierClarity = clamp(avgIdLen / 12);

  const c = floorMetric(techDebt.cyclomaticComplexity > 15 ? 0.35 : techDebt.cyclomaticComplexity > 8 ? 0.22 : complexityFactor * 0.22 + 0.08);
  const n = floorMetric(techDebt.nestingDepth > 4 ? 0.35 : techDebt.nestingDepth > 3 ? 0.22 : nestingFactor * 0.22 + 0.08);
  const d = floorMetric(repeatedLines > 4 ? 0.18 : repeatedLines > 0 ? 0.11 : issueFactor * 0.08 + 0.08);
  const s = floorMetric(techDebt.linesOfCode > 300 ? 0.32 : techDebt.linesOfCode > 200 ? 0.2 : sizeFactor * 0.18 + 0.08);
  const m = floorMetric(functions > 20 ? 0.14 : functions > 10 ? 0.1 : functionFactor * 0.06 + 0.06, 0.06, 0.2);
  const tds = floorMetric(c + n + d + s + m, 0.12, 0.98);

  const sus = floorMetric(aiPatterns.sus || aiPatterns.aiLikelihood * 0.65 + functionFactor * 0.08);
  const tdd = floorMetric(aiPatterns.tdd || issueFactor * 0.25 + aiPatterns.aiLikelihood * 0.3);
  const pri = floorMetric(aiPatterns.pri || repeatedLines / Math.max(totalLines * 0.12, 1));
  const crs = floorMetric(aiPatterns.crs || (commentLines.length > 0 ? obviousComments / commentLines.length : 0.08));
  const scs = floorMetric(aiPatterns.scs || (1 - Math.min(stdDev / 25, 1)));

  const ccd = floorMetric(controlFlow / (totalLines * 0.12 + 1), 0.1, 0.95);
  const es = floorMetric(identifierClarity, 0.15, 0.9);
  const aes = floorMetric(stdDev / 40, 0.1, 0.95);
  const rdi = floorMetric(commentRatio > 0.3 ? 0.8 : commentRatio >= 0.05 ? 0.3 : 0.55, 0.15, 0.85);
  const cu = floorMetric(commentLines.length > 0 ? 1 - obviousComments / commentLines.length : 0.45, 0.15, 0.95);
  const fr = floorMetric(1 - clamp((sizeFactor * 0.4) + (nestingFactor * 0.35) + ((1 - identifierClarity) * 0.25)), 0.15, 0.9);
  const cds = floorMetric(0.25 * ccd + 0.2 * (1 - es) + 0.2 * aes + 0.15 * rdi + 0.1 * cu + 0.1 * fr, 0.12, 0.98);

  const cp = floorMetric(issueFactor * 0.55 + aiPatterns.aiLikelihood * 0.15 + 0.12, 0.1, 0.9);
  const tc = floorMetric(cp * complexityFactor + 0.08, 0.1, 0.95);
  const ddp = floorMetric(combinedIssues.length / Math.max(techDebt.linesOfCode / 100, 1), 0.08, 0.9);
  const mds = floorMetric(importCount / Math.max(functions * 1.5, 1), 0.08, 0.9);

  const dps = floorMetric(0.6 * tds + 0.4 * aiPatterns.aiLikelihood, 0.1, 0.98);
  const dli = floorMetric(0.5 * tds + 0.5 * ccd, 0.1, 0.98);
  const drf = floorMetric(0.4 * aes + 0.3 * tds + 0.3 * aiPatterns.aiLikelihood, 0.1, 0.98);

  const cli = floorMetric(nestingFactor * 0.4 + complexityFactor * 0.35 + clamp(avgLineLength / 80) * 0.25, 0.1, 0.95);
  const genericIdentifiers = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|x|y|z|i|j|k)\b/g) || [];
  const ias = floorMetric(genericIdentifiers.length / Math.max(identifiers.length, 1), 0.1, 0.9);
  const ags = floorMetric(Math.abs(clamp(controlFlow / 20) - clamp(abstractionLayers / 6)), 0.08, 0.85);
  const ri = floorMetric(1 - clamp((avgLineLength / 90) * 0.35 + nestingFactor * 0.35 + (1 - identifierClarity) * 0.3), 0.12, 0.9);
  const csc = floorMetric((importCount + abstractionLayers) / 18, 0.08, 0.9);

  const ird = floorMetric(1 - identifierClarity, 0.08, 0.9);
  const cfsc = floorMetric((techDebt.cyclomaticComplexity * techDebt.nestingDepth) / Math.max(techDebt.linesOfCode, 1), 0.08, 0.9);
  const stl = floorMetric((mutableVars * Math.max(reassignments, 1)) / Math.max(totalLines * 2, 1), 0.08, 0.8);
  const drc = floorMetric(importCount / 20, 0.08, 0.8);
  const aic = floorMetric(abstractionLayers / Math.max(controlFlow * 0.4, 1), 0.08, 0.8);
  const ceb = floorMetric(0.25 * ird + 0.2 * cfsc + 0.2 * stl + 0.2 * drc + 0.15 * aic, 0.1, 0.95);
  const dcs = floorMetric(0.25 * ird + 0.2 * cfsc + 0.2 * stl + 0.2 * drc + 0.15 * aic, 0.1, 0.95);

  const adaf = r(Math.max((techDebt.technicalDebt + cognitiveDebt) / Math.max(aiPatterns.aiLikelihood * 0.3, 0.05), 0.8));
  const ctd = floorMetric((techDebt.nestingDepth / 6 + techDebt.cyclomaticComplexity / 20) * aiPatterns.aiLikelihood, 0.08, 0.95);
  const srd = floorMetric(repeatedLines / Math.max(totalLines * 0.15, 1), 0.08, 0.85);
  const aam = floorMetric((abstractionLayers / Math.max(functions, 1)) * (1 + aiPatterns.aiLikelihood), 0.08, 0.95);
  const ios = floorMetric(1 - es, 0.08, 0.9);
  const hmmd = floorMetric(sus * 0.4 + pri * 0.3 + (1 - es) * 0.3, 0.08, 0.95);
  const aitdis = floorMetric(0.2 * Math.min(adaf / 10, 1) + 0.15 * ctd + 0.15 * srd + 0.15 * aam + 0.1 * ios + 0.1 * dps + 0.15 * hmmd, 0.08, 0.98);
  const actdi = floorMetric(0.4 * dcs + 0.3 * dps + 0.2 * ((ddp + mds) / 2) + 0.1 * (1 - ri), 0.08, 0.98);

  return {
    functions,
    metrics: {
      tds, c, n, d, s, m, cds, cu, fr, ceb, ccd, es, aes, rdi, dps, dli, drf,
      cp, ccn: techDebt.cyclomaticComplexity, tc, ddp, mds, cli, ias, ags, ri, csc,
      sus, tdd, pri, crs, scs, adaf, ctd, srd, aam, ios, hmmd, aitdis,
      ird, cfsc, stl, drc, aic, dcs, actdi,
    },
  };
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

    const combinedIssues = [...new Set([...aiPatterns.issues, ...techDebt.issues])].slice(0, 8);
    const derived = buildDeterministicMetrics(code, aiPatterns, techDebt, cogDebt, combinedIssues);

    const fileAnalysis: FileAnalysis = {
      file: fileName,
      aiLikelihood: aiPatterns.aiLikelihood,
      technicalDebt: techDebt.technicalDebt,
      cognitiveDebt: cogDebt,
      propagationScore: (techDebt.technicalDebt * 0.6 + aiPatterns.aiLikelihood * 0.4),
      issues: combinedIssues,
      metrics: derived.metrics,
      linesOfCode: techDebt.linesOfCode,
      functions: derived.functions,
      cyclomaticComplexity: techDebt.cyclomaticComplexity,
      nestingDepth: techDebt.nestingDepth,
      aiDebtContribution: aiPatterns.aiLikelihood > 0.4 ? 45 + aiPatterns.aiLikelihood * 50 : 10 + aiPatterns.aiLikelihood * 30,
      explanation: generateExplanation({
        aiLikelihood: aiPatterns.aiLikelihood,
        technicalDebt: techDebt.technicalDebt,
        cognitiveDebt: cogDebt,
        issues: combinedIssues,
        nestingDepth: techDebt.nestingDepth,
        cyclomaticComplexity: techDebt.cyclomaticComplexity,
        linesOfCode: techDebt.linesOfCode,
        propagationScore: 0,
      }),
      datasetScore: 0.5,
      featureVector: [
        derived.metrics.tds,
        derived.metrics.cds,
        derived.metrics.sus,
        derived.metrics.pri,
        derived.metrics.ccd,
        derived.metrics.cli,
      ],
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
