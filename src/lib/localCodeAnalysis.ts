import type { AnalysisResult, FileAnalysis } from "./mockAnalysis";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function floorMetric(value: number, min = 0.08, max = 0.98) {
  return round(clamp(value, min, max));
}

function detectAIPatterns(content: string) {
  const lines = content.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const totalLines = Math.max(lines.length, 1);
  const issues: string[] = [];
  let strongSignals = 0;
  let humanSignals = 0;
  let humanPenalty = 0;

  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?\}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map((body) => body.replace(/\s+/g, " ").replace(/[\w]+/g, "X").substring(0, 50));
    sus = round(1 - new Set(stripped).size / funcBodies.length);
  }

  let score = 0;
  if (sus > 0.72) { score += 0.26; issues.push("high structural uniformity"); strongSignals++; }
  else if (sus > 0.52) { score += 0.14; issues.push("moderate structural uniformity"); }

  const tokens = content.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const token of tokens) tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, Math.max(5, Math.floor(freqs.length * 0.15))).reduce((sum, value) => sum + value, 0);
  const tdd = round(Math.min(topFreqSum / Math.max(tokens.length, 1), 1));
  if (tdd > 0.42) { score += 0.18; issues.push("skewed token distribution"); strongSignals++; }
  else if (tdd > 0.30) { score += 0.08; issues.push("unbalanced token usage"); }

  const lineFrequency = new Map<string, number>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 15) lineFrequency.set(trimmed, (lineFrequency.get(trimmed) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter((count) => count >= 2).length;
  const pri = round(Math.min(duplicated / Math.max(nonEmptyLines.length * 0.12, 1), 1));
  if (pri > 0.45) { score += 0.24; issues.push("high pattern repetition"); strongSignals++; }
  else if (pri > 0.20) { score += 0.10; issues.push("moderate pattern repetition"); }

  const commentLines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*");
  });
  const obviousComments = commentLines.filter((line) => /\b(get|set|create|initialize|check|return|call|loop|iterate|update|delete|add|fetch|render|handle|process)\b/i.test(line)).length;
  const crs = commentLines.length > 0 ? round(Math.min(obviousComments / commentLines.length, 1)) : 0;
  const commentRatio = round(commentLines.length / totalLines);
  if (crs > 0.65) { score += 0.16; issues.push("highly redundant comments"); strongSignals++; }
  else if (crs > 0.40) { score += 0.08; issues.push("some redundant comments"); }
  if (commentRatio > 0.25) { score += 0.12; issues.push("excessive comment density"); strongSignals++; }
  else if (commentRatio > 0.15) { score += 0.05; issues.push("high comment ratio"); }

  const lineLengths = nonEmptyLines.map((line) => line.length);
  const avgLineLength = lineLengths.reduce((sum, value) => sum + value, 0) / Math.max(lineLengths.length, 1);
  const variance = lineLengths.reduce((sum, value) => sum + Math.pow(value - avgLineLength, 2), 0) / Math.max(lineLengths.length, 1);
  const stdDev = Math.sqrt(variance);
  const scs = round(Math.max(0, 1 - Math.min(stdDev / 25, 1)));
  if (scs > 0.8 && nonEmptyLines.length > 25) { score += 0.14; issues.push("suspiciously uniform formatting"); strongSignals++; }
  else if (scs > 0.65 && nonEmptyLines.length > 20) { score += 0.06; issues.push("very consistent style"); }

  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|x|y|z|i|j|k)\b/g) || [];
  const genericDensity = round(Math.min(genericNames.length / Math.max(tokens.length, 1), 1));
  if (genericDensity > 0.11) { score += 0.17; issues.push("overly generic identifier names"); strongSignals++; }
  else if (genericDensity > 0.06) { score += 0.08; issues.push("some generic naming"); }

  const entropy = round(Math.min(stdDev / 25, 1));
  if (entropy < 0.30) { score += 0.12; issues.push("low code entropy"); strongSignals++; }
  else if (entropy < 0.45) { score += 0.05; issues.push("reduced structural variation"); }

  const hasAsync = content.includes("async") || content.includes("await") || content.includes("Promise");
  const hasErrorHandling = (content.includes("try") && content.includes("catch")) || content.includes(".catch");
  if (hasAsync && !hasErrorHandling) { score += 0.08; issues.push("missing error handling"); }

  const assertionCount = (content.match(/\b(expect|assert|should|describe|it)\b/g) || []).length;
  if (assertionCount >= 3) { humanPenalty += 0.05; humanSignals++; }
  if (hasAsync && hasErrorHandling) { humanPenalty += 0.05; humanSignals++; }
  const uniqueTokenRatio = Math.min(tokenFreq.size / Math.max(tokens.length, 1), 1);
  if (uniqueTokenRatio > 0.45 && entropy > 0.55) { humanPenalty += 0.05; humanSignals++; }

  const aiSignature = { sus: 0.58, tdd: 0.40, pri: 0.42, crs: 0.48, genericDensity: 0.09, entropy: 0.32 };
  const humanSignature = { sus: 0.22, tdd: 0.18, pri: 0.12, crs: 0.15, genericDensity: 0.03, entropy: 0.58 };
  const aiDist =
    Math.abs(sus - aiSignature.sus) +
    Math.abs(tdd - aiSignature.tdd) +
    Math.abs(pri - aiSignature.pri) +
    Math.abs(crs - aiSignature.crs) +
    Math.abs(genericDensity - aiSignature.genericDensity) +
    Math.abs(entropy - aiSignature.entropy);
  const humanDist =
    Math.abs(sus - humanSignature.sus) +
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

  return {
    aiLikelihood: floorMetric(aiLikelihood, 0.03, 0.98),
    issues: [...new Set(issues)].slice(0, 8),
    sus: floorMetric(sus),
    tdd: floorMetric(tdd),
    pri: floorMetric(pri),
    crs: floorMetric(crs),
    scs: floorMetric(scs),
  };
}

