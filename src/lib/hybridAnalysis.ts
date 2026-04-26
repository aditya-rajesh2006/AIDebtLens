import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalysisResult, FileAnalysis } from "./mockAnalysis";
import { normalizeAnalysisResult } from "./analysisNormalization";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

type AiDetectResult = {
  aiProbability: number;
  confidence: number;
  signals: string[];
  verdict: "ai-generated" | "human-written" | "mixed";
  explanation: string;
  method: string;
};

type HumanCognitiveFile = {
  filename: string;
  humanBaselineMatch: number;
  cognitiveDivergence: number;
  comprehensionDebt: number;
  workingMemoryLoad: number;
  namingNaturalness: number;
  semanticNameAlignment?: number;
  intentClarity?: number;
  structuralFlow: number;
  abstractionAlignment: number;
  humanTexture: number;
  semanticMismatches?: string[];
  divergenceSignals: string[];
};

type HumanCognitiveResult = {
  files: HumanCognitiveFile[];
};

function mergeSignals(existing: string[], additions: string[]) {
  return [...new Set([...existing, ...additions])].slice(0, 10);
}

function enrichFile(baseFile: FileAnalysis, aiData?: AiDetectResult, cogData?: HumanCognitiveFile): FileAnalysis {
  const aiWeight = aiData ? clamp(0.2 + aiData.confidence * 0.35, 0.25, 0.55) : 0;
  const modelAi = aiData?.aiProbability ?? baseFile.aiLikelihood;
  const blendedAi = round((1 - aiWeight) * baseFile.aiLikelihood + aiWeight * modelAi);

  const comprehensionDebt = cogData?.comprehensionDebt ?? baseFile.cognitiveDebt;
  const divergence = cogData?.cognitiveDivergence ?? baseFile.cognitiveDebt;
  const semanticAlignment = cogData?.semanticNameAlignment ?? cogData?.namingNaturalness ?? baseFile.metrics.es;
  const intentClarity = cogData?.intentClarity ?? 1 - baseFile.metrics.ird;
  const namingNaturalness = cogData?.namingNaturalness ?? baseFile.metrics.es;
  const semanticPenalty = clamp((1 - semanticAlignment) * 0.55 + (1 - intentClarity) * 0.45);
  const cognitiveWeight = cogData ? 0.4 : 0;
  const blendedCog = round(
    clamp(
      (1 - cognitiveWeight) * baseFile.cognitiveDebt +
      cognitiveWeight * comprehensionDebt +
      (cogData ? semanticPenalty * 0.12 : 0),
      0.12,
      0.98,
    ),
  );

  const structuralStress = cogData
    ? clamp(((1 - cogData.structuralFlow) + (1 - cogData.abstractionAlignment) + divergence) / 3)
    : clamp((baseFile.metrics.ddp + baseFile.metrics.mds + baseFile.metrics.tds) / 3);
  const blendedTech = round(clamp(baseFile.technicalDebt * 0.82 + structuralStress * 0.18, 0.08, 0.98));

  const signals = aiData?.signals ?? [];
  const divergenceSignals = cogData?.divergenceSignals ?? [];
  const semanticMismatches = cogData?.semanticMismatches ?? [];
  const semanticIssues = [
    ...(semanticAlignment < 0.55 ? ["names do not match implementation intent"] : []),
    ...(intentClarity < 0.55 ? ["implementation intent is hard to infer"] : []),
    ...semanticMismatches.slice(0, 2).map((mismatch) => `semantic mismatch: ${mismatch}`),
  ];
  const mergedIssues = mergeSignals(baseFile.issues, [...signals, ...divergenceSignals, ...semanticIssues]);

  const es = round(clamp(baseFile.metrics.es * 0.35 + semanticAlignment * 0.45 + namingNaturalness * 0.2, 0.12, 0.95));
  const ias = round(clamp(baseFile.metrics.ias * 0.45 + (1 - semanticAlignment) * 0.35 + (1 - namingNaturalness) * 0.2, 0.08, 0.95));
  const ird = round(clamp(baseFile.metrics.ird * 0.4 + (1 - intentClarity) * 0.6, 0.08, 0.95));
  const ios = round(clamp(baseFile.metrics.ios * 0.35 + (1 - intentClarity) * 0.65, 0.08, 0.95));
  const fr = round(clamp(baseFile.metrics.fr * 0.7 + ((semanticAlignment + intentClarity) / 2) * 0.3, 0.12, 0.95));
  const ri = round(clamp(baseFile.metrics.ri * 0.55 + (cogData?.structuralFlow ?? baseFile.metrics.ri) * 0.25 + semanticAlignment * 0.2, 0.08, 0.95));
  const cds = round(clamp(
    0.25 * baseFile.metrics.ccd +
    0.2 * (1 - es) +
    0.2 * baseFile.metrics.aes +
    0.15 * baseFile.metrics.rdi +
    0.1 * baseFile.metrics.cu +
    0.1 * fr,
    0.12,
    0.98,
  ));
  const ceb = round(clamp(
    0.25 * ird +
    0.2 * baseFile.metrics.cfsc +
    0.2 * baseFile.metrics.stl +
    0.2 * baseFile.metrics.drc +
    0.15 * baseFile.metrics.aic,
    0.1,
    0.95,
  ));
  const dcs = ceb;
  const actdi = round(clamp(
    0.4 * dcs +
    0.3 * baseFile.metrics.dps +
    0.2 * ((baseFile.metrics.ddp + baseFile.metrics.mds) / 2) +
    0.1 * (1 - ri),
    0.08,
    0.98,
  ));

  const metrics = {
    ...baseFile.metrics,
    sus: round(clamp(baseFile.metrics.sus * 0.7 + blendedAi * 0.3, 0.08, 0.98)),
    pri: round(clamp(baseFile.metrics.pri * 0.75 + blendedAi * 0.2 + structuralStress * 0.05, 0.08, 0.98)),
    tdd: round(clamp(baseFile.metrics.tdd * 0.8 + blendedAi * 0.15, 0.08, 0.98)),
    es,
    cds: round(clamp(baseFile.metrics.cds * 0.45 + cds * 0.55, 0.12, 0.98)),
    ceb: round(clamp(baseFile.metrics.ceb * 0.35 + ceb * 0.65, 0.1, 0.98)),
    cli: round(clamp(baseFile.metrics.cli * 0.7 + (cogData?.workingMemoryLoad ?? baseFile.metrics.cli) * 0.3, 0.1, 0.98)),
    fr,
    ias,
    ri,
    ird,
    ios,
    dcs,
    tds: round(clamp(baseFile.metrics.tds * 0.72 + blendedTech * 0.28, 0.12, 0.98)),
    dps: round(clamp(baseFile.metrics.dps * 0.7 + (0.6 * blendedTech + 0.4 * blendedAi) * 0.3, 0.1, 0.98)),
    actdi: round(clamp(baseFile.metrics.actdi * 0.45 + actdi * 0.55, 0.08, 0.98)),
  };

  const explanationParts = [
    baseFile.explanation,
    aiData ? `AI verification: ${aiData.explanation}` : "",
    cogData ? `Human cognitive model: comprehension debt ${(cogData.comprehensionDebt * 100).toFixed(0)}%, divergence ${(cogData.cognitiveDivergence * 100).toFixed(0)}%, semantic naming alignment ${(semanticAlignment * 100).toFixed(0)}%.` : "",
    semanticMismatches.length ? `Semantic review: ${semanticMismatches.slice(0, 2).join("; ")}.` : "",
  ].filter(Boolean);

  return {
    ...baseFile,
    aiLikelihood: blendedAi,
    technicalDebt: blendedTech,
    cognitiveDebt: blendedCog,
    issues: mergedIssues,
    metrics,
    explanation: explanationParts.join(" "),
  };
}

