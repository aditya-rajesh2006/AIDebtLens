import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowDown, CheckCircle2, Loader2, AlertTriangle, FileCode, Eye, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DatasetTrainer from "@/components/DatasetTrainer";
import type { AnalysisResult } from "@/lib/mockAnalysis";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface CognitiveFileResult {
  filename: string;
  humanBaselineMatch: number;
  cognitiveDivergence: number;
  comprehensionDebt: number;
  workingMemoryLoad: number;
  namingNaturalness: number;
  structuralFlow: number;
  abstractionAlignment: number;
  humanTexture: number;
  divergenceSignals: string[];
  pipelineStages: {
    datasetTraining: string;
    cognitiveModel: string;
    aiAnalysis: string;
    divergenceMetrics: string;
    debtScore: string;
  };
}

interface CognitiveModelResult {
  files: CognitiveFileResult[];
  overallAssessment: {
    humanComprehensionDebtScore: number;
    cognitiveModelSummary: string;
    topDivergences: string[];
    recommendation: string;
  };
  pipelineStages: { id: string; label: string; status: string }[];
}

interface Props {
  analysisData: AnalysisResult;
}

const PIPELINE_STEPS = [
  { id: "repo", label: "Code Repository", icon: FileCode, description: "Source files loaded from GitHub" },
  { id: "training", label: "Human Code Dataset Training", icon: Brain, description: "Establishing human coding pattern baselines" },
  { id: "model", label: "Human Cognitive Code Model", icon: Eye, description: "Building mental model of human code comprehension" },
  { id: "analysis", label: "AI Code Analysis", icon: Sparkles, description: "Detecting divergence from human norms" },
  { id: "divergence", label: "Cognitive Divergence Metrics", icon: AlertTriangle, description: "Quantifying cognitive gap metrics" },
  { id: "score", label: "Human Comprehension Debt Score", icon: Brain, description: "Final composite comprehension debt" },
];

