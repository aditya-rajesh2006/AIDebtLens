import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, Bug, FileCode, GitFork, TrendingUp, Zap, AlertTriangle,
  RefreshCw, Star, Code, BarChart3, Network, Table2, Flame, Target, Lightbulb,
  Clock, Wrench, Shield, Cpu
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import EnhancedCodeInput from "@/components/EnhancedCodeInput";
import MetricCard from "@/components/MetricCard";
import FileTable from "@/components/FileTable";
import InsightsPanel from "@/components/InsightsPanel";
import MetricTooltip from "@/components/MetricTooltip";
import HistoryPanel from "@/components/HistoryPanel";
import CommitTimeline from "@/components/CommitTimeline";
import RefactorRecommendations from "@/components/RefactorRecommendations";
import ReportDownload from "@/components/ReportDownload";
import HumanCognitiveModel from "@/components/HumanCognitiveModel";
import DeveloperCognitiveSimulation from "@/components/DeveloperCognitiveSimulation";
import type { AnalysisResult, CommitTimelineData } from "@/lib/mockAnalysis";
import { normalizeAnalysisResult } from "@/lib/analysisNormalization";
import { analyzeLocalCode } from "@/lib/localCodeAnalysis";
import { enrichSingleFileWithHybridScoring } from "@/lib/hybridAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useLocation } from "react-router-dom";

const PropagationGraph = lazy(() => import("@/components/PropagationGraph"));

type Tab = "overview" | "files" | "graph" | "timeline" | "recommendations" | "deepAnalysis";

