import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, ChevronRight, CheckCircle, Code, AlertTriangle,
  Clock, Zap, ArrowRight, ChevronDown, Layers, TrendingDown
} from "lucide-react";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  files: FileAnalysis[];
}

interface Recommendation {
  file: string;
  priority: "critical" | "high" | "medium";
  steps: Step[];
  impact: string;
  impactPct: number;
  issues: string[];
  estimatedEffort: string;
  debtReduction: { technical: number; cognitive: number };
}

interface Step {
  text: string;
  category: "complexity" | "structure" | "naming" | "safety" | "readability";
}

const categoryConfig = {
  complexity: { icon: Layers, label: "Complexity", color: "text-destructive" },
  structure: { icon: Code, label: "Structure", color: "text-accent" },
  naming: { icon: Zap, label: "Naming", color: "text-primary" },
  safety: { icon: AlertTriangle, label: "Safety", color: "text-destructive" },
  readability: { icon: TrendingDown, label: "Readability", color: "text-primary" },
};

function categorize(step: string): Step["category"] {
  if (/complex|nesting|branch|depth|cyclomatic/i.test(step)) return "complexity";
  if (/split|module|extract|duplicate|consolidate|shared|separate|SRP/i.test(step)) return "structure";
  if (/rename|naming|generic|identifier|variable name/i.test(step)) return "naming";
  if (/error|try|catch|test|validation|null|undefined/i.test(step)) return "safety";
  return "readability";
}

function estimateEffort(steps: Step[], loc: number): string {
  const base = steps.length * 15;
  const locFactor = loc > 500 ? 1.5 : loc > 200 ? 1.2 : 1;
  const mins = Math.round(base * locFactor);
  if (mins < 60) return `~${mins} min`;
  const hrs = (mins / 60).toFixed(1);
  return `~${hrs} hrs`;
}