function detectTechnicalDebt(content: string) {
  const lines = content.split("\n");
  const linesOfCode = lines.filter((line) => line.trim().length > 0).length;
  const issues: string[] = [];
  let debt = 0;

  const branches = (content.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/g) || []).length;
  const cyclomaticComplexity = 1 + branches;
  if (cyclomaticComplexity > 15) { debt += 0.30; issues.push("high cyclomatic complexity"); }
  else if (cyclomaticComplexity > 8) { debt += 0.18; }

  let maxDepth = 0;
  let depth = 0;
  for (const ch of content) {
    if (ch === "{") { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === "}") depth--;
  }
  if (maxDepth > 4) { debt += 0.30; issues.push("deep nesting"); }
  if (linesOfCode > 300) { debt += 0.25; issues.push("large file (>300 LOC)"); }
  else if (linesOfCode > 200) { debt += 0.15; }

  const dupeLines = new Map<string, number>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20) dupeLines.set(trimmed, (dupeLines.get(trimmed) || 0) + 1);
  }
  const dups = [...dupeLines.values()].filter((count) => count > 2).length;
  if (dups > 1) { debt += 0.15; issues.push("duplicate code blocks"); }

  return {
    technicalDebt: round(Math.max(Math.min(debt, 1), 0.08)),
    cyclomaticComplexity,
    nestingDepth: maxDepth,
    linesOfCode,
    issues,
  };
}

function detectCognitiveDebt(content: string, aiLikelihood: number) {
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  let maxDepth = 0;
  let depth = 0;
  for (const ch of content) {
    if (ch === "{") { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === "}") depth--;
  }
  const raw = 0.7 * Math.min((Math.pow(maxDepth, 2) + controlFlow) / 20, 1) + 0.3 * Math.min(aiLikelihood * 0.5, 1);
  return round(Math.max(Math.min(raw, 1), 0.12));
}

