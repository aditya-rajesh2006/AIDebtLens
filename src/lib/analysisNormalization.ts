import type { AnalysisResult, FileAnalysis } from "./mockAnalysis";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function pickMetric(value: unknown, fallback: number) {
  const numericValue = safeNumber(value, NaN);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function withFloor(value: number, min = 0.08, max = 0.98) {
  return round(clamp(value, min, max));
}

function normalizeFileMetrics(file: FileAnalysis) {
  const metrics = { ...file.metrics };
  const safeFunctions = Math.max(1, Math.round(safeNumber(file.functions, 1)));
  const safeLoc = Math.max(1, Math.round(safeNumber(file.linesOfCode, 1)));
  const safeComplexity = Math.max(1, Math.round(safeNumber(file.cyclomaticComplexity, 1)));
  const safeNesting = Math.max(1, Math.round(safeNumber(file.nestingDepth, 1)));
  const safeIssues = Array.isArray(file.issues) ? file.issues : [];
  const issueFactor = clamp(safeIssues.length / 8, 0.08, 0.9);
  const complexityFactor = clamp(safeComplexity / 20, 0.08, 0.95);
  const nestingFactor = clamp(safeNesting / 6, 0.08, 0.95);
  const sizeFactor = clamp(safeLoc / 350, 0.08, 0.95);
  const functionFactor = clamp(safeFunctions / 20, 0.08, 0.9);
  const aiFactor = clamp(safeNumber(file.aiLikelihood, 0.08), 0.08, 0.98);
  const techFactor = clamp(safeNumber(file.technicalDebt, 0.08), 0.08, 0.98);
  const cogFactor = clamp(safeNumber(file.cognitiveDebt, 0.08), 0.08, 0.98);

  metrics.c = withFloor(pickMetric(metrics.c, complexityFactor * 0.9));
  metrics.n = withFloor(pickMetric(metrics.n, nestingFactor * 0.9));
  metrics.d = withFloor(pickMetric(metrics.d, clamp(issueFactor * 0.55 + aiFactor * 0.2, 0.08, 0.8)));
  metrics.s = withFloor(pickMetric(metrics.s, sizeFactor * 0.9));
  metrics.m = withFloor(pickMetric(metrics.m, functionFactor * 0.7));
  metrics.tds = withFloor(pickMetric(metrics.tds, metrics.c + metrics.n + metrics.d + metrics.s + metrics.m), 0.12, 0.98);

  metrics.ccd = withFloor(pickMetric(metrics.ccd, clamp(complexityFactor * 0.55 + nestingFactor * 0.45, 0.1, 0.95)));
  metrics.es = withFloor(pickMetric(metrics.es, clamp(1 - aiFactor * 0.35 - issueFactor * 0.2, 0.15, 0.9)));
  metrics.aes = withFloor(pickMetric(metrics.aes, clamp(aiFactor * 0.7 + sizeFactor * 0.15, 0.1, 0.95)));
  metrics.rdi = withFloor(pickMetric(metrics.rdi, clamp(cogFactor * 0.75 + sizeFactor * 0.1, 0.12, 0.9)));
  metrics.cu = withFloor(pickMetric(metrics.cu, clamp(1 - issueFactor * 0.35, 0.15, 0.9)));
  metrics.fr = withFloor(pickMetric(metrics.fr, clamp(1 - (sizeFactor * 0.3 + nestingFactor * 0.3 + complexityFactor * 0.2), 0.15, 0.9)));
  metrics.cds = withFloor(
    pickMetric(metrics.cds, 0.25 * metrics.ccd + 0.2 * (1 - metrics.es) + 0.2 * metrics.aes + 0.15 * metrics.rdi + 0.1 * metrics.cu + 0.1 * metrics.fr),
    0.12,
    0.98,
  );
  metrics.ceb = withFloor(pickMetric(metrics.ceb, clamp(cogFactor * 0.7 + complexityFactor * 0.15, 0.12, 0.95)));

  metrics.cp = withFloor(pickMetric(metrics.cp, clamp(issueFactor * 0.55 + techFactor * 0.25, 0.1, 0.9)));
  metrics.ccn = Math.max(1, Math.round(pickMetric(metrics.ccn, safeLoc)));
  metrics.tc = withFloor(pickMetric(metrics.tc, clamp(metrics.cp * complexityFactor, 0.1, 0.95)));
  metrics.ddp = withFloor(pickMetric(metrics.ddp, clamp(issueFactor * 0.8, 0.08, 0.9)));
  metrics.mds = withFloor(pickMetric(metrics.mds, clamp(functionFactor * 0.35 + techFactor * 0.35, 0.08, 0.9)));

  metrics.dps = withFloor(pickMetric(metrics.dps, clamp(0.6 * metrics.tds + 0.4 * aiFactor, 0.1, 0.98)));
  metrics.dli = withFloor(pickMetric(metrics.dli, clamp(0.5 * metrics.tds + 0.5 * metrics.ccd, 0.1, 0.98)));
  metrics.drf = withFloor(pickMetric(metrics.drf, clamp(0.4 * metrics.aes + 0.3 * metrics.tds + 0.3 * aiFactor, 0.1, 0.98)));

  metrics.cli = withFloor(pickMetric(metrics.cli, clamp(nestingFactor * 0.45 + complexityFactor * 0.35 + sizeFactor * 0.2, 0.1, 0.95)));
  metrics.ias = withFloor(pickMetric(metrics.ias, clamp(aiFactor * 0.45 + issueFactor * 0.2, 0.1, 0.9)));
  metrics.ags = withFloor(pickMetric(metrics.ags, clamp(aiFactor * 0.35 + functionFactor * 0.15, 0.08, 0.85)));
  metrics.ri = withFloor(pickMetric(metrics.ri, clamp(1 - (sizeFactor * 0.25 + nestingFactor * 0.3 + issueFactor * 0.2), 0.12, 0.9)));
  metrics.csc = withFloor(pickMetric(metrics.csc, clamp(functionFactor * 0.25 + sizeFactor * 0.2 + techFactor * 0.25, 0.1, 0.9)));

  metrics.sus = withFloor(pickMetric(metrics.sus, clamp(aiFactor * 0.7 + functionFactor * 0.1, 0.08, 0.98)));
  metrics.tdd = withFloor(pickMetric(metrics.tdd, clamp(aiFactor * 0.45 + issueFactor * 0.2, 0.08, 0.95)));
  metrics.pri = withFloor(pickMetric(metrics.pri, clamp(issueFactor * 0.4 + aiFactor * 0.35, 0.08, 0.95)));
  metrics.crs = withFloor(pickMetric(metrics.crs, clamp(aiFactor * 0.35 + issueFactor * 0.15, 0.08, 0.9)));
  metrics.scs = withFloor(pickMetric(metrics.scs, clamp(1 - complexityFactor * 0.2 + aiFactor * 0.25, 0.08, 0.98)));

  metrics.ird = withFloor(pickMetric(metrics.ird, clamp(1 - metrics.es, 0.08, 0.9)));
  metrics.cfsc = withFloor(pickMetric(metrics.cfsc, clamp((complexityFactor * nestingFactor) * 1.2, 0.08, 0.9)));
  metrics.stl = withFloor(pickMetric(metrics.stl, clamp(functionFactor * 0.25 + issueFactor * 0.15, 0.08, 0.8)));
  metrics.drc = withFloor(pickMetric(metrics.drc, clamp(sizeFactor * 0.15 + functionFactor * 0.2, 0.08, 0.8)));
  metrics.aic = withFloor(pickMetric(metrics.aic, clamp(metrics.ags * 0.8, 0.08, 0.8)));
  metrics.dcs = withFloor(
    pickMetric(metrics.dcs, 0.25 * metrics.ird + 0.2 * metrics.cfsc + 0.2 * metrics.stl + 0.2 * metrics.drc + 0.15 * metrics.aic),
    0.1,
    0.95,
  );
  metrics.actdi = withFloor(pickMetric(metrics.actdi, clamp(0.4 * metrics.dcs + 0.3 * metrics.dps + 0.2 * ((metrics.ddp + metrics.mds) / 2) + 0.1 * (1 - metrics.ri), 0.1, 0.98)));

  metrics.adaf = round(Math.max(pickMetric(metrics.adaf, (techFactor + cogFactor) / Math.max(aiFactor * 0.35, 0.08)), 0.8));
  metrics.ctd = withFloor(pickMetric(metrics.ctd, clamp(aiFactor * complexityFactor, 0.08, 0.9)));
  metrics.srd = withFloor(pickMetric(metrics.srd, clamp(issueFactor * 0.35, 0.08, 0.8)));
  metrics.aam = withFloor(pickMetric(metrics.aam, clamp(aiFactor * 0.45 + functionFactor * 0.15, 0.08, 0.9)));
  metrics.ios = withFloor(pickMetric(metrics.ios, clamp(1 - metrics.es * 0.9, 0.08, 0.9)));
  metrics.hmmd = withFloor(pickMetric(metrics.hmmd, clamp(metrics.sus * 0.4 + metrics.pri * 0.3 + (1 - metrics.es) * 0.3, 0.08, 0.95)));
  metrics.aitdis = withFloor(
    pickMetric(metrics.aitdis, clamp(0.2 * Math.min(metrics.adaf / 10, 1) + 0.15 * metrics.ctd + 0.15 * metrics.srd + 0.15 * metrics.aam + 0.1 * metrics.ios + 0.1 * metrics.dps + 0.15 * metrics.hmmd, 0.08, 0.98)),
    0.08,
    0.98,
  );

  return {
    ...file,
    functions: safeFunctions,
    linesOfCode: safeLoc,
    cyclomaticComplexity: safeComplexity,
    nestingDepth: safeNesting,
    issues: safeIssues,
    metrics,
  };
}

export function normalizeAnalysisResult(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    files: result.files.map(normalizeFileMetrics),
  };
}
