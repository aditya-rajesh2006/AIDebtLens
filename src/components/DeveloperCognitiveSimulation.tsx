import { motion } from "framer-motion";
import {
  Brain, Eye, GitFork, Layers, Cpu, Workflow, Activity,
  TrendingUp, AlertTriangle, Gauge
} from "lucide-react";
import type { AnalysisResult } from "@/lib/mockAnalysis";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell,
} from "recharts";

interface Props {
  data: AnalysisResult;
}

function ScoreGauge({ label, value, max = 1, icon: Icon, color, description }: {
  label: string; value: number; max?: number; icon: React.ElementType; color: string; description: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-1 mb-2">
        <span className={`text-3xl font-black font-mono ${color}`}>{pct}</span>
        <span className="text-xs text-muted-foreground mb-1">/ 100</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `hsl(var(--${pct > 60 ? "destructive" : pct > 30 ? "neon-amber" : "primary"}))` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function MetricBar({ label, value, color, tooltip }: { label: string; value: number; color: string; tooltip: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1" title={tooltip}>
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

export default function DeveloperCognitiveSimulation({ data }: Props) {
  const files = data.files;
  const n = files.length;

  const isDark = document.documentElement.classList.contains("dark");
  const tooltipBg = isDark ? "hsl(220, 18%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 14%, 16%)" : "hsl(210, 14%, 88%)";
  const tickColor = isDark ? "hsl(215, 12%, 50%)" : "hsl(215, 12%, 45%)";

  // Averages
  const avg = (key: keyof typeof files[0]['metrics']) =>
    files.reduce((s, f) => s + (f.metrics[key] ?? 0), 0) / n;

  const avgAITDIS = avg("aitdis");
  const avgDCS = avg("dcs");
  const avgACTDI = avg("actdi");

  // DCS Radar
  const dcsRadarData = [
    { metric: "IRD", value: Math.round(avg("ird") * 100) },
    { metric: "CFSC", value: Math.round(avg("cfsc") * 100) },
    { metric: "STL", value: Math.round(avg("stl") * 100) },
    { metric: "DRC", value: Math.round(avg("drc") * 100) },
    { metric: "AIC", value: Math.round(avg("aic") * 100) },
  ];

  // AITDIS Radar
  const aitdisRadarData = [
    { metric: "ADAF", value: Math.round(Math.min(avg("adaf") / 10, 1) * 100) },
    { metric: "CTD", value: Math.round(avg("ctd") * 100) },
    { metric: "SRD", value: Math.round(avg("srd") * 100) },
    { metric: "AAM", value: Math.round(avg("aam") * 100) },
    { metric: "IOS", value: Math.round(avg("ios") * 100) },
    { metric: "HMMD", value: Math.round(avg("hmmd") * 100) },
  ];

  // Per-file AITDIS bar chart
  const fileBarData = [...files]
    .sort((a, b) => b.metrics.aitdis - a.metrics.aitdis)
    .slice(0, 12)
    .map(f => ({
      name: f.file.split('/').pop()?.slice(0, 10) ?? f.file,
      aitdis: Math.round(f.metrics.aitdis * 100),
      dcs: Math.round(f.metrics.dcs * 100),
      actdi: Math.round(f.metrics.actdi * 100),
    }));

  // AI Cognitive Debt = DCS_AI - DCS_Human baseline (simulated)
  const humanBaseline = 0.15;
  const aiCogDebt = Math.max(0, avgDCS - humanBaseline);

  return (
    <div className="space-y-6">
      {/* Composite Scores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreGauge label="AITDIS" value={avgAITDIS} icon={Cpu} color="text-primary"
          description="AI Technical Debt Impact Score — composite of ADAF, CTD, SRD, AAM, IOS, ADPV, HMMD" />
        <ScoreGauge label="DCS" value={avgDCS} icon={Brain} color="text-neon-purple"
          description="Developer Cognitive Simulation — mental effort to simulate code execution" />
        <ScoreGauge label="ACTDI" value={avgACTDI} icon={Activity} color="text-accent"
          description="AI Cognitive Technical Debt Index — final composite of DCS + propagation + code smells" />
        <ScoreGauge label="AI Cog Debt" value={aiCogDebt} icon={AlertTriangle}
          color={aiCogDebt > 0.3 ? "text-destructive" : aiCogDebt > 0.15 ? "text-accent" : "text-primary"}
          description={`Extra cognitive cost from AI code vs human baseline (${(humanBaseline * 100).toFixed(0)}%)`} />
      </div>

      {/* Radar Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">AI Debt Impact Radar (AITDIS)</h4>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={aitdisRadarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 7 }} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="hsl(174, 72%, 52%)" fill="hsl(174, 72%, 52%)" fillOpacity={0.2} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-neon-purple/20 bg-neon-purple/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-neon-purple" />
            <h4 className="text-xs font-semibold text-foreground">Developer Cognitive Simulation (DCS)</h4>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={dcsRadarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 7 }} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="hsl(270, 72%, 62%)" fill="hsl(270, 72%, 62%)" fillOpacity={0.25} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Debt Metric Breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-4">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">AI Debt Amplification</p>
          <MetricBar label="ADAF (Amplification)" value={Math.min(avg("adaf") / 10, 1)} color="hsl(174, 72%, 52%)"
            tooltip="How much debt grows from AI code seeds" />
          <div className="mt-2">
            <MetricBar label="CTD (Trace Divergence)" value={avg("ctd")} color="hsl(174, 65%, 48%)"
              tooltip="Execution logic deviation from human reasoning" />
          </div>
          <div className="mt-2">
            <MetricBar label="SRD (Redundancy)" value={avg("srd")} color="hsl(174, 58%, 44%)"
              tooltip="Redundant conditions and checks" />
          </div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 backdrop-blur-sm p-4">
          <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-3">Structural Misalignment</p>
          <MetricBar label="AAM (Abstraction)" value={avg("aam")} color="hsl(36, 95%, 58%)"
            tooltip="AI introduces abstractions at wrong levels" />
          <div className="mt-2">
            <MetricBar label="IOS (Intent Obfuscation)" value={avg("ios")} color="hsl(36, 80%, 50%)"
              tooltip="How hard it is to infer code purpose" />
          </div>
          <div className="mt-2">
            <MetricBar label="HMMD (Model Divergence)" value={avg("hmmd")} color="hsl(36, 70%, 45%)"
              tooltip="Structural deviation from human code patterns" />
          </div>
        </div>

        <div className="rounded-xl border border-neon-purple/20 bg-neon-purple/5 backdrop-blur-sm p-4">
          <p className="text-[10px] font-semibold text-neon-purple uppercase tracking-wider mb-3">Cognitive Simulation</p>
          <MetricBar label="IRD (Intent Recognition)" value={avg("ird")} color="hsl(270, 72%, 62%)"
            tooltip="Difficulty inferring what code does" />
          <div className="mt-2">
            <MetricBar label="CFSC (Control Flow)" value={avg("cfsc")} color="hsl(270, 65%, 58%)"
              tooltip="Cost of tracing execution paths" />
          </div>
          <div className="mt-2">
            <MetricBar label="STL (State Tracking)" value={avg("stl")} color="hsl(270, 58%, 54%)"
              tooltip="Mental load tracking variable states" />
          </div>
          <div className="mt-2">
            <MetricBar label="DRC (Dependency)" value={avg("drc")} color="hsl(270, 52%, 50%)"
              tooltip="Effort to resolve external references" />
          </div>
          <div className="mt-2">
            <MetricBar label="AIC (Abstraction)" value={avg("aic")} color="hsl(270, 46%, 46%)"
              tooltip="Difficulty understanding abstraction layers" />
          </div>
        </div>
      </div>

      {/* Per-file Bar Chart */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">File-Level AI Debt Scores</h4>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={fileBarData} barGap={2}>
            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 8 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 9 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
              cursor={{ fill: "hsl(var(--primary) / 0.05)" }} />
            <Bar dataKey="aitdis" name="AITDIS %" radius={[3, 3, 0, 0]}>
              {fileBarData.map((_, i) => <Cell key={i} fill="hsl(174, 72%, 52%)" fillOpacity={0.75} />)}
            </Bar>
            <Bar dataKey="dcs" name="DCS %" radius={[3, 3, 0, 0]}>
              {fileBarData.map((_, i) => <Cell key={i} fill="hsl(270, 72%, 62%)" fillOpacity={0.75} />)}
            </Bar>
            <Bar dataKey="actdi" name="ACTDI %" radius={[3, 3, 0, 0]}>
              {fileBarData.map((_, i) => <Cell key={i} fill="hsl(36, 95%, 58%)" fillOpacity={0.75} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground justify-center">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(174, 72%, 52%)" }} />AITDIS</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(270, 72%, 62%)" }} />DCS</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(36, 95%, 58%)" }} />ACTDI</span>
        </div>
      </div>

      {/* Formula Reference */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
        <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          Composite Metric Formulas
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-[10px] font-bold text-primary mb-1">AITDIS</p>
            <p className="text-[9px] font-mono text-muted-foreground leading-relaxed">
              0.20×ADAF + 0.15×CTD + 0.15×SRD + 0.15×AAM + 0.15×IOS + 0.10×ADPV + 0.10×HMMD
            </p>
          </div>
          <div className="rounded-lg bg-neon-purple/5 border border-neon-purple/10 p-3">
            <p className="text-[10px] font-bold text-neon-purple mb-1">DCS</p>
            <p className="text-[9px] font-mono text-muted-foreground leading-relaxed">
              0.25×IRD + 0.20×CFSC + 0.20×STL + 0.20×DRC + 0.15×AIC
            </p>
          </div>
          <div className="rounded-lg bg-accent/5 border border-accent/10 p-3">
            <p className="text-[10px] font-bold text-accent mb-1">ACTDI</p>
            <p className="text-[9px] font-mono text-muted-foreground leading-relaxed">
              0.40×DCS + 0.30×Propagation + 0.20×CodeSmells + 0.10×MaintainabilityLoss
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
