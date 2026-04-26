import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, User, Zap, Activity, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, Area, AreaChart } from "recharts";
import { Slider } from "@/components/ui/slider";
import MetricTooltip from "@/components/MetricTooltip";

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  techDebt: number;
  cogDebt: number;
  aiContribution: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  isSpike: boolean;
  growthFactor?: number;
  debtVelocity?: number;
  debtAcceleration?: number;
  cognitiveTemporalInteraction?: number;
  debtIntroduction?: number;
  debtReduction?: number;
}

interface Developer {
  name: string;
  techImpact: number;
  cogImpact: number;
  commits: number;
  totalImpact: number;
}

interface CommitTimelineProps {
  commits: CommitData[];
  developers: Developer[];
  trend: string;
  momentum: string;
  prediction: {
    techDebt5: number;
    techDebt10: number;
    cogDebt5: number;
    cogDebt10: number;
  };
  spikeCount: number;
  averageDebtVelocity?: number;
  averageDebtAcceleration?: number;
  trendClassification?: string;
}

export default function CommitTimeline({
  commits,
  developers,
  trend,
  momentum,
  prediction,
  spikeCount,
  averageDebtVelocity,
  averageDebtAcceleration,
  trendClassification,
}: CommitTimelineProps) {
  const [sliderValue, setSliderValue] = useState([commits.length - 1]);
  const isDark = document.documentElement.classList.contains("dark");
  const tooltipBg = isDark ? "hsl(220, 18%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 14%, 16%)" : "hsl(210, 14%, 88%)";
  const tickColor = isDark ? "hsl(215, 12%, 50%)" : "hsl(215, 12%, 45%)";

  const currentCommit = commits[sliderValue[0]];
  const visibleCommits = commits.slice(0, sliderValue[0] + 1);

  // Add prediction points
  const chartData = visibleCommits.map((c, i) => ({
    name: c.sha,
    tech: Math.round(c.techDebt * 100),
    cog: Math.round(c.cogDebt * 100),
    ai: Math.round(c.aiContribution * 100),
    isSpike: c.isSpike,
    idx: i,
  }));

  // Append prediction if showing all commits
  if (sliderValue[0] === commits.length - 1) {
    chartData.push({
      name: "+5",
      tech: Math.round(prediction.techDebt5 * 100),
      cog: Math.round(prediction.cogDebt5 * 100),
      ai: chartData[chartData.length - 1]?.ai || 0,
      isSpike: false,
      idx: chartData.length,
    });
    chartData.push({
      name: "+10",
      tech: Math.round(prediction.techDebt10 * 100),
      cog: Math.round(prediction.cogDebt10 * 100),
      ai: chartData[chartData.length - 1]?.ai || 0,
      isSpike: false,
      idx: chartData.length,
    });
  }

  const trendIcon = trend === "improving" ? TrendingDown : TrendingUp;
  const trendColor = trend === "improving" ? "text-neon-green" : trend === "increasing" ? "text-destructive" : "text-accent";
  const momentumColor = momentum === "fast" ? "text-destructive" : momentum === "slow" ? "text-accent" : "text-neon-green";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`h-4 w-4 ${trendColor}`} />
            <span className="text-xs font-semibold text-foreground">Trend</span>
          </div>
          <p className={`text-lg font-black font-mono capitalize ${trendColor}`}>{trend}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Based on {commits.length} commits</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`h-4 w-4 ${momentumColor}`} />
            <span className="text-xs font-semibold text-foreground">Momentum</span>
          </div>
          <p className={`text-lg font-black font-mono capitalize ${momentumColor}`}>{momentum}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Current growth rate</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-semibold text-foreground">Debt Spikes</span>
          </div>
          <p className="text-lg font-black font-mono text-destructive">{spikeCount}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Sudden debt increases</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Predicted</span>
          </div>
          <p className="text-lg font-black font-mono text-primary">{Math.round(prediction.techDebt10 * 100)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Tech debt in +10 commits</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <MetricTooltip metric="DV"><Activity className="h-4 w-4 text-primary" /></MetricTooltip>
            <span className="text-xs font-semibold text-foreground">Avg DV</span>
          </div>
          <p className="text-lg font-black font-mono text-primary">{Math.round((averageDebtVelocity ?? 0) * 100)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Debt velocity</p>
        </div>
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <MetricTooltip metric="DA"><TrendingUp className="h-4 w-4 text-accent" /></MetricTooltip>
            <span className="text-xs font-semibold text-foreground">Avg DA</span>
          </div>
          <p className="text-lg font-black font-mono text-accent">{Math.round((averageDebtAcceleration ?? 0) * 100)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">{trendClassification || trend}</p>
        </div>
      </div>

      {/* Timeline chart with slider */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 card-hover">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Debt Evolution Timeline</h3>
          {currentCommit && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {currentCommit.sha} · {currentCommit.author} · {new Date(currentCommit.date).toLocaleDateString()}
            </span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(36, 95%, 58%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(36, 95%, 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(270, 72%, 62%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270, 72%, 62%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 52%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 72%, 52%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 9 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 9 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
              labelFormatter={(label) => {
                const commit = commits.find(c => c.sha === label);
                return commit ? `${commit.sha} — ${commit.message.slice(0, 50)}` : label;
              }}
            />
            <Area type="monotone" dataKey="tech" name="Tech Debt %" stroke="hsl(36, 95%, 58%)" fill="url(#techGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="cog" name="Cognitive %" stroke="hsl(270, 72%, 62%)" fill="url(#cogGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="ai" name="AI Contrib %" stroke="hsl(174, 72%, 52%)" fill="url(#aiGrad)" strokeWidth={2} />
            {chartData.filter(d => d.isSpike).map(d => (
              <ReferenceDot key={d.name} x={d.name} y={d.tech} r={6} fill="hsl(0, 84%, 60%)" stroke="hsl(0, 84%, 40%)" strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Timeline Slider */}
        <div className="mt-4 px-2">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            min={0}
            max={commits.length - 1}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
            <span>{commits[0]?.sha}</span>
            <span>Commit {sliderValue[0] + 1} of {commits.length}</span>
            <span>{commits[commits.length - 1]?.sha}</span>
          </div>
        </div>

        {/* Current commit info */}
        {currentCommit && (
          <motion.div
            key={currentCommit.sha}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-foreground">{currentCommit.sha}</span>
              <span className="text-muted-foreground">{currentCommit.author}</span>
            </div>
            <p className="text-muted-foreground mb-2 truncate">{currentCommit.message}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentCommit.aiContribution > 0.6 && <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">🤖 AI-heavy</span>}
              {currentCommit.isSpike && <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] text-destructive font-medium">📈 Spike</span>}
              {currentCommit.deletions > currentCommit.additions * 1.5 && <span className="rounded-full bg-neon-green/10 border border-neon-green/20 px-2 py-0.5 text-[10px] text-neon-green font-medium">🔧 Refactor</span>}
              {currentCommit.techDebt < 0.3 && currentCommit.cogDebt < 0.3 && <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">✅ Clean</span>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-muted-foreground">Tech Debt</span>
                <p className="font-mono font-bold" style={{ color: "hsl(36, 95%, 58%)" }}>{Math.round(currentCommit.techDebt * 100)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cognitive</span>
                <p className="font-mono font-bold" style={{ color: "hsl(270, 72%, 62%)" }}>{Math.round(currentCommit.cogDebt * 100)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Files</span>
                <p className="font-mono font-bold text-foreground">+{currentCommit.additions} / -{currentCommit.deletions}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">G</p>
                <p className="font-mono text-sm font-semibold text-foreground">{((currentCommit.growthFactor ?? 1) * 100).toFixed(0)}%</p>
              </div>
              <div className="rounded-md bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">DV / DA</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {Math.round((currentCommit.debtVelocity ?? 0) * 100)}% / {Math.round((currentCommit.debtAcceleration ?? 0) * 100)}%
                </p>
              </div>
              <div className="rounded-md bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">CTI</p>
                <p className="font-mono text-sm font-semibold text-foreground">{Math.round((currentCommit.cognitiveTemporalInteraction ?? 0) * 100)}%</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <MetricTooltip metric="DI"><span className="rounded-full border border-border px-2 py-1">DI {Math.round((currentCommit.debtIntroduction ?? 0) * 100)}%</span></MetricTooltip>
              <MetricTooltip metric="DR"><span className="rounded-full border border-border px-2 py-1">DR {Math.round((currentCommit.debtReduction ?? 0) * 100)}%</span></MetricTooltip>
              <MetricTooltip metric="CTI"><span className="rounded-full border border-border px-2 py-1">CTI {Math.round((currentCommit.cognitiveTemporalInteraction ?? 0) * 100)}%</span></MetricTooltip>
            </div>
            {currentCommit.isSpike && (
              <div className="mt-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-semibold">🚨 Debt spike detected in this commit</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Developer Impact Leaderboard */}
      {developers.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 card-hover">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Developer Impact</h3>
            </div>
            <div className="space-y-3">
              {developers.slice(0, 8).map((dev, i) => (
                <div key={dev.name} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="flex-1 text-xs font-mono text-foreground truncate">{dev.name}</span>
                  <span className="text-[10px] text-muted-foreground">{dev.commits} commits</span>
                  <span className={`text-xs font-mono font-bold ${dev.totalImpact > 0 ? "text-destructive" : "text-neon-green"}`}>
                    {dev.totalImpact > 0 ? "+" : ""}{Math.round(dev.totalImpact * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction */}
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 card-hover">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Future Debt Prediction</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tech Debt in +5 commits</span>
                  <span className="font-mono text-foreground">{Math.round(prediction.techDebt5 * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(36, 95%, 58%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.techDebt5 * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tech Debt in +10 commits</span>
                  <span className="font-mono text-foreground">{Math.round(prediction.techDebt10 * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(0, 84%, 60%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.techDebt10 * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Cognitive Debt in +5 commits</span>
                  <span className="font-mono text-foreground">{Math.round(prediction.cogDebt5 * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(270, 72%, 62%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.cogDebt5 * 100}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Cognitive Debt in +10 commits</span>
                  <span className="font-mono text-foreground">{Math.round(prediction.cogDebt10 * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(270, 55%, 50%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.cogDebt10 * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
