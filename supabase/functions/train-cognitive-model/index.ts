import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ===== ENHANCED 24-DIMENSIONAL FEATURE EXTRACTION =====

function extractFeatures(code: string): number[] {
  const lines = code.split('\n');
  const totalLines = Math.max(lines.length, 1);
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  const nonEmptyCount = Math.max(nonEmpty.length, 1);

  // 1. Average line length
  const avgLL = nonEmpty.reduce((s, l) => s + l.length, 0) / nonEmptyCount;
  const f1 = Math.min(avgLL / 120, 1);

  // 2. Line length std deviation
  const lengths = nonEmpty.map(l => l.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((s, l) => s + (l - mean) ** 2, 0) / lengths.length;
  const f2 = Math.min(Math.sqrt(variance) / 40, 1);

  // 3. Max nesting depth
  let maxNest = 0, curNest = 0;
  for (const line of lines) {
    curNest += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    maxNest = Math.max(maxNest, curNest);
  }
  const f3 = Math.min(maxNest / 8, 1);

  // 4. Average nesting depth
  let totalNest = 0; curNest = 0;
  for (const line of lines) {
    curNest += (line.match(/{/g) || []).length;
    totalNest += curNest;
    curNest -= (line.match(/}/g) || []).length;
  }
  const f4 = Math.min((totalNest / totalLines) / 4, 1);

  // 5. Comment ratio
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*') || l.trim().startsWith('#')).length;
  const f5 = commentLines / totalLines;

  // 6. Control flow density
  const ctrlKw = (code.match(/\b(if|else|for|while|switch|case|catch|throw|return|break|continue|try|finally)\b/g) || []).length;
  const f6 = Math.min(ctrlKw / (totalLines * 0.15 + 1), 1);

  // 7. Identifier clarity (avg length)
  const ids = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]{0,50}\b/g) || [];
  const avgIdLen = ids.length > 0 ? ids.reduce((s, id) => s + id.length, 0) / ids.length : 0;
  const f7 = Math.min(avgIdLen / 15, 1);

  // 8. Lexical diversity
  const uniqueIds = new Set(ids);
  const f8 = ids.length > 0 ? uniqueIds.size / ids.length : 0;

  // 9. Function density
  const funcCount = (code.match(/\b(function |const \w+ = (\(|async )|def |class |=>)/g) || []).length;
  const f9 = Math.min(funcCount / (totalLines / 20 + 1), 1);

  // 10. Single-char variable ratio
  const singleChar = ids.filter(id => id.length === 1 && id !== '_').length;
  const f10 = ids.length > 0 ? singleChar / ids.length : 0;

  // 11. Duplicate line ratio
  const lineSet = new Set(nonEmpty.map(l => l.trim()));
  const f11 = 1 - (lineSet.size / nonEmptyCount);

  // 12. Import density
  const imports = (code.match(/\b(import|require|from)\b/g) || []).length;
  const f12 = Math.min(imports / (totalLines / 30 + 1), 1);

  // 13. Token density
  const tokens = code.split(/\s+/).length;
  const f13 = Math.min((tokens / totalLines) / 15, 1);

  // 14. Blank line ratio
  const blankLines = lines.filter(l => l.trim() === '').length;
  const f14 = blankLines / totalLines;

  // 15. String literal density
  const strings = (code.match(/(["'`])(?:(?!\1|\\).|\\.)*\1/g) || []).length;
  const f15 = Math.min(strings / (totalLines / 5 + 1), 1);

  // 16. Cognitive complexity drift
  const f16 = Math.min(ctrlKw / (totalLines * 0.12 + 1), 1);

  // === NEW FEATURES (17-24) for better accuracy ===

  // 17. Verbose naming ratio: identifiers > 20 chars
  const verboseIds = ids.filter(id => id.length > 20).length;
  const f17 = ids.length > 0 ? verboseIds / ids.length : 0;

  // 18. Obvious comment ratio (comments that restate code)
  const obviousPatterns = /\/\/\s*(set|get|create|return|check|initialize|define|declare|import|export)\b/gi;
  const obviousComments = (code.match(obviousPatterns) || []).length;
  const f18 = Math.min(obviousComments / (commentLines + 1), 1);

  // 19. Error handling verbosity
  const tryCatch = (code.match(/\btry\b/g) || []).length;
  const errorHandling = (code.match(/\bcatch\b/g) || []).length;
  const f19 = Math.min((tryCatch + errorHandling) / (totalLines / 30 + 1), 1);

  // 20. Type annotation density (TS/Java specific)
  const typeAnns = (code.match(/:\s*[A-Z]\w+(\[\])?(\s*[|&]\s*[A-Z]\w+)*|<\w+>/g) || []).length;
  const f20 = Math.min(typeAnns / (totalLines / 10 + 1), 1);

  // 21. Ternary vs if-else ratio (conciseness indicator)
  const ternaries = (code.match(/\?\s*[^:]+\s*:/g) || []).length;
  const ifElse = (code.match(/\bif\b/g) || []).length;
  const f21 = (ternaries + ifElse) > 0 ? ternaries / (ternaries + ifElse) : 0;

  // 22. Consistent indentation score
  const indentLevels = nonEmpty.map(l => {
    const match = l.match(/^(\s+)/);
    return match ? match[1].length : 0;
  });
  const indentSet = new Set(indentLevels.filter(i => i > 0));
  const f22 = indentSet.size > 0 ? Math.min(indentSet.size / 6, 1) : 0;

  // 23. Chaining density (method chains, common in AI code)
  const chains = (code.match(/\.\w+\(/g) || []).length;
  const f23 = Math.min(chains / (totalLines / 5 + 1), 1);

  // 24. Return statement density (AI tends to have more explicit returns)
  const returns = (code.match(/\breturn\b/g) || []).length;
  const f24 = Math.min(returns / (funcCount + 1), 1);

  return [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20, f21, f22, f23, f24];
}

const FEATURE_NAMES = [
  'avg_line_length', 'line_length_std', 'max_nesting', 'avg_nesting',
  'comment_ratio', 'control_flow_density', 'identifier_clarity', 'lexical_diversity',
  'function_density', 'single_char_ratio', 'repetition_score', 'import_density',
  'token_density', 'blank_line_ratio', 'string_density', 'cognitive_complexity_drift',
  'verbose_naming_ratio', 'obvious_comment_ratio', 'error_handling_verbosity',
  'type_annotation_density', 'ternary_ratio', 'indent_variation', 'chain_density', 'return_density'
];

// ===== IMPROVED LOGISTIC REGRESSION WITH REGULARIZATION =====

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function predict(features: number[], weights: number[], bias: number): number {
  let z = bias;
  for (let i = 0; i < features.length; i++) z += features[i] * (weights[i] || 0);
  return sigmoid(z);
}

function trainLogisticRegression(
  X: number[][],
  y: number[],
  learningRate = 0.05,
  epochs = 2000,
  lambda = 0.01 // L2 regularization
): { weights: number[]; bias: number; accuracy: number } {
  const nFeatures = X[0].length;
  const n = X.length;
  const weights = new Array(nFeatures).fill(0);
  let bias = 0;

  // Feature standardization
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(1);
  for (let j = 0; j < nFeatures; j++) {
    means[j] = X.reduce((s, x) => s + x[j], 0) / n;
    const v = X.reduce((s, x) => s + (x[j] - means[j]) ** 2, 0) / n;
    stds[j] = Math.sqrt(v) || 1;
  }
  const Xn = X.map(x => x.map((v, j) => (v - means[j]) / stds[j]));

  let lr = learningRate;

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Shuffle indices for SGD
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }

    for (const i of idx) {
      const pred = predict(Xn[i], weights, bias);
      const error = pred - y[i];

      for (let j = 0; j < nFeatures; j++) {
        weights[j] -= lr * (error * Xn[i][j] + lambda * weights[j] / n);
      }
      bias -= lr * error;
    }

    // Learning rate decay
    if (epoch % 200 === 0 && epoch > 0) lr *= 0.9;
  }

  // De-standardize weights
  const realWeights = weights.map((w, j) => w / stds[j]);
  let realBias = bias;
  for (let j = 0; j < nFeatures; j++) realBias -= weights[j] * means[j] / stds[j];

  // Calculate accuracy
  let correct = 0;
  for (let i = 0; i < n; i++) {
    if ((predict(X[i], realWeights, realBias) >= 0.5 ? 1 : 0) === y[i]) correct++;
  }

  return { weights: realWeights, bias: realBias, accuracy: correct / n };
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    const { action, samples } = await req.json();

    if (action === 'add-samples') {
      if (!samples || !Array.isArray(samples) || samples.length === 0) {
        throw new Error('samples array required');
      }

      const processed = samples.map((s: any) => ({
        user_id: userId,
        label: s.label,
        filename: s.filename || 'unknown',
        language: s.language || 'unknown',
        code: s.code.slice(0, 50000),
        source: s.source || 'upload',
        source_url: s.source_url || null,
        feature_vector: extractFeatures(s.code),
      }));

      const { data, error } = await supabase.from('training_samples').insert(processed).select('id, label, filename');
      if (error) throw error;

      return new Response(JSON.stringify({ inserted: data?.length || 0, samples: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'train') {
      const { data: allSamples, error: fetchErr } = await supabase
        .from('training_samples')
        .select('label, feature_vector')
        .eq('user_id', userId);

      if (fetchErr) throw fetchErr;
      if (!allSamples || allSamples.length < 10) {
        throw new Error(`Need at least 10 samples. Have ${allSamples?.length || 0}.`);
      }

      const aiCount = allSamples.filter(s => s.label === 'ai').length;
      const humanCount = allSamples.filter(s => s.label === 'human').length;
      if (aiCount < 3 || humanCount < 3) {
        throw new Error(`Need 3+ per class. AI: ${aiCount}, Human: ${humanCount}`);
      }

      // Handle mixed feature vector sizes (old 16-dim + new 24-dim)
      const targetDim = 24;
      const X = allSamples.map(s => {
        const fv = s.feature_vector as number[];
        if (fv.length < targetDim) return [...fv, ...new Array(targetDim - fv.length).fill(0)];
        return fv.slice(0, targetDim);
      });
      const y = allSamples.map(s => s.label === 'ai' ? 1 : 0);

      const { weights, bias, accuracy } = trainLogisticRegression(X, y, 0.05, 2000, 0.01);

      // Upsert model
      const { data: existing } = await supabase
        .from('model_weights')
        .select('id')
        .eq('user_id', userId)
        .eq('model_name', 'cognitive-classifier')
        .maybeSingle();

      const modelData = {
        user_id: userId,
        model_name: 'cognitive-classifier',
        weights: { weights, bias },
        feature_names: FEATURE_NAMES,
        training_samples_count: allSamples.length,
        accuracy: Math.round(accuracy * 10000) / 100,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('model_weights').update(modelData).eq('id', existing.id);
      } else {
        await supabase.from('model_weights').insert(modelData);
      }

      return new Response(JSON.stringify({
        accuracy: Math.round(accuracy * 10000) / 100,
        samples_used: allSamples.length,
        ai_samples: aiCount,
        human_samples: humanCount,
        feature_importance: FEATURE_NAMES.map((name, i) => ({
          feature: name,
          weight: Math.round(weights[i] * 1000) / 1000,
          importance: Math.round(Math.abs(weights[i]) * 1000) / 1000,
        })).sort((a, b) => b.importance - a.importance),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'predict') {
      const { data: model } = await supabase
        .from('model_weights')
        .select('*')
        .eq('user_id', userId)
        .eq('model_name', 'cognitive-classifier')
        .maybeSingle();

      if (!model) throw new Error('No trained model. Train first.');
      if (!samples || !Array.isArray(samples) || samples.length === 0) throw new Error('Provide samples');

      const { weights: w, bias: b } = model.weights as { weights: number[]; bias: number };
      const fNames = model.feature_names as string[];

      const predictions = samples.map((s: { code: string; filename?: string }) => {
        const features = extractFeatures(s.code);
        // Pad/truncate to match model dimension
        const dim = w.length;
        const f = features.length < dim ? [...features, ...new Array(dim - features.length).fill(0)] : features.slice(0, dim);
        
        const aiProb = predict(f, w, b);
        const cogStrain = f[2] * 0.15 + f[3] * 0.10 + f[5] * 0.15 + f[9] * 0.10 + 
                          f[10] * 0.10 + f[15] * 0.10 + f[16] * 0.10 + f[17] * 0.10 + f[18] * 0.10;

        return {
          filename: s.filename || 'unknown',
          aiProbability: Math.round(aiProb * 1000) / 1000,
          verdict: aiProb > 0.7 ? 'ai-generated' : aiProb < 0.3 ? 'human-written' : 'mixed',
          cognitiveStrain: Math.round(cogStrain * 1000) / 1000,
          featureVector: f,
          featureBreakdown: fNames.slice(0, f.length).map((name: string, i: number) => ({
            feature: name,
            value: Math.round(f[i] * 1000) / 1000,
            contribution: Math.round(f[i] * w[i] * 1000) / 1000,
          })),
        };
      });

      return new Response(JSON.stringify({ predictions, model_accuracy: model.accuracy }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stats') {
      const { data: sampleCounts } = await supabase
        .from('training_samples')
        .select('label')
        .eq('user_id', userId);

      const { data: model } = await supabase
        .from('model_weights')
        .select('accuracy, training_samples_count, updated_at, feature_names')
        .eq('user_id', userId)
        .eq('model_name', 'cognitive-classifier')
        .maybeSingle();

      return new Response(JSON.stringify({
        total_samples: sampleCounts?.length || 0,
        ai_samples: sampleCounts?.filter(s => s.label === 'ai').length || 0,
        human_samples: sampleCounts?.filter(s => s.label === 'human').length || 0,
        model_trained: !!model,
        model_accuracy: model?.accuracy || null,
        last_trained: model?.updated_at || null,
        features: model?.feature_names || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