export async function enrichSingleFileWithHybridScoring(
  supabase: SupabaseClient,
  baseResult: AnalysisResult,
  code: string,
  fileName: string,
  userId?: string,
) {
  const normalizedBase = normalizeAnalysisResult(baseResult);
  const baseFile = normalizedBase.files[0];
  if (!baseFile) return normalizedBase;

  const aiDetectPromise = supabase.functions.invoke("ai-detect", {
    body: { code, filename: fileName, userId },
  });

  const humanCognitivePromise = supabase.functions.invoke("human-cognitive-model", {
    body: {
      files: [{ filename: fileName, content: code.slice(0, 12000) }],
    },
  });

  const [aiResp, cogResp] = await Promise.allSettled([aiDetectPromise, humanCognitivePromise]);

  const aiData =
    aiResp.status === "fulfilled" && !aiResp.value.error && aiResp.value.data && !aiResp.value.data.error
      ? (aiResp.value.data as AiDetectResult)
      : undefined;

  const cogData =
    cogResp.status === "fulfilled" && !cogResp.value.error && cogResp.value.data && !cogResp.value.data.error
      ? ((cogResp.value.data as HumanCognitiveResult).files?.[0] as HumanCognitiveFile | undefined)
      : undefined;

  const enrichedFile = enrichFile(baseFile, aiData, cogData);
  const files = [enrichedFile];

  return normalizeAnalysisResult({
    ...normalizedBase,
    files,
    summary: {
      ...normalizedBase.summary,
      avgAiLikelihood: round(enrichedFile.aiLikelihood),
      avgTechnicalDebt: round(enrichedFile.technicalDebt),
      avgCognitiveDebt: round(enrichedFile.cognitiveDebt),
      totalIssues: enrichedFile.issues.length,
      highRiskFiles: enrichedFile.aiLikelihood > 0.6 && enrichedFile.technicalDebt > 0.45 ? 1 : 0,
      topRefactorTargets: [enrichedFile.file],
      aiContribution: enrichedFile.aiDebtContribution,
    },
  });
}