function buildMetrics(content: string, ai: ReturnType<typeof detectAIPatterns>, tech: ReturnType<typeof detectTechnicalDebt>, cognitiveDebt: number, issues: string[]) {
  const lines = content.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const totalLines = Math.max(nonEmptyLines.length, 1);
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgIdLen = identifiers.reduce((sum, id) => sum + id.length, 0) / Math.max(identifiers.length, 1);
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch|case)\b/g) || []).length;
  const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*\{)/g) || [];
  const functions = Math.max(functionMatches.length, 1);
  const commentLines = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*");
  });
  const obviousComments = commentLines.filter((line) => /\b(get|set|create|initialize|check|return|call|loop|iterate|update|delete|add|fetch|render|handle|process)\b/i.test(line)).length;
  const commentRatio = commentLines.length / totalLines;
  const lineLengths = nonEmptyLines.map((line) => line.length);
  const avgLineLength = lineLengths.reduce((sum, value) => sum + value, 0) / totalLines;
  const variance = lineLengths.reduce((sum, value) => sum + Math.pow(value - avgLineLength, 2), 0) / totalLines;
  const stdDev = Math.sqrt(variance);
  const mutableVars = (content.match(/\b(let|var)\s+\w+/g) || []).length;
  const reassignments = (content.match(/\b[a-zA-Z_]\w*\s*=[^=]/g) || []).length;
  const importCount = (content.match(/\b(import|require|from)\b/g) || []).length;
  const abstractionLayers = (content.match(/class\s+\w+|interface\s+\w+|abstract\s+/g) || []).length;

  const complexityFactor = clamp(tech.cyclomaticComplexity / 20);
  const nestingFactor = clamp(tech.nestingDepth / 6);
  const sizeFactor = clamp(tech.linesOfCode / 320);
  const functionFactor = clamp(functions / 20);
  const issueFactor = clamp(issues.length / 8);
  const identifierClarity = clamp(avgIdLen / 12);

  const c = floorMetric(tech.cyclomaticComplexity > 15 ? 0.35 : tech.cyclomaticComplexity > 8 ? 0.22 : complexityFactor * 0.22 + 0.08);
  const n = floorMetric(tech.nestingDepth > 4 ? 0.35 : tech.nestingDepth > 3 ? 0.22 : nestingFactor * 0.22 + 0.08);
  const d = floorMetric(issueFactor * 0.10 + ai.pri * 0.35, 0.08, 0.3);
  const s = floorMetric(tech.linesOfCode > 300 ? 0.32 : tech.linesOfCode > 200 ? 0.2 : sizeFactor * 0.18 + 0.08);
  const m = floorMetric(functions > 20 ? 0.14 : functions > 10 ? 0.1 : functionFactor * 0.06 + 0.06, 0.06, 0.2);
  const tds = floorMetric(c + n + d + s + m, 0.12, 0.98);

  const ccd = floorMetric(controlFlow / (totalLines * 0.12 + 1), 0.1, 0.95);
  const es = floorMetric(identifierClarity, 0.15, 0.9);
  const aes = floorMetric(stdDev / 40, 0.1, 0.95);
  const rdi = floorMetric(commentRatio > 0.3 ? 0.8 : commentRatio >= 0.05 ? 0.3 : 0.55, 0.15, 0.85);
  const cu = floorMetric(commentLines.length > 0 ? 1 - obviousComments / commentLines.length : 0.45, 0.15, 0.95);
  const fr = floorMetric(1 - clamp(sizeFactor * 0.4 + nestingFactor * 0.35 + (1 - identifierClarity) * 0.25), 0.15, 0.9);
  const cds = floorMetric(0.25 * ccd + 0.2 * (1 - es) + 0.2 * aes + 0.15 * rdi + 0.1 * cu + 0.1 * fr, 0.12, 0.98);

  const cp = floorMetric(issueFactor * 0.55 + ai.aiLikelihood * 0.15 + 0.12, 0.1, 0.9);
  const tc = floorMetric(cp * complexityFactor + 0.08, 0.1, 0.95);
  const ddp = floorMetric(issues.length / Math.max(tech.linesOfCode / 100, 1), 0.08, 0.9);
  const mds = floorMetric(importCount / Math.max(functions * 1.5, 1), 0.08, 0.9);
  const dps = floorMetric(0.6 * tds + 0.4 * ai.aiLikelihood, 0.1, 0.98);
  const dli = floorMetric(0.5 * tds + 0.5 * ccd, 0.1, 0.98);
  const drf = floorMetric(0.4 * aes + 0.3 * tds + 0.3 * ai.aiLikelihood, 0.1, 0.98);
  const cli = floorMetric(nestingFactor * 0.4 + complexityFactor * 0.35 + clamp(avgLineLength / 80) * 0.25, 0.1, 0.95);
  const ias = floorMetric(ai.aiLikelihood * 0.45 + issueFactor * 0.2, 0.1, 0.9);
  const ags = floorMetric(Math.abs(clamp(controlFlow / 20) - clamp(abstractionLayers / 6)), 0.08, 0.85);
  const ri = floorMetric(1 - clamp((avgLineLength / 90) * 0.35 + nestingFactor * 0.35 + (1 - identifierClarity) * 0.3), 0.12, 0.9);
  const csc = floorMetric((importCount + abstractionLayers) / 18, 0.08, 0.9);
  const ird = floorMetric(1 - identifierClarity, 0.08, 0.9);
  const cfsc = floorMetric((tech.cyclomaticComplexity * tech.nestingDepth) / Math.max(tech.linesOfCode, 1), 0.08, 0.9);
  const stl = floorMetric((mutableVars * Math.max(reassignments, 1)) / Math.max(totalLines * 2, 1), 0.08, 0.8);
  const drc = floorMetric(importCount / 20, 0.08, 0.8);
  const aic = floorMetric(abstractionLayers / Math.max(controlFlow * 0.4, 1), 0.08, 0.8);
  const ceb = floorMetric(0.25 * ird + 0.2 * cfsc + 0.2 * stl + 0.2 * drc + 0.15 * aic, 0.1, 0.95);
  const dcs = floorMetric(0.25 * ird + 0.2 * cfsc + 0.2 * stl + 0.2 * drc + 0.15 * aic, 0.1, 0.95);
  const adaf = round(Math.max((tech.technicalDebt + cognitiveDebt) / Math.max(ai.aiLikelihood * 0.3, 0.05), 0.8));
  const ctd = floorMetric((tech.nestingDepth / 6 + tech.cyclomaticComplexity / 20) * ai.aiLikelihood, 0.08, 0.95);
  const srd = floorMetric(ai.pri, 0.08, 0.85);
  const aam = floorMetric((abstractionLayers / Math.max(functions, 1)) * (1 + ai.aiLikelihood), 0.08, 0.95);
  const ios = floorMetric(1 - es, 0.08, 0.9);
  const hmmd = floorMetric(ai.sus * 0.4 + ai.pri * 0.3 + (1 - es) * 0.3, 0.08, 0.95);
  const aitdis = floorMetric(0.2 * Math.min(adaf / 10, 1) + 0.15 * ctd + 0.15 * srd + 0.15 * aam + 0.1 * ios + 0.1 * dps + 0.15 * hmmd, 0.08, 0.98);
  const actdi = floorMetric(0.4 * dcs + 0.3 * dps + 0.2 * ((ddp + mds) / 2) + 0.1 * (1 - ri), 0.08, 0.98);

  return {
    functions,
    metrics: {
      tds, c, n, d, s, m, cds, cu, fr, ceb, ccd, es, aes, rdi, dps, dli, drf,
      cp, ccn: tech.cyclomaticComplexity, tc, ddp, mds, cli, ias, ags, ri, csc,
      sus: ai.sus, tdd: ai.tdd, pri: ai.pri, crs: ai.crs, scs: ai.scs,
      adaf, ctd, srd, aam, ios, hmmd, aitdis, ird, cfsc, stl, drc, aic, dcs, actdi,
    },
  };
}