// Comprehensive rule-based recommendation engine — no API dependency
function generateRecommendations(files: FileAnalysis[]): Recommendation[] {
  const sorted = [...files].sort(
    (a, b) => (b.technicalDebt + b.cognitiveDebt + b.aiLikelihood) - (a.technicalDebt + a.cognitiveDebt + a.aiLikelihood)
  );

  const totalTechDebt = files.reduce((s, x) => s + x.technicalDebt, 0);
  const totalCogDebt = files.reduce((s, x) => s + x.cognitiveDebt, 0);
  const totalDebtAll = files.reduce((s, x) => s + x.technicalDebt + x.cognitiveDebt, 0);

  return sorted.slice(0, 8).map(f => {
    const rawSteps: string[] = [];

    // --- Technical Debt Rules ---
    if (f.cyclomaticComplexity > 15) {
      rawSteps.push(`Break down complex logic (CC=${f.cyclomaticComplexity}, threshold: 15) — extract conditional branches into named helper functions with clear responsibilities`);
    } else if (f.cyclomaticComplexity > 8) {
      rawSteps.push(`Simplify moderate complexity (CC=${f.cyclomaticComplexity}) — consider extracting complex boolean expressions into descriptive named variables`);
    }

    if (f.nestingDepth > 4) {
      rawSteps.push(`Critical nesting depth (${f.nestingDepth} levels) — apply guard clauses, early returns, and extract deeply nested blocks into separate functions`);
    } else if (f.nestingDepth > 3) {
      rawSteps.push(`Reduce nesting depth from ${f.nestingDepth} to ≤3 — use early returns and function extraction to flatten control flow`);
    }

    if (f.linesOfCode > 300) {
      rawSteps.push(`Split large file (${f.linesOfCode} LOC, threshold: 300) — separate concerns into focused modules of <150 LOC each following Single Responsibility Principle`);
    } else if (f.linesOfCode > 200) {
      rawSteps.push(`Consider splitting file (${f.linesOfCode} LOC) — identify logical groupings that could become separate modules`);
    }

    // Duplication
    if (f.issues.includes("duplicate code blocks") || f.issues.includes("duplicate code")) {
      rawSteps.push("Extract duplicate code blocks into shared utility functions — identify common patterns and create a single source of truth");
    }
    if (f.issues.includes("similar function structures")) {
      rawSteps.push("Consolidate similar functions using parameterized factory patterns or generics — reduce structural repetition");
    }
    if (f.issues.includes("repeated logic across files")) {
      rawSteps.push("Create shared module for cross-file repeated logic — establish single source of truth to prevent divergent fixes");
    }

    // Naming
    if (f.issues.includes("overly generic naming") || f.issues.includes("inconsistent naming conventions")) {
      rawSteps.push("Rename variables: replace generic names (data, temp, result, item, val) with domain-specific descriptive identifiers that convey intent");
    }
    if (f.metrics.ias > 0.5) {
      rawSteps.push(`High identifier ambiguity (IAS=${(f.metrics.ias * 100).toFixed(0)}%) — audit all variable names, ensure each name describes its purpose and scope`);
    }

    // Safety
    if (f.issues.includes("missing error handling")) {
      rawSteps.push("Add try/catch blocks around async operations — use specific error types, provide user-friendly messages, and log errors for debugging");
    }
    if (f.issues.includes("magic numbers")) {
      rawSteps.push("Extract magic numbers into named constants with documentation explaining their purpose and derivation");
    }

    // Readability
    if (f.issues.includes("excessive comments") || f.issues.includes("over-explained comments")) {
      rawSteps.push("Remove redundant comments that restate code — focus on 'why' comments, let well-named functions self-document");
    }
    if (f.metrics.rdi > 0.6) {
      rawSteps.push(`Readability degradation detected (RDI=${(f.metrics.rdi * 100).toFixed(0)}%) — add whitespace between logical sections, use consistent formatting, improve visual hierarchy`);
    }
    if (f.metrics.ccd > 0.6) {
      rawSteps.push(`High cognitive complexity (CCD=${(f.metrics.ccd * 100).toFixed(0)}%) — simplify control flow, extract complex conditions into named boolean variables`);
    }

    // Structure
    if (f.issues.includes("unnecessary abstraction")) {
      rawSteps.push("Remove unnecessary wrapper functions — inline single-use abstractions that add indirection without value");
    }
    if (f.issues.includes("poor modularization") || f.issues.includes("missing modularization")) {
      rawSteps.push("Apply Single Responsibility Principle — each function/module should handle exactly one concern");
    }

    // Context switching
    if (f.metrics.csc > 0.6) {
      rawSteps.push(`High context switching cost (CSC=${(f.metrics.csc * 100).toFixed(0)}%) — reduce cross-file dependencies, co-locate related logic, use dependency injection`);
    }

    // Abstraction gap
    if (f.metrics.ags > 0.6) {
      rawSteps.push(`Abstraction gap detected (AGS=${(f.metrics.ags * 100).toFixed(0)}%) — simplify over-engineered solutions, match implementation complexity to problem complexity`);
    }

    // AI-specific
    if (f.aiLikelihood > 0.7) {
      rawSteps.push("AI-generated code detected — review for hidden assumptions, validate edge cases, add integration tests, and verify error handling completeness");
    }

    // Ensure minimum steps
    if (rawSteps.length < 2) {
      rawSteps.push("Add unit tests to cover critical paths before refactoring");
      rawSteps.push("Review and update function signatures for clarity and type safety");
    }

    const steps: Step[] = rawSteps.map(text => ({ text, category: categorize(text) }));
    const totalDebt = f.technicalDebt + f.cognitiveDebt;
    const priority = totalDebt > 1.2 ? "critical" : totalDebt > 0.7 ? "high" : "medium";
    const impactPct = Math.round((totalDebt) / totalDebtAll * 100);

    return {
      file: f.file,
      priority,
      steps,
      impact: `Fixing this file reduces total system debt by ~${impactPct}%`,
      impactPct,
      issues: f.issues,
      estimatedEffort: estimateEffort(steps, f.linesOfCode),
      debtReduction: {
        technical: Math.round((f.technicalDebt / totalTechDebt) * 100),
        cognitive: Math.round((f.cognitiveDebt / totalCogDebt) * 100),
      },
    };
  });
}

const priorityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", label: "CRITICAL", dot: "bg-destructive" },
  high: { color: "text-accent", bg: "bg-accent/5", border: "border-accent/20", label: "HIGH", dot: "bg-accent" },
  medium: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", label: "MEDIUM", dot: "bg-primary" },
};

