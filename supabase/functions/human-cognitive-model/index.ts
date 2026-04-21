import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { files } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('files array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert software engineering researcher specializing in human cognition and code comprehension.

You will analyze code files through a "Human Cognitive Code Model" pipeline:

1. HUMAN CODE DATASET TRAINING — Establish baseline human coding patterns (naming conventions, structure patterns, comment styles, complexity preferences)
2. HUMAN COGNITIVE CODE MODEL — Build a mental model of how humans naturally write and comprehend code
3. AI CODE ANALYSIS — Identify patterns that diverge from human cognitive norms
4. COGNITIVE DIVERGENCE METRICS — Quantify the gap between the code and human-natural patterns
5. HUMAN COMPREHENSION DEBT SCORE — Final composite score of how much cognitive overhead the code imposes

For each file, return structured analysis using the tool provided.

Key cognitive divergence signals:
- Naming that doesn't match human mental models (too generic, too verbose, misleading)
- Structure that fights human reading flow (excessive nesting, non-linear logic)
- Abstractions that don't map to domain concepts
- Patterns that require high working memory load
- AI-generated uniformity that lacks human "texture" (variations, shortcuts, idioms)
- Comment patterns that don't aid comprehension (redundant, misplaced, or absent where needed)
- Control flow that requires mental stack depth > 3
- Variable lifetimes that exceed human short-term memory span`;

    // Batch files into chunks of 3 for efficiency
    const batchSize = 3;
    const results: any[] = [];

    for (let i = 0; i < Math.min(files.length, 9); i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const fileDescriptions = batch.map((f: any, idx: number) =>
        `--- File ${idx + 1}: ${f.filename} ---\n\`\`\`\n${(f.content || '').slice(0, 3000)}\n\`\`\``
      ).join('\n\n');

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze these ${batch.length} files through the Human Cognitive Code Model pipeline:\n\n${fileDescriptions}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_cognitive_model",
              description: "Report Human Cognitive Code Model analysis results for all files",
              parameters: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        filename: { type: "string" },
                        humanBaselineMatch: { type: "number", description: "0-1: how well code matches human coding patterns" },
                        cognitiveDivergence: { type: "number", description: "0-1: degree of divergence from human cognitive norms" },
                        comprehensionDebt: { type: "number", description: "0-1: cognitive overhead imposed on human readers" },
                        workingMemoryLoad: { type: "number", description: "0-1: mental stack depth required" },
                        namingNaturalness: { type: "number", description: "0-1: how natural variable/function names feel" },
                        structuralFlow: { type: "number", description: "0-1: how well structure follows human reading flow" },
                        abstractionAlignment: { type: "number", description: "0-1: how well abstractions map to domain concepts" },
                        humanTexture: { type: "number", description: "0-1: presence of human coding 'texture' (idioms, shortcuts)" },
                        divergenceSignals: {
                          type: "array",
                          items: { type: "string" },
                          description: "Specific signals of cognitive divergence"
                        },
                        pipelineStages: {
                          type: "object",
                          properties: {
                            datasetTraining: { type: "string", description: "What human patterns were established as baseline" },
                            cognitiveModel: { type: "string", description: "Key characteristics of the human cognitive model" },
                            aiAnalysis: { type: "string", description: "AI-specific patterns detected" },
                            divergenceMetrics: { type: "string", description: "Summary of cognitive divergence" },
                            debtScore: { type: "string", description: "Final debt assessment" }
                          },
                          required: ["datasetTraining", "cognitiveModel", "aiAnalysis", "divergenceMetrics", "debtScore"]
                        }
                      },
                      required: ["filename", "humanBaselineMatch", "cognitiveDivergence", "comprehensionDebt", "workingMemoryLoad", "namingNaturalness", "structuralFlow", "abstractionAlignment", "humanTexture", "divergenceSignals", "pipelineStages"]
                    }
                  },
                  overallAssessment: {
                    type: "object",
                    properties: {
                      humanComprehensionDebtScore: { type: "number", description: "0-100: overall Human Comprehension Debt Score" },
                      cognitiveModelSummary: { type: "string", description: "Brief summary of the human cognitive code model findings" },
                      topDivergences: { type: "array", items: { type: "string" }, description: "Top 5 cognitive divergence patterns" },
                      recommendation: { type: "string", description: "Key recommendation for reducing comprehension debt" }
                    },
                    required: ["humanComprehensionDebtScore", "cognitiveModelSummary", "topDivergences", "recommendation"]
                  }
                },
                required: ["files", "overallAssessment"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "report_cognitive_model" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in response");

      const parsed = JSON.parse(toolCall.function.arguments);
      results.push(parsed);
    }

    // Merge results
    const allFiles = results.flatMap(r => r.files || []);
    const lastAssessment = results[results.length - 1]?.overallAssessment;

    // Recalculate overall score from all files
    const avgComprehensionDebt = allFiles.length > 0
      ? allFiles.reduce((s: number, f: any) => s + f.comprehensionDebt, 0) / allFiles.length
      : 0;

    const mergedResult = {
      files: allFiles,
      overallAssessment: {
        ...lastAssessment,
        humanComprehensionDebtScore: Math.round(avgComprehensionDebt * 100),
      },
      pipelineStages: [
        { id: "repo", label: "Code Repository", status: "complete" },
        { id: "training", label: "Human Code Dataset Training", status: "complete" },
        { id: "model", label: "Human Cognitive Code Model", status: "complete" },
        { id: "analysis", label: "AI Code Analysis", status: "complete" },
        { id: "divergence", label: "Cognitive Divergence Metrics", status: "complete" },
        { id: "score", label: "Human Comprehension Debt Score", status: "complete" },
      ],
    };

    return new Response(JSON.stringify(mergedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