function buildExplanation(file: FileAnalysis) {
  const parts: string[] = [];
  if (file.aiLikelihood > 0.7) parts.push(`Strong AI-generation signals (${Math.round(file.aiLikelihood * 100)}%)`);
  else if (file.aiLikelihood > 0.4) parts.push(`Moderate AI indicators (${Math.round(file.aiLikelihood * 100)}%)`);
  if (file.technicalDebt > 0.5) parts.push(`High technical debt from complexity, nesting, size, or duplication`);
  if (file.cognitiveDebt > 0.5) parts.push(`High cognitive burden for readers and reviewers`);
  return parts.length ? `${parts.join(". ")}.` : "Relatively clean with low debt indicators.";
}

export function analyzeLocalCode(code: string, fileName = "uploaded_code"): AnalysisResult {
  const ai = detectAIPatterns(code);
  const tech = detectTechnicalDebt(code);
  const cognitiveDebt = detectCognitiveDebt(code, ai.aiLikelihood);
  const issues = [...new Set([...ai.issues, ...tech.issues])].slice(0, 8);
  const derived = buildMetrics(code, ai, tech, cognitiveDebt, issues);

  const fileAnalysis: FileAnalysis = {
    file: fileName,
    aiLikelihood: ai.aiLikelihood,
    technicalDebt: tech.technicalDebt,
    cognitiveDebt,
    propagationScore: round(tech.technicalDebt * 0.6 + ai.aiLikelihood * 0.4),
    issues,
    metrics: derived.metrics,
    linesOfCode: tech.linesOfCode,
    functions: derived.functions,
    cyclomaticComplexity: tech.cyclomaticComplexity,
    nestingDepth: tech.nestingDepth,
    aiDebtContribution: ai.aiLikelihood > 0.4 ? round(45 + ai.aiLikelihood * 50) : round(10 + ai.aiLikelihood * 30),
    explanation: "",
    datasetScore: 0.5,
    featureVector: [derived.metrics.tds, derived.metrics.cds, derived.metrics.sus, derived.metrics.pri, derived.metrics.ccd, derived.metrics.cli],
  };
  fileAnalysis.explanation = buildExplanation(fileAnalysis);

  return {
    repoName: fileName.split("/").pop() || "Uploaded Code",
    totalFiles: 1,
    files: [fileAnalysis],
    propagation: [],
    summary: {
      avgAiLikelihood: fileAnalysis.aiLikelihood,
      avgTechnicalDebt: fileAnalysis.technicalDebt,
      avgCognitiveDebt: fileAnalysis.cognitiveDebt,
      totalIssues: fileAnalysis.issues.length,
      highRiskFiles: fileAnalysis.aiLikelihood > 0.6 ? 1 : 0,
      topRefactorTargets: [fileName],
      aiContribution: fileAnalysis.aiDebtContribution,
    },
  };
}