const analysisCache = new Map<string, AnalysisResult>();
const timelineCache = new Map<string, CommitTimelineData>();
const progressChecklist = [
  "Collecting structural signals",
  "Estimating technical debt",
  "Blending cognitive debt signals",
  "Ranking highest-risk files",
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [timelineData, setTimelineData] = useState<CommitTimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [lastUrl, setLastUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("Initializing...");
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [searchParams] = useSearchParams();
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    const repo = searchParams.get("repo");
    const stateInput = (location.state as { input?: { type: string; data: string; fileName?: string } })?.input;
    
    if (repo) {
      handleAnalyze({ type: "github", data: repo });
    } else if (stateInput) {
      handleAnalyze(stateInput as any);
    }
  }, []);

  const startProgress = () => {
    setProgress(0);
    const steps = [
      { p: 10, msg: "Connecting to GitHub API..." },
      { p: 20, msg: "Fetching repository structure..." },
      { p: 35, msg: "Downloading source files..." },
      { p: 50, msg: "Running AI pattern detection..." },
      { p: 65, msg: "Calculating technical debt (strict mode)..." },
      { p: 75, msg: "Analyzing cognitive load..." },
      { p: 85, msg: "Building propagation graph..." },
      { p: 92, msg: "Generating refactor recommendations..." },
      { p: 97, msg: "Finalizing analysis..." },
    ];
    let i = 0;
    progressRef.current = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].p);
        setProgressMsg(steps[i].msg);
        i++;
      }
    }, 800);
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressMsg("Analysis complete!");
  };

  const saveToHistory = async (result: AnalysisResult, url: string) => {
    if (!user) return;
    try {
      await supabase.from("analysis_history").insert({
        user_id: user.id,
        repo_url: url,
        repo_name: result.repoName,
        stars: result.stars || 0,
        language: result.language || null,
        avg_ai_likelihood: result.summary.avgAiLikelihood,
        avg_technical_debt: result.summary.avgTechnicalDebt,
        avg_cognitive_debt: result.summary.avgCognitiveDebt,
        total_files: result.totalFiles,
        high_risk_files: result.summary.highRiskFiles,
      });
    } catch { /* non-blocking */ }
  };

  const fetchTimeline = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (timelineCache.has(trimmed)) {
      setTimelineData(timelineCache.get(trimmed)!);
      return;
    }
    setTimelineLoading(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-commits", {
        body: { repoUrl: trimmed, commitCount: 20 },
      });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      timelineCache.set(trimmed, result);
      setTimelineData(result);
    } catch (e) {
      console.error("Timeline fetch failed:", e);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async (input: { type: "github" | "upload" | "paste"; data: string; fileName?: string }) => {
    const cacheKey = `${input.type}:${input.data}`;
    if (analysisCache.has(cacheKey)) {
      setData(normalizeAnalysisResult(analysisCache.get(cacheKey)!));
      setError(null);
      if (input.type === "github") fetchTimeline(input.data);
      return;
    }
    setLoading(true);
    setError(null);
    setLastUrl(input.data);
    setData(null);
    setTimelineData(null);
    startProgress();
    try {
      let result: AnalysisResult;
      
      if (input.type === "github") {
        // Use analyze-repo for GitHub URLs
        const { data: repoData, error: fnError } = await supabase.functions.invoke("analyze-repo", {
          body: { repoUrl: input.data },
        });
        if (fnError) throw new Error(fnError.message);
        if (repoData?.error) throw new Error(repoData.error);
        result = repoData as AnalysisResult;
      } else {
        // Use in-app deterministic analysis for uploads and pastes so metrics
        // are always available even if the edge function is unavailable/stale.
        const localResult = analyzeLocalCode(input.data, input.fileName || "uploaded_code");
        try {
          result = await enrichSingleFileWithHybridScoring(
            supabase,
            localResult,
            input.data,
            input.fileName || "uploaded_code",
            user?.id,
          );
        } catch {
          result = localResult;
        }
      }

      const normalizedResult = normalizeAnalysisResult(result);
      analysisCache.set(cacheKey, normalizedResult);
      setData(normalizedResult);
      saveToHistory(normalizedResult, input.data);
      
      // Fetch timeline only for GitHub repos
      if (input.type === "github") {
        fetchTimeline(input.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      stopProgress();
      setLoading(false);
    }
  }, [user, fetchTimeline]);

  // Chart helpers
  const isDark = document.documentElement.classList.contains("dark");
  const tooltipBg = isDark ? "hsl(220, 18%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 14%, 16%)" : "hsl(210, 14%, 88%)";
  const tickColor = isDark ? "hsl(215, 12%, 50%)" : "hsl(215, 12%, 45%)";

  const chartData = data?.files.slice(0, 10).map(f => ({
    name: f.file.split('/').pop()?.slice(0, 12) ?? f.file,
    ai: Math.round(f.aiLikelihood * 100),
    tech: Math.round(f.technicalDebt * 100),
    cog: Math.round(f.cognitiveDebt * 100),
    id: f.file,
  }));

  const pieData = data ? [
    { name: "Technical", value: Math.round(data.summary.avgTechnicalDebt * 100), fill: "hsl(36, 95%, 58%)" },
    { name: "Cognitive", value: Math.round(data.summary.avgCognitiveDebt * 100), fill: "hsl(270, 72%, 62%)" },
    { name: "Clean", value: Math.max(0, 100 - Math.round((data.summary.avgTechnicalDebt + data.summary.avgCognitiveDebt) * 50)), fill: "hsl(174, 72%, 52%)" },
  ] : [];

  const METRIC_FULL_NAMES: Record<string, string> = {
    DPS: "Debt Propagation Score",
    DLI: "Debt Longevity Index",
    CLI: "Cognitive Load Index",
    CCD: "Cognitive Complexity Drift",
    IAS: "Identifier Ambiguity Score",
    SUS: "Structural Uniformity Score",
    RI: "Readability Index",
    TDD: "Token Distribution Divergence",
    PRI: "Pattern Repetition Index",
    CRS: "Comment Redundancy Score",
    SCS: "Style Consistency Score",
  };

  const radarData = data ? (() => {
    const files = data.files;
    const avg = (key: keyof typeof files[0]['metrics']) =>
      Math.round(files.reduce((s, f) => s + (f.metrics[key] ?? 0), 0) / files.length * 100);
    return [
      { metric: "DPS", fullName: METRIC_FULL_NAMES.DPS, value: avg("dps") },
      { metric: "DLI", fullName: METRIC_FULL_NAMES.DLI, value: avg("dli") },
      { metric: "CLI", fullName: METRIC_FULL_NAMES.CLI, value: avg("cli") },
      { metric: "CCD", fullName: METRIC_FULL_NAMES.CCD, value: avg("ccd") },
      { metric: "IAS", fullName: METRIC_FULL_NAMES.IAS, value: avg("ias") },
      { metric: "SUS", fullName: METRIC_FULL_NAMES.SUS, value: avg("sus") },
      { metric: "RI", fullName: METRIC_FULL_NAMES.RI, value: avg("ri") },
    ];
  })() : [];

  const aiRadarData = data ? (() => {
    const files = data.files;
    const avg = (key: keyof typeof files[0]['metrics']) =>
      Math.round(files.reduce((s, f) => s + (f.metrics[key] ?? 0), 0) / files.length * 100);
    return [
      { metric: "SUS", fullName: METRIC_FULL_NAMES.SUS, value: avg("sus") },
      { metric: "TDD", fullName: METRIC_FULL_NAMES.TDD, value: avg("tdd") },
      { metric: "PRI", fullName: METRIC_FULL_NAMES.PRI, value: avg("pri") },
      { metric: "CRS", fullName: METRIC_FULL_NAMES.CRS, value: avg("crs") },
      { metric: "SCS", fullName: METRIC_FULL_NAMES.SCS, value: avg("scs") },
    ];
  })() : [];

  const heatmapData = data?.files
    .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
    .slice(0, 15)
    .map(f => ({ name: f.file.split('/').pop() || f.file, debt: Math.round((f.technicalDebt + f.cognitiveDebt) / 2 * 100) }));

  const topRiskFiles = data?.files
    .sort((a, b) => (b.aiLikelihood + b.technicalDebt + b.cognitiveDebt) - (a.aiLikelihood + a.technicalDebt + a.cognitiveDebt))
    .slice(0, 5);

  const refactorScore = data
    ? Math.round(((data.summary.avgTechnicalDebt + data.summary.avgCognitiveDebt) / 2) * 100)
    : 0;

  const confidenceScore = data ? (() => {
    const n = data.files.length;
    const avgIssues = data.summary.totalIssues / n;
    const metricConsistency = data.files.reduce((s, f) => {
      const spread = Math.abs(f.technicalDebt - f.cognitiveDebt);
      return s + (1 - spread);
    }, 0) / n;
    return Math.round(Math.min((avgIssues / 5 * 0.4 + metricConsistency * 0.6), 1) * 100);
  })() : 0;

  const debtDistribution = data ? (() => {
    const sorted = [...data.files].sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt));
    const totalDebt = sorted.reduce((s, f) => s + f.technicalDebt + f.cognitiveDebt, 0);
    let accum = 0;
    let count = 0;
    for (const f of sorted) {
      accum += f.technicalDebt + f.cognitiveDebt;
      count++;
      if (accum / totalDebt >= 0.7) break;
    }
    return { count, total: data.files.length, pct: 70 };
  })() : null;

  const getRefactorImpact = (file: NonNullable<typeof data>['files'][0]) => {
    if (!data) return { techReduction: 0, cogReduction: 0 };
    const totalTech = data.files.reduce((s, f) => s + f.technicalDebt, 0);
    const totalCog = data.files.reduce((s, f) => s + f.cognitiveDebt, 0);
    return {
      techReduction: Math.round((file.technicalDebt / totalTech) * 100),
      cogReduction: Math.round((file.cognitiveDebt / totalCog) * 100),
    };
  };

  // Debt velocity
  const debtVelocity = useMemo(() => {
    if (!timelineData || timelineData.commits.length < 2) return null;
    const commits = timelineData.commits;
    const first = commits[0];
    const last = commits[commits.length - 1];
    const delta = (last.techDebt + last.cogDebt) - (first.techDebt + first.cogDebt);
    const rate = delta / commits.length;
    if (rate > 0.02) return { label: "Fast Growing", color: "text-destructive", emoji: "🔴" };
    if (rate > 0.005) return { label: "Moderate", color: "text-accent", emoji: "🟡" };
    if (rate > -0.005) return { label: "Stable", color: "text-muted-foreground", emoji: "⚪" };
    return { label: "Improving", color: "text-neon-green", emoji: "🟢" };
  }, [timelineData]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "files", label: "Files", icon: Table2 },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "recommendations", label: "Fix Plan", icon: Wrench },
    { id: "graph", label: "Graph", icon: Network },
    { id: "deepAnalysis", label: "Deep Analysis", icon: Brain },
  ];
  const tabDescriptions: Record<Tab, string> = {
    overview: "High-level debt summary, hotspots, and visual breakdowns.",
    files: "Dive into file-level technical, cognitive, and AI metrics.",
    timeline: "Track commit-by-commit debt evolution and spike behavior.",
    recommendations: "Work through prioritized fix steps and projected impact.",
    graph: "See how debt spreads through dependencies and shared patterns.",
    deepAnalysis: "Run model-backed cognitive and AI behavior analysis.",
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10 container pb-16 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 overflow-hidden rounded-[30px] p-6 text-center surface-panel glow-panel dark:bg-gradient-to-br dark:from-primary/10 dark:via-background dark:to-primary/5 bg-gradient-to-br from-blue-50 to-slate-50 border dark:border-primary/20 border-primary/30 sm:p-8"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-primary">
            <Cpu className="h-3.5 w-3.5" />
            Strict detection mode
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl">Analysis Dashboard</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Analyze public GitHub repositories, upload code files, or paste code directly to detect technical & AI-induced debt.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
            {[
              "Interactive file breakdowns",
              "Hybrid AI verification",
              "Commit trend analysis",
            ].map((item) => (
              <span key={item} className="rounded-full border border-border bg-background/60 px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <EnhancedCodeInput onAnalyze={handleAnalyze} loading={loading} />

        {!data && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 max-w-2xl">
            <HistoryPanel onSelectRepo={(url) => handleAnalyze({ type: "github", data: url })} />
          </motion.div>
        )}

        {/* Progress bar */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-10 max-w-xl">
              <div className="rounded-xl p-5 surface-panel">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Analysis in progress</p>
                    <p className="text-xs text-muted-foreground">The dashboard is building debt signals, risk scores, and interactive views.</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-wide text-primary">Progress</p>
                    <p className="text-sm font-mono font-bold text-foreground">{progress}%</p>
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-4">
                  <motion.div className="absolute h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                  <div className="scan-bar absolute h-full w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono">{progressMsg}</span>
                  </span>
                  <span className="font-mono text-primary">{progress}%</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {progressChecklist.map((item, index) => {
                    const isDone = progress >= 20 + index * 20;
                    return (
                      <div key={item} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${isDone ? "border-primary/20 bg-primary/5 text-foreground" : "border-border bg-background/40 text-muted-foreground"}`}>
                        <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${isDone ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 mx-auto max-w-lg text-center">
              <div className="inline-flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <button onClick={() => handleAnalyze(lastUrl)} className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mt-12 space-y-10">

            {/* Repo info + tabs */}
            <div className="flex flex-wrap items-center justify-between gap-5 rounded-[24px] p-5 surface-panel glow-panel">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground font-mono">{data.repoName}</h2>
                <ReportDownload data={data} />
                {data.stars != null && data.stars > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-accent" /> {data.stars}
                  </span>
                )}
                {data.language && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Code className="h-3 w-3" /> {data.language}
                  </span>
                )}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border bg-background/40 px-2.5 py-1">Files: {data.totalFiles}</span>
                  <span className="rounded-full border border-border bg-background/40 px-2.5 py-1">High risk: {data.summary.highRiskFiles}</span>
                  <span className="rounded-full border border-border bg-background/40 px-2.5 py-1">Issues: {data.summary.totalIssues}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5 surface-soft">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-xl bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <tab.icon className="h-3 w-3 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground"
            >
              {tabDescriptions[activeTab]}
            </motion.div>

            {/* Score Bars */}
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { label: "AI Detection", metric: "AI Likelihood", value: data.summary.avgAiLikelihood, gradient: "from-primary to-[hsl(200,80%,50%)]" },
                { label: "Technical Debt", metric: "Technical Debt", value: data.summary.avgTechnicalDebt, gradient: "from-accent to-[hsl(15,80%,50%)]" },
                { label: "Cognitive Debt", metric: "Cognitive Debt", value: data.summary.avgCognitiveDebt, gradient: "from-[hsl(270,72%,62%)] to-[hsl(300,60%,50%)]" },
              ].map((bar, i) => (
                <motion.div key={bar.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl p-5 surface-panel card-hover">
                  <div className="flex justify-between items-center mb-2">
                    <MetricTooltip metric={bar.metric}>
                      <span className="text-xs font-semibold text-foreground">{bar.label}</span>
                    </MetricTooltip>
                    <span className="text-lg font-black font-mono text-foreground">{(bar.value * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div className={`h-full rounded-full bg-gradient-to-r ${bar.gradient}`} initial={{ width: 0 }} animate={{ width: `${bar.value * 100}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Insights row */}
            <div className="grid gap-5 sm:grid-cols-2">
              {debtDistribution && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 backdrop-blur-sm">
                  <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-foreground">
                    <strong className="text-primary">{debtDistribution.pct}%</strong> of debt from just{" "}
                    <strong className="text-primary">{debtDistribution.count} files</strong> of {debtDistribution.total}.
                  </p>
                </motion.div>
              )}
              {debtVelocity && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 rounded-xl p-5 surface-panel">
                  <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Debt Velocity</p>
                    <p className={`text-sm font-bold ${debtVelocity.color}`}>{debtVelocity.emoji} {debtVelocity.label}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-6">

                  {/* Refactor Score + Top Risk */}
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 card-hover">
                      <MetricTooltip metric="Refactor Priority Score">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame className="h-4 w-4 text-destructive" />
                          <h3 className="text-sm font-semibold text-foreground">Refactor Priority</h3>
                        </div>
                      </MetricTooltip>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-black font-mono text-foreground">{refactorScore}</span>
                        <span className="text-sm text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: refactorScore > 60 ? "hsl(var(--destructive))" : refactorScore > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${refactorScore}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {refactorScore > 60 ? "⚠️ High priority – refactor soon" : refactorScore > 30 ? "⚡ Moderate – schedule cleanup" : "✅ Low debt – code looks healthy"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 lg:col-span-2 card-hover">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4 text-destructive" />
                        <h3 className="text-sm font-semibold text-foreground">Top Risk Files</h3>
                        <span className="text-[10px] text-muted-foreground ml-auto">Click for refactor impact</span>
                      </div>
                      <div className="space-y-2.5">
                        {topRiskFiles?.map((f, i) => {
                          const risk = Math.round((f.aiLikelihood + f.technicalDebt + f.cognitiveDebt) / 3 * 100);
                          const impact = getRefactorImpact(f);
                          const isExpanded = expandedFile === f.file;
                          return (
                            <div key={f.file}>
                              <button
                                onClick={() => setExpandedFile(isExpanded ? null : f.file)}
                                className="flex w-full items-center gap-3 hover:bg-secondary/30 rounded-lg px-2 py-1 transition-colors"
                              >
                                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                                <span className="flex-1 text-xs font-mono text-foreground truncate text-left">{f.file.split('/').slice(-2).join('/')}</span>
                                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: risk > 60 ? "hsl(var(--destructive))" : risk > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))" }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${risk}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-8 text-right" style={{ color: risk > 60 ? "hsl(var(--destructive))" : risk > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))" }}>{risk}%</span>
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-6">
                                    <div className="rounded-lg bg-secondary/30 p-3 mt-1 text-xs space-y-1.5">
                                      {f.explanation && <p className="text-muted-foreground italic border-l-2 border-primary/30 pl-2 mb-2">{f.explanation}</p>}
                                      <p className="text-muted-foreground"><strong className="text-foreground">If you fix this file:</strong></p>
                                      <p className="text-muted-foreground">→ Technical debt reduces by <strong className="text-neon-green">{impact.techReduction}%</strong></p>
                                      <p className="text-muted-foreground">→ Cognitive debt reduces by <strong className="text-neon-green">{impact.cogReduction}%</strong></p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {f.issues.slice(0, 4).map(iss => (
                                          <span key={iss} className="rounded bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">{iss}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 lg:col-span-2 card-hover">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Distribution by File</h3>
                      <div className="h-48 sm:h-56 lg:h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} barGap={2} onClick={(e:any) => {
                          const id = e?.activePayload?.[0]?.payload?.id;
                          if (id) { setSelectedFile(id); setActiveTab('files'); }
                        }}>
                          <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 9 }} />
                          <YAxis tick={{ fill: tickColor, fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} cursor={{ fill: "hsl(var(--primary) / 0.05)" }} formatter={(value:number, name:string, props:any) => [`${value}%`, name]} />
                          <Bar dataKey="ai" name="AI Likelihood %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(174, 72%, 52%)" fillOpacity={0.75} />)}
                          </Bar>
                          <Bar dataKey="tech" name="Tech Debt %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(36, 95%, 58%)" fillOpacity={0.75} />)}
                          </Bar>
                          <Bar dataKey="cog" name="Cognitive %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(270, 72%, 62%)" fillOpacity={0.75} />)}
                          </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt DNA</h3>
                      <div className="h-44 sm:h-52 lg:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
                        </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                        {pieData.map(d => (
                          <span key={d.name} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                            {d.name}: <span className="text-foreground font-mono">{d.value}%</span>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Radar + AI Detection + Heatmap */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt DNA Radar</h3>
                      <div className="h-48 sm:h-56 lg:h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={({ x, y, payload, textAnchor }: any) => (
                            <text x={x} y={y} textAnchor={textAnchor} fill={tickColor} fontSize={9} className="cursor-help">
                              <title>{METRIC_FULL_NAMES[payload.value] || payload.value}</title>
                              {payload.value}
                            </text>
                          )} />
                          <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 7 }} domain={[0, 100]} />
                          <Radar name="Score" dataKey="value" stroke="hsl(174, 72%, 52%)" fill="hsl(174, 72%, 52%)" fillOpacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} formatter={(value: number, name: string, props: any) => [
                            `${value}%`, METRIC_FULL_NAMES[props.payload?.metric] || props.payload?.metric
                          ]} />
                        </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-4 card-hover">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">🤖 AI Detection Radar</h3>
                      <div className="h-40 sm:h-48 lg:h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={aiRadarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={({ x, y, payload, textAnchor }: any) => (
                            <text x={x} y={y} textAnchor={textAnchor} fill={tickColor} fontSize={9} className="cursor-help">
                              <title>{METRIC_FULL_NAMES[payload.value] || payload.value}</title>
                              {payload.value}
                            </text>
                          )} />
                          <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 7 }} domain={[0, 100]} />
                          <Radar name="AI Score" dataKey="value" stroke="hsl(270, 72%, 62%)" fill="hsl(270, 72%, 62%)" fillOpacity={0.25} />
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} formatter={(value: number, name: string, props: any) => [
                            `${value}%`, METRIC_FULL_NAMES[props.payload?.metric] || props.payload?.metric
                          ]} />
                        </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-2xl font-black font-mono text-primary">{(data.summary.avgAiLikelihood * 100).toFixed(0)}%</span>
                        <p className="text-[10px] text-muted-foreground">AI Generated Code</p>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Heatmap</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {heatmapData?.map((f, i) => {
                          const intensity = f.debt / 100;
                          const hue = 174 - intensity * 174;
                          return (
                            <motion.div
                              key={f.name}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04 }}
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              className="group relative flex items-center justify-center rounded-lg p-3 cursor-default"
                              style={{ backgroundColor: `hsl(${hue}, 72%, 52%, ${0.15 + intensity * 0.4})` }}
                            >
                              <span className="text-[8px] font-mono text-foreground truncate">{f.name.slice(0, 8)}</span>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground border border-border whitespace-nowrap z-20 shadow-lg">
                                {f.name}: {f.debt}%
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  <InsightsPanel data={data} />
                </motion.div>
              )}

              {activeTab === "files" && (
                <motion.div key="files" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  <FileTable files={data.files} selectedFile={selectedFile} onSelectFile={(f) => { setSelectedFile(f); setActiveTab('files'); }} />
                </motion.div>
              )}

              {activeTab === "timeline" && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  {timelineLoading ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                      </div>
                      <Skeleton className="h-80 rounded-xl" />
                    </div>
                  ) : timelineData ? (
                    <CommitTimeline {...timelineData} />
                  ) : (
                    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Timeline data is loading in the background...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "recommendations" && (
                <motion.div key="recommendations" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  <RefactorRecommendations files={data.files} />
                </motion.div>
              )}

              {activeTab === "graph" && (
                <motion.div key="graph" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
                    <PropagationGraph data={data} />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === "deepAnalysis" && (
                <motion.div key="deepAnalysis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-8">
                  <DeveloperCognitiveSimulation data={data} />
                  <HumanCognitiveModel analysisData={data} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
