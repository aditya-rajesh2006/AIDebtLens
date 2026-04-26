import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, FileCode, AlertTriangle, Flame, Brain, Info } from "lucide-react";
import ScoreBar from "./ScoreBar";
import DebtBreakdown from "./DebtBreakdown";
import MetricTooltip from "./MetricTooltip";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  files: FileAnalysis[];
  selectedFile?: string | null;
  onSelectFile?: (file: string) => void;
}

export default function FileTable({ files, selectedFile, onSelectFile }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"ai" | "tech" | "cog">("ai");
  const normalizedFilter = filter.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = files.filter((file) => {
      if (!normalizedFilter) return true;
      const filePath = file.file.toLowerCase();
      const fileName = file.file.split("/").pop()?.toLowerCase() ?? "";
      const issues = file.issues.join(" ").toLowerCase();
      return filePath.includes(normalizedFilter) || fileName.includes(normalizedFilter) || issues.includes(normalizedFilter);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "ai") return b.aiLikelihood - a.aiLikelihood;
      if (sortBy === "tech") return b.technicalDebt - a.technicalDebt;
      return b.cognitiveDebt - a.cognitiveDebt;
    });
  }, [files, normalizedFilter, sortBy]);

  useEffect(() => {
    if (expanded && !sorted.some((file) => file.file === expanded)) {
      setExpanded(null);
    }
  }, [expanded, sorted]);

  useEffect(() => {
    if (!selectedFile) return;
    setExpanded(selectedFile);
  }, [selectedFile]);

  const formatPct = (value: number) => `${Math.round(value * 100)}%`;

  const debtBadges = (file: FileAnalysis) => [
    { label: "AI", value: file.aiLikelihood, tone: "text-primary" },
    { label: "TD", value: file.technicalDebt, tone: "text-accent" },
    { label: "CD", value: file.cognitiveDebt, tone: "text-neon-purple" },
  ];

  const confusionHotspots = files
    .filter(f => f.cognitiveDebt > 0.6 && f.cyclomaticComplexity > 8)
    .sort((a, b) => b.cognitiveDebt - a.cognitiveDebt)
    .slice(0, 3);

  // Expand when selectedFile changes
  // (selectedFile prop may be passed from dashboard chart clicks)
  // use a shallow effect to only change expanded when different
  useEffect(() => {
    if (!selectedFile) return;
    setExpanded(selectedFile);
  }, [selectedFile]);

  return (
    <div className="space-y-4 overflow-x-auto px-2 sm:px-0">
      {confusionHotspots.length > 0 && (
        <div className="rounded-xl border border-neon-purple/20 bg-neon-purple/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-neon-purple" />
            <span className="text-xs font-semibold text-foreground">Confusion Hotspots</span>
            <span className="text-[10px] text-muted-foreground ml-auto">High cognitive debt + high complexity</span>
          </div>
          <div className="space-y-2">
            {confusionHotspots.map(f => (
              <div key={f.file} className="flex items-center gap-3 text-xs">
                <Flame className="h-3 w-3 text-neon-purple shrink-0" />
                <span className="font-mono text-foreground truncate flex-1">{f.file.split("/").pop()}</span>
                <span className="text-muted-foreground">CLI: <strong className="text-neon-purple">{((f.metrics.cli ?? f.cognitiveDebt) * 100).toFixed(0)}%</strong></span>
                <span className="text-muted-foreground">Complexity: <strong className="text-foreground">{f.cyclomaticComplexity}</strong></span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-1">⚠️ These files are frequently hard to understand — prioritize refactoring</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">File Analysis</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter files..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "ai" | "tech" | "cog")}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="ai">AI Likelihood</option>
              <option value="tech">Tech Debt</option>
              <option value="cog">Cognitive Debt</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {sorted.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No files match <span className="font-mono text-foreground">{filter}</span>.
            </div>
          )}
          {sorted.map((file) => (
            <div key={file.file}>
              <button
                  onClick={() => {
                      setExpanded(expanded === file.file ? null : file.file);
                      if (onSelectFile) onSelectFile(file.file);
                  }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
              >
                {expanded === file.file ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-mono text-foreground">{file.file}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                    {debtBadges(file).map((metric) => (
                      <span key={metric.label}>
                        {metric.label}: <strong className={metric.tone}>{formatPct(metric.value)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  {file.aiLikelihood > 0.7 && <AlertTriangle className="h-3 w-3 text-accent" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded === file.file && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border dark:bg-gradient-to-b dark:from-primary/5 dark:via-background dark:to-primary/3 bg-gradient-to-b from-blue-50 to-slate-50 backdrop-blur-sm"
                  >
                    <div className="p-4 space-y-4">
                      {/* AI Detection Summary */}
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Generated Code</span>
                          <span className="text-lg font-black font-mono text-primary">{(file.aiLikelihood * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                          {file.metrics.sus > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">repetitive patterns</span>}
                          {file.metrics.crs > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">redundant comments</span>}
                          {file.metrics.scs > 0.5 && <span className="rounded bg-primary/10 px-1.5 py-0.5">uniform style</span>}
                          {file.metrics.ias > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">naming mismatch risk</span>}
                          {file.metrics.pri > 0.2 && <span className="rounded bg-primary/10 px-1.5 py-0.5">high repetition</span>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* AI DETECTION METRICS */}
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">🤖 AI Detection</p>
                          <div className="space-y-1.5">
                            {[
                              { key: "SUS", formula: "1 - variance(functions)", desc: "Function structure similarity" },
                              { key: "TDD", formula: "KL_divergence(tokens)", desc: "Token usage pattern deviation" },
                              { key: "PRI", formula: "repeated_patterns / total", desc: "Logic block repetition" },
                              { key: "CRS", formula: "obvious_comments / total", desc: "Comments restating code" },
                              { key: "SCS", formula: "1 - variance(style)", desc: "Uniform formatting" }
                            ].map(m => (
                              <MetricTooltip key={m.key} metricKey={m.key} customFormula={m.formula} customDesc={m.desc}>
                                <div className="flex items-center justify-between gap-2 hover:bg-primary/5 p-2 rounded cursor-help transition-colors">
                                  <span className="font-mono text-xs font-semibold text-primary min-w-12">{m.key}</span>
                                  <ScoreBar value={(file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) as number} color="from-primary" className="flex-1" showLabel={false} />
                                  <span className="text-xs font-mono text-foreground font-bold min-w-10 text-right">{((file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) * 100).toFixed(0)}%</span>
                                  <Info className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                              </MetricTooltip>
                            ))}
                          </div>
                        </div>

                        {/* TECHNICAL DEBT METRICS */}
                        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                          <p className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">⚙️ Technical Debt</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "TDS", formula: "C + N + D + S + M", desc: "Combined structural components" },
                              { key: "C", formula: "0.30 if CC>15", desc: "Cyclomatic complexity" },
                              { key: "N", formula: "0.30 if depth>4", desc: "Control flow nesting" },
                              { key: "D", formula: "0.15 if dups>2", desc: "Repeated code blocks" },
                              { key: "S", formula: "0.25 if LOC>300", desc: "File line count" },
                              { key: "M", formula: "0.10 if funcs>20", desc: "Function count indicator" },
                              { key: "CP", formula: "mods / commits", desc: "Modification frequency" },
                              { key: "TC", formula: "freq × complexity", desc: "Change rate × complexity" },
                              { key: "DPS", formula: "0.6·TDS + 0.4·AI", desc: "Debt spread to dependents" },
                              { key: "DLI", formula: "0.5·TDS + 0.5·CCD", desc: "Debt persistence duration" },
                              { key: "DRF", formula: "0.4·AES + 0.3·TDS", desc: "Dependent risk level" }
                            ].map(m => (
                              <MetricTooltip key={m.key} metricKey={m.key} customFormula={m.formula} customDesc={m.desc}>
                                <div className="flex items-center justify-between gap-2 hover:bg-accent/5 p-1.5 rounded cursor-help transition-colors">
                                  <span className="font-mono text-xs font-semibold text-accent min-w-10">{m.key}</span>
                                  <ScoreBar value={(file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) as number} color="from-accent" className="flex-1" showLabel={false} />
                                  <span className="text-xs font-mono text-foreground font-bold min-w-8 text-right">{((file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) * 100).toFixed(0)}%</span>
                                  <Info className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                              </MetricTooltip>
                            ))}
                          </div>
                        </div>

                        {/* COGNITIVE DEBT METRICS */}
                        <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-3">
                          <p className="text-xs font-bold text-neon-purple mb-2 uppercase tracking-wider">🧠 Cognitive Debt</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "CDS", formula: "0.25·CCD + 0.20·(1-ES)...", desc: "Combined cognitive components" },
                              { key: "CCD", formula: "control_keywords / lines", desc: "Control flow density" },
                              { key: "ES", formula: "semantic_alignment + intent_clarity", desc: "How well names match actual behavior" },
                              { key: "AES", formula: "σ(line_lengths) / 40", desc: "Structural variation" },
                              { key: "RDI", formula: "comment % impact", desc: "Comment balance ratio" },
                              { key: "CU", formula: "1 - obvious / total", desc: "Useful vs restating" },
                              { key: "FR", formula: "length + nesting + name", desc: "Function quality score" },
                              { key: "CEB", formula: "0.25·IRD + 0.20·CFSC...", desc: "Mental simulation effort" },
                              { key: "CLI", formula: "depth + branches + len", desc: "Developer workload" },
                              { key: "IAS", formula: "mismatch + ambiguity penalty", desc: "Misleading or vague identifier risk" },
                              { key: "RI", formula: "line_len + nesting + name", desc: "Overall readability" },
                              { key: "CSC", formula: "deps + cross_refs", desc: "File navigation burden" }
                            ].map(m => (
                              <MetricTooltip key={m.key} metricKey={m.key} customFormula={m.formula} customDesc={m.desc}>
                                <div className="flex items-center justify-between gap-2 hover:bg-neon-purple/5 p-1.5 rounded cursor-help transition-colors">
                                  <span className="font-mono text-xs font-semibold text-neon-purple min-w-10">{m.key}</span>
                                  <ScoreBar value={(file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) as number} color="from-neon-purple" className="flex-1" showLabel={false} />
                                  <span className="text-xs font-mono text-foreground font-bold min-w-8 text-right">{((file.metrics[m.key.toLowerCase() as keyof typeof file.metrics] ?? 0) * 100).toFixed(0)}%</span>
                                  <Info className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity shrink-0" />
                                </div>
                              </MetricTooltip>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Issues detected:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {file.issues.map((issue) => (
                            <span key={issue} className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                        <span>LOC: <strong className="text-foreground">{file.linesOfCode}</strong></span>
                        <span>Funcs: <strong className="text-foreground">{file.functions}</strong></span>
                        <span>Complexity: <strong className="text-foreground">{file.cyclomaticComplexity}</strong></span>
                        <span>Depth: <strong className="text-foreground">{file.nestingDepth}</strong></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
