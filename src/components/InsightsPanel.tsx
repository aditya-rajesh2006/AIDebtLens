import { motion } from "framer-motion";
import { AlertTriangle, Brain, GitFork, Wrench, Cpu } from "lucide-react";
import type { AnalysisResult } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

export default function InsightsPanel({ data }: Props) {
  const highDebt = [...data.files].sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt)).slice(0, 5);
  const highPropagation = [...data.files].sort((a, b) => b.propagationScore - a.propagationScore).slice(0, 3);
  const highCognitive = [...data.files].sort((a, b) => b.cognitiveDebt - a.cognitiveDebt).slice(0, 3);

  // AI Contribution calculation
  const totalSystemDebt = data.files.reduce((s, f) => s + f.technicalDebt + f.cognitiveDebt, 0);
  const totalAIDebt = data.files.reduce((s, f) => {
    const aiSignal = f.aiLikelihood * Math.max(f.metrics.sus, f.metrics.pri, 0.3);
    return s + aiSignal * (f.technicalDebt + f.cognitiveDebt);
  }, 0);
  const aiDebtPct = totalSystemDebt > 0 ? Math.round((totalAIDebt / totalSystemDebt) * 100) : 0;

  // Most problematic file
  const worstFile = highDebt[0];
  const worstFileDebtPct = worstFile && totalSystemDebt > 0
    ? Math.round(((worstFile.technicalDebt + worstFile.cognitiveDebt) / totalSystemDebt) * 100)
    : 0;

  const sections = [
    {
      icon: AlertTriangle,
      title: "Highest Combined Debt",
      items: highDebt.map(f => ({ label: f.file.split('/').pop()!, value: `${((f.technicalDebt + f.cognitiveDebt) / 2 * 100).toFixed(0)}%` })),
      color: "text-destructive",
    },
    {
      icon: GitFork,
      title: "Most Propagated Sources",
      items: highPropagation.map(f => ({ label: f.file.split('/').pop()!, value: `${(f.propagationScore * 100).toFixed(0)}%` })),
      color: "text-accent",
    },
    {
      icon: Brain,
      title: "High Cognitive Burden",
      items: highCognitive.map(f => ({ label: f.file.split('/').pop()!, value: `${(f.cognitiveDebt * 100).toFixed(0)}%` })),
      color: "text-neon-purple",
    },
    {
      icon: Wrench,
      title: "Refactor First",
      items: data.summary.topRefactorTargets.map(f => ({ label: f.split('/').pop()!, value: "Priority" })),
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      {/* AI Contribution + Most Problematic Insight */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
        >
          <Cpu className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">AI Debt Contribution</p>
            <p className="text-sm text-muted-foreground">
              AI-generated code contributes <strong className="text-primary font-mono text-base">{aiDebtPct}%</strong> of total system debt across {data.totalFiles} files.
            </p>
          </div>
        </motion.div>
        {worstFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Most Problematic File</p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground font-mono">{worstFile.file.split('/').pop()}</strong> contributes{' '}
                <strong className="text-destructive font-mono">{worstFileDebtPct}%</strong> of total cognitive debt due to{' '}
                {worstFile.issues.slice(0, 2).join(' and ')}.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Metric Sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`h-4 w-4 ${section.color}`} />
              <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground truncate mr-2">{item.label}</span>
                  <span className={`font-semibold ${section.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