export default function RefactorRecommendations({ files }: Props) {
  const recommendations = generateRecommendations(files);
  const [expanded, setExpanded] = useState<string | null>(recommendations[0]?.file ?? null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (key: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalSteps = recommendations.reduce((s, r) => s + r.steps.length, 0);
  const doneSteps = recommendations.reduce((s, r) => s + r.steps.filter((_, j) => completedSteps.has(`${r.file}-${j}`)).length, 0);
  const overallProgress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const totalImpact = recommendations.reduce((s, r) => {
    const done = r.steps.filter((_, j) => completedSteps.has(`${r.file}-${j}`)).length;
    return s + (done === r.steps.length ? r.impactPct : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Refactor Fix Plan</h3>
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">Rule-based engine</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {recommendations.reduce((s, r) => {
                const m = r.estimatedEffort.match(/[\d.]+/);
                return s + (m ? parseFloat(m[0]) * (r.estimatedEffort.includes("hrs") ? 60 : 1) : 0);
              }, 0).toFixed(0)} min total effort
            </span>
            <span>{recommendations.length} files</span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-mono text-foreground">{doneSteps}/{totalSteps}</span>
        </div>
        {totalImpact > 0 && (
          <p className="mt-2 text-[11px] text-primary">
            ✓ Completed files would reduce total debt by ~{totalImpact}%
          </p>
        )}
      </div>

      {/* Priority Lane Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["critical", "high", "medium"] as const).map(p => {
          const count = recommendations.filter(r => r.priority === p).length;
          const config = priorityConfig[p];
          return (
            <motion.div
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border ${config.border} ${config.bg} p-3 flex items-center gap-3`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
              <div>
                <span className={`text-[10px] font-bold uppercase ${config.color}`}>{config.label}</span>
                <p className="text-xs text-muted-foreground">{count} file{count !== 1 ? "s" : ""}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* File Recommendations */}
      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority];
          const isOpen = expanded === rec.file;
          const fileStepsDone = rec.steps.filter((_, j) => completedSteps.has(`${rec.file}-${j}`)).length;
          const fileProgress = Math.round((fileStepsDone / rec.steps.length) * 100);
          const allDone = fileStepsDone === rec.steps.length;

          return (
            <motion.div
              key={rec.file}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border ${allDone ? "border-primary/30 bg-primary/5" : `${config.border} bg-card/80`} backdrop-blur-sm overflow-hidden transition-colors`}
            >
              {/* File Header */}
              <button
                onClick={() => setExpanded(isOpen ? null : rec.file)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${allDone ? "bg-primary" : config.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${config.color} ${config.bg} border ${config.border}`}>
                      {allDone ? "DONE" : config.label}
                    </span>
                    <Code className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-foreground truncate">{rec.file}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{rec.estimatedEffort}</span>
                    <span>{fileStepsDone}/{rec.steps.length} steps</span>
                    <span className="flex items-center gap-1"><TrendingDown className="h-2.5 w-2.5" />-{rec.impactPct}% debt</span>
                  </div>
                </div>

                {/* Mini progress */}
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fileProgress}%` }} />
                </div>

                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Expanded Steps */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Issues */}
                      <div className="flex flex-wrap gap-1.5">
                        {rec.issues.slice(0, 6).map(iss => (
                          <span key={iss} className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] text-destructive">
                            {iss}
                          </span>
                        ))}
                      </div>

                      {/* Steps as interactive checklist */}
                      <div className="space-y-2 ml-1">
                        {rec.steps.map((step, j) => {
                          const key = `${rec.file}-${j}`;
                          const done = completedSteps.has(key);
                          const cat = categoryConfig[step.category];
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={j}
                              onClick={() => toggleStep(key)}
                              className={`flex items-start gap-2.5 w-full text-left rounded-lg px-3 py-2 transition-all ${
                                done ? "bg-primary/5 opacity-60" : "hover:bg-secondary/30"
                              }`}
                            >
                              <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                done ? "bg-primary border-primary" : "border-border"
                              }`}>
                                {done && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {step.text}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <CatIcon className={`h-2.5 w-2.5 ${cat.color}`} />
                                  <span className={`text-[9px] ${cat.color}`}>{cat.label}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Impact footer */}
                      <div className="rounded-lg bg-secondary/20 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span className="text-[10px] text-primary font-medium">{rec.impact}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>Tech: <strong className="text-foreground">-{rec.debtReduction.technical}%</strong></span>
                          <span>Cog: <strong className="text-foreground">-{rec.debtReduction.cognitive}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
