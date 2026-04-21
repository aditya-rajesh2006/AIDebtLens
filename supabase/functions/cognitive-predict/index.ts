import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractFeatures(code: string): number[] {
  const lines = code.split('\n');
  const totalLines = Math.max(lines.length, 1);
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const nonEmptyCount = Math.max(nonEmptyLines.length, 1);

  const avgLineLen = nonEmptyLines.reduce((s, l) => s + l.length, 0) / nonEmptyCount;
  const f1 = Math.min(avgLineLen / 120, 1);

  const lengths = nonEmptyLines.map(l => l.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((s, l) => s + (l - mean) ** 2, 0) / lengths.length;
  const f2 = Math.min(Math.sqrt(variance) / 40, 1);

  let maxNesting = 0, currentNesting = 0;
  for (const line of lines) {
    currentNesting += (line.match(/{/g) || []).length;
    currentNesting -= (line.match(/}/g) || []).length;
    maxNesting = Math.max(maxNesting, currentNesting);
  }
  const f3 = Math.min(maxNesting / 8, 1);

  let totalNesting = 0; currentNesting = 0;
  for (const line of lines) {
    currentNesting += (line.match(/{/g) || []).length;
    totalNesting += currentNesting;
    currentNesting -= (line.match(/}/g) || []).length;
  }
  const f4 = Math.min((totalNesting / totalLines) / 4, 1);

  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*')).length;
  const f5 = commentLines / totalLines;

  const controlKeywords = (code.match(/\b(if|else|for|while|switch|case|catch|throw|return|break|continue)\b/g) || []).length;
  const f6 = Math.min(controlKeywords / (totalLines * 0.15 + 1), 1);

  const identifiers = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]{0,50}\b/g) || [];
  const avgIdLen = identifiers.length > 0 ? identifiers.reduce((s, id) => s + id.length, 0) / identifiers.length : 0;
  const f7 = Math.min(avgIdLen / 15, 1);

  const uniqueIds = new Set(identifiers);
  const f8 = identifiers.length > 0 ? uniqueIds.size / identifiers.length : 0;

  const funcCount = (code.match(/\b(function|const\s+\w+\s*=\s*(\(|async)|def |class )\b/g) || []).length;
  const f9 = Math.min(funcCount / (totalLines / 20 + 1), 1);

  const singleCharVars = identifiers.filter(id => id.length === 1 && id !== '_').length;
  const f10 = identifiers.length > 0 ? singleCharVars / identifiers.length : 0;

  const lineSet = new Set(nonEmptyLines.map(l => l.trim()));
  const f11 = 1 - (lineSet.size / nonEmptyCount);

  const imports = (code.match(/\b(import|require|from)\b/g) || []).length;
  const f12 = Math.min(imports / (totalLines / 30 + 1), 1);

  const tokens = code.split(/\s+/).length;
  const f13 = Math.min((tokens / totalLines) / 15, 1);

  const blankLines = lines.filter(l => l.trim() === '').length;
  const f14 = blankLines / totalLines;

  const strings = (code.match(/(["'`])(?:(?!\1|\\).|\\.)*\1/g) || []).length;
  const f15 = Math.min(strings / (totalLines / 5 + 1), 1);

  const ccd = controlKeywords / (totalLines * 0.12 + 1);
  const f16 = Math.min(ccd, 1);

  return [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function predict(features: number[], weights: number[], bias: number): number {
  let z = bias;
  for (let i = 0; i < features.length; i++) z += features[i] * (weights[i] || 0);
  return sigmoid(z);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;

    const { files } = await req.json();
    if (!files || !Array.isArray(files)) throw new Error('files array required');

    // Load user's trained model
    const { data: model } = await supabase
      .from('model_weights')
      .select('*')
      .eq('user_id', userId)
      .eq('model_name', 'cognitive-classifier')
      .maybeSingle();

    if (!model) throw new Error('No trained model found. Train your model first in the Deep Analysis tab.');

    const { weights: w, bias: b } = model.weights as { weights: number[]; bias: number };
    const featureNames = model.feature_names as string[];

    const results = files.map((f: { filename: string; content: string }) => {
      const features = extractFeatures(f.content || '');
      const aiProb = predict(features, w, b);

      // Derive cognitive metrics from feature vector
      const humanBaselineMatch = 1 - aiProb;
      const cognitiveDivergence = features[2] * 0.15 + features[5] * 0.2 + features[10] * 0.2 + features[15] * 0.2 + (1 - features[7]) * 0.25;
      const comprehensionDebt = features[3] * 0.2 + features[5] * 0.2 + features[9] * 0.15 + features[15] * 0.2 + features[10] * 0.25;
      const workingMemoryLoad = features[2] * 0.3 + features[3] * 0.25 + features[5] * 0.25 + features[11] * 0.2;
      const namingNaturalness = features[7] * 0.4 + (1 - features[9]) * 0.3 + features[7] * 0.3;
      const structuralFlow = (1 - features[2]) * 0.3 + (1 - features[3]) * 0.3 + features[13] * 0.2 + (1 - features[10]) * 0.2;
      const abstractionAlignment = features[8] * 0.3 + (1 - features[10]) * 0.3 + features[7] * 0.4;
      const humanTexture = features[1] * 0.3 + features[13] * 0.2 + (1 - features[10]) * 0.25 + features[4] * 0.25;

      const clamp = (v: number) => Math.max(0, Math.min(1, v));

      // Generate divergence signals based on features
      const signals: string[] = [];
      if (features[10] > 0.3) signals.push('High code repetition detected');
      if (features[9] > 0.15) signals.push('Excessive single-character variables');
      if (features[1] < 0.15) signals.push('Suspiciously uniform line lengths (AI pattern)');
      if (features[2] > 0.5) signals.push('Deep nesting increases working memory load');
      if (features[4] < 0.05) signals.push('Insufficient comments for comprehension');
      if (features[4] > 0.4) signals.push('Over-commenting (redundant documentation)');
      if (features[15] > 0.6) signals.push('High cognitive complexity drift');
      if (features[7] < 0.3) signals.push('Low lexical diversity in identifiers');

      return {
        filename: f.filename,
        aiProbability: Math.round(aiProb * 1000) / 1000,
        humanBaselineMatch: clamp(humanBaselineMatch),
        cognitiveDivergence: clamp(cognitiveDivergence),
        comprehensionDebt: clamp(comprehensionDebt),
        workingMemoryLoad: clamp(workingMemoryLoad),
        namingNaturalness: clamp(namingNaturalness),
        structuralFlow: clamp(structuralFlow),
        abstractionAlignment: clamp(abstractionAlignment),
        humanTexture: clamp(humanTexture),
        divergenceSignals: signals,
        featureBreakdown: featureNames.map((name: string, i: number) => ({
          feature: name,
          value: Math.round(features[i] * 1000) / 1000,
          contribution: Math.round(features[i] * w[i] * 1000) / 1000,
        })),
        pipelineStages: {
          datasetTraining: `Trained on ${model.training_samples_count} samples (${Math.round(model.accuracy)}% accuracy)`,
          cognitiveModel: `16-feature vector extracted: avg_line=${features[0].toFixed(2)}, entropy=${features[1].toFixed(2)}, nesting=${features[2].toFixed(2)}`,
          aiAnalysis: `AI probability: ${(aiProb * 100).toFixed(1)}% — ${aiProb > 0.7 ? 'Likely AI-generated' : aiProb < 0.3 ? 'Likely human-written' : 'Mixed patterns'}`,
          divergenceMetrics: `Cognitive divergence: ${(cognitiveDivergence * 100).toFixed(0)}%, Working memory: ${(workingMemoryLoad * 100).toFixed(0)}%`,
          debtScore: `Comprehension debt: ${(comprehensionDebt * 100).toFixed(0)}% — ${comprehensionDebt > 0.5 ? 'High mental overhead' : 'Manageable complexity'}`,
        },
      };
    });

    // Overall assessment
    const avgDebt = results.reduce((s, r) => s + r.comprehensionDebt, 0) / results.length;
    const avgAI = results.reduce((s, r) => s + r.aiProbability, 0) / results.length;

    const topDivergences = results
      .flatMap(r => r.divergenceSignals.map(s => `${r.filename}: ${s}`))
      .slice(0, 5);

    return new Response(JSON.stringify({
      files: results,
      overallAssessment: {
        humanComprehensionDebtScore: Math.round(avgDebt * 100),
        cognitiveModelSummary: `Analyzed ${results.length} files using your custom-trained model (${model.training_samples_count} training samples, ${Math.round(model.accuracy)}% accuracy). Average AI probability: ${(avgAI * 100).toFixed(0)}%. Average comprehension debt: ${(avgDebt * 100).toFixed(0)}%.`,
        topDivergences,
        recommendation: avgDebt > 0.5
          ? 'Focus on reducing nesting depth and improving identifier naming. Consider breaking complex functions into smaller units.'
          : 'Code maintainability is reasonable. Continue monitoring cognitive metrics as the codebase evolves.',
      },
      pipelineStages: [
        { id: 'repo', label: 'Code Repository', status: 'complete' },
        { id: 'training', label: 'Custom Model (Your Dataset)', status: 'complete' },
        { id: 'model', label: 'Feature Vector Extraction', status: 'complete' },
        { id: 'analysis', label: 'Logistic Regression Classification', status: 'complete' },
        { id: 'divergence', label: 'Cognitive Divergence Metrics', status: 'complete' },
        { id: 'score', label: 'Human Comprehension Debt Score', status: 'complete' },
      ],
      modelInfo: {
        accuracy: model.accuracy,
        trainingSamples: model.training_samples_count,
        lastTrained: model.updated_at,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