export default function HumanCognitiveModel({ analysisData }: Props) {
  const [result, setResult] = useState<CognitiveModelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [hasCustomModel, setHasCustomModel] = useState(false);
  const [showTrainer, setShowTrainer] = useState(false);

  // Check if user has a trained custom model
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.functions.invoke("train-cognitive-model", {
          body: { action: "stats" },
        });
        if (data && !data.error && data.model_trained) {
          setHasCustomModel(true);
          setUseCustomModel(true);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const isDark = document.documentElement.classList.contains("dark");
  const tooltipBg = isDark ? "hsl(220, 18%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 14%, 16%)" : "hsl(210, 14%, 88%)";
  const tickColor = isDark ? "hsl(215, 12%, 50%)" : "hsl(215, 12%, 45%)";

  const runPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(0);

    // Simulate pipeline progression
    const stepInterval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= PIPELINE_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 1500);

    try {
      const files = analysisData.files.slice(0, 9).map(f => ({
        filename: f.file,
        content: `// File: ${f.file}\n// Lines: ${f.linesOfCode}, Functions: ${f.functions}\n// Cyclomatic Complexity: ${f.cyclomaticComplexity}, Nesting: ${f.nestingDepth}\n// Issues: ${f.issues.join(', ')}\n// AI Likelihood: ${(f.aiLikelihood * 100).toFixed(0)}%\n// Tech Debt: ${(f.technicalDebt * 100).toFixed(0)}%, Cognitive Debt: ${(f.cognitiveDebt * 100).toFixed(0)}%\n// Metrics: CCD=${f.metrics.ccd.toFixed(2)}, CLI=${f.metrics.cli.toFixed(2)}, IAS=${f.metrics.ias.toFixed(2)}, SUS=${f.metrics.sus.toFixed(2)}, RI=${f.metrics.ri.toFixed(2)}`,
      }));

      // Use custom-trained model if available, else fallback to Gemini-powered model
      const functionName = useCustomModel && hasCustomModel ? "cognitive-predict" : "human-cognitive-model";

      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: { files },
      });

      clearInterval(stepInterval);

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setActiveStep(PIPELINE_STEPS.length - 1);
      setResult(data as CognitiveModelResult);
    } catch (e) {
      clearInterval(stepInterval);
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setLoading(false);
    }
  }, [analysisData, useCustomModel, hasCustomModel]);

  const selectedFileData = result?.files.find(f => f.filename === selectedFile);

  const overallRadarData = result ? [
    { metric: "Baseline Match", value: Math.round(result.files.reduce((s, f) => s + f.humanBaselineMatch, 0) / result.files.length * 100) },
    { metric: "Naming", value: Math.round(result.files.reduce((s, f) => s + f.namingNaturalness, 0) / result.files.length * 100) },
    { metric: "Structure", value: Math.round(result.files.reduce((s, f) => s + f.structuralFlow, 0) / result.files.length * 100) },
    { metric: "Abstraction", value: Math.round(result.files.reduce((s, f) => s + f.abstractionAlignment, 0) / result.files.length * 100) },
    { metric: "Texture", value: Math.round(result.files.reduce((s, f) => s + f.humanTexture, 0) / result.files.length * 100) },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Model Toggle + Train */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setUseCustomModel(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${!useCustomModel ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary/30"}`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" />Gemini Model
            </button>
            <button
              onClick={() => { if (hasCustomModel) setUseCustomModel(true); else setShowTrainer(true); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${useCustomModel ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-secondary/30"}`}
            >
              <Zap className="h-3 w-3 inline mr-1" />Custom Model
            </button>
          </div>
          {useCustomModel && hasCustomModel && (
            <span className="text-[10px] text-neon-green font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Using your trained model
            </span>
          )}
        </div>
        <button
          onClick={() => setShowTrainer(!showTrainer)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary/30 transition-colors flex items-center gap-1"
        >
          <Brain className="h-3 w-3" /> {showTrainer ? "Hide" : "Train / Manage"} Dataset
        </button>
      </div>

      {/* Dataset Trainer */}
      <AnimatePresence>
        {showTrainer && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <DatasetTrainer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Visualization */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Human Cognitive Code Model Pipeline
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {useCustomModel && hasCustomModel
                ? "Running with your custom-trained classifier (no external AI API)"
                : "Analyzes code through a human cognition lens to detect comprehension debt"
              }
            </p>
          </div>
          {!loading && (
            <button
              onClick={runPipeline}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {result ? "Re-run Pipeline" : "Run Pipeline"}
            </button>
          )}
        </div>

        {/* Pipeline Steps */}
        <div className="flex flex-col gap-1">
          {PIPELINE_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === activeStep && loading;
            const isComplete = i < activeStep || (result && !loading);
            const isPending = i > activeStep && loading;

            return (
              <div key={step.id}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all ${
                    isActive ? "bg-primary/10 border border-primary/30" :
                    isComplete ? "bg-neon-green/5 border border-neon-green/20" :
                    "bg-secondary/20 border border-transparent"
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                    isActive ? "bg-primary/20" : isComplete ? "bg-neon-green/20" : "bg-muted"
                  }`}>
                    {isActive ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-neon-green" />
                    ) : (
                      <StepIcon className={`h-3.5 w-3.5 ${isPending ? "text-muted-foreground" : "text-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${isActive ? "text-primary" : isComplete ? "text-neon-green" : "text-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className={`h-3 w-3 ${isComplete ? "text-neon-green/50" : "text-muted-foreground/30"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Overall Score */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-5 text-center">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">Human Comprehension Debt</p>
              <motion.span
                className="text-5xl font-black font-mono text-primary"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {result.overallAssessment.humanComprehensionDebtScore}
              </motion.span>
              <p className="text-[10px] text-muted-foreground mt-1">/100</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.overallAssessment.humanComprehensionDebtScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 sm:col-span-1 lg:col-span-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Cognitive Model Summary</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.overallAssessment.cognitiveModelSummary}</p>
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold text-primary mb-1">Recommendation</p>
                <p className="text-xs text-foreground">{result.overallAssessment.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Top Divergences + Radar */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3">Top Cognitive Divergences</h4>
              <div className="space-y-2">
                {result.overallAssessment.topDivergences.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="text-destructive font-mono shrink-0">{i + 1}.</span>
                    <span className="text-muted-foreground">{d}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3">Human Baseline Radar</h4>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={overallRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 9 }} />
                  <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 7 }} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="hsl(174, 72%, 52%)" fill="hsl(174, 72%, 52%)" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* File Results */}
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
            <h4 className="text-xs font-semibold text-foreground mb-4">File-Level Cognitive Analysis</h4>
            <div className="space-y-2">
              {result.files.map((file, i) => {
                const isSelected = selectedFile === file.filename;
                return (
                  <div key={file.filename}>
                    <button
                      onClick={() => setSelectedFile(isSelected ? null : file.filename)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/30 transition-colors"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="flex-1 text-xs font-mono text-foreground truncate text-left">{file.filename.split('/').slice(-2).join('/')}</span>
                      <div className="flex items-center gap-3">
                        <MiniMetric label="Divergence" value={file.cognitiveDivergence} />
                        <MiniMetric label="Debt" value={file.comprehensionDebt} />
                        <MiniMetric label="Memory" value={file.workingMemoryLoad} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <FileDetail file={file} tooltipBg={tooltipBg} tooltipBorder={tooltipBorder} tickColor={tickColor} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 60 ? "text-destructive" : pct > 30 ? "text-accent" : "text-neon-green";
  return (
    <div className="text-right">
      <p className="text-[8px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-mono font-bold ${color}`}>{pct}%</p>
    </div>
  );
}

function FileDetail({ file, tooltipBg, tooltipBorder, tickColor }: { file: CognitiveFileResult; tooltipBg: string; tooltipBorder: string; tickColor: string }) {
  const radarData = [
    { metric: "Baseline", value: Math.round(file.humanBaselineMatch * 100) },
    { metric: "Naming", value: Math.round(file.namingNaturalness * 100) },
    { metric: "Structure", value: Math.round(file.structuralFlow * 100) },
    { metric: "Abstraction", value: Math.round(file.abstractionAlignment * 100) },
    { metric: "Texture", value: Math.round(file.humanTexture * 100) },
  ];

  return (
    <div className="ml-7 mr-3 mb-3 rounded-lg bg-secondary/20 p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Metrics bars */}
        <div className="space-y-2">
          <BarMetric label="Human Baseline Match" value={file.humanBaselineMatch} good />
          <BarMetric label="Naming Naturalness" value={file.namingNaturalness} good />
          <BarMetric label="Structural Flow" value={file.structuralFlow} good />
          <BarMetric label="Abstraction Alignment" value={file.abstractionAlignment} good />
          <BarMetric label="Human Texture" value={file.humanTexture} good />
          <BarMetric label="Working Memory Load" value={file.workingMemoryLoad} />
          <BarMetric label="Cognitive Divergence" value={file.cognitiveDivergence} />
          <BarMetric label="Comprehension Debt" value={file.comprehensionDebt} />
        </div>

        {/* Radar */}
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 8 }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} />
              <Radar dataKey="value" stroke="hsl(270, 72%, 62%)" fill="hsl(270, 72%, 62%)" fillOpacity={0.2} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divergence Signals */}
      {file.divergenceSignals.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2">Divergence Signals</p>
          <div className="flex flex-wrap gap-1.5">
            {file.divergenceSignals.map((s, i) => (
              <span key={i} className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] text-destructive">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Stage Details */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Pipeline Stage Insights</p>
        {Object.entries(file.pipelineStages).map(([key, value]) => (
          <div key={key} className="text-[10px]">
            <span className="font-mono text-primary">{key}:</span>{" "}
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarMetric({ label, value, good }: { label: string; value: number; good?: boolean }) {
  const pct = Math.round(value * 100);
  // For "good" metrics, high = green. For bad metrics, high = red.
  const color = good
    ? (pct > 60 ? "hsl(var(--neon-green))" : pct > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--destructive))")
    : (pct > 60 ? "hsl(var(--destructive))" : pct > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--neon-green))");

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}
