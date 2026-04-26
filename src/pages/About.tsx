import { motion } from "framer-motion";
import { Brain, Users, Target, Rocket, ChevronDown, Bug, TrendingUp, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

const mission = [
  { icon: Target, title: "Mission", desc: "Make the hidden cost of AI-generated code visible, measurable, and actionable for every engineering team." },
  { icon: Brain, title: "Approach", desc: "Combine structural debt analysis, cognitive-debt scoring, and stricter AI-pattern heuristics to flag suspicious code paths with explainable signals." },
  { icon: Users, title: "For Teams", desc: "Built for teams using AI-assisted development who need file-level debt breakdowns, propagation visibility, and refactor guidance." },
  { icon: Rocket, title: "Vision", desc: "A workflow where AI-assisted coding stays fast, but quality, maintainability, and accountability stay measurable." },
];

const faqs = [
  { q: "What is the current project status?", a: "The current build supports public GitHub repository analysis, single-file upload and paste analysis, file-level technical and cognitive debt breakdowns, propagation graphs, commit timeline analysis for GitHub repositories, human-cognitive comparison views, and downloadable reports." },
  { q: "How strict is the AI detection now?", a: "The current detector is intentionally stricter than the earlier prototype. It weights structural uniformity, repeated logic, token skew, generic naming, redundant comments, low entropy, and suspiciously uniform style more aggressively, while still reducing scores when human-like signals are present." },
  { q: "Which AI metrics are shown in the product?", a: "The main AI detection layer currently exposes SUS, TDD, PRI, CRS, and SCS. These are shown in the dashboard and file analysis views, alongside derived debt metrics that use AI likelihood." },
  { q: "What does the project analyze today?", a: "Today the project analyzes AI likelihood, technical debt, cognitive debt, debt propagation, commit-based debt trends, refactor priority, and developer cognitive simulation signals across supported inputs." },
  { q: "Can I use this on private repositories?", a: "Not in the current public flow. The live experience focuses on public GitHub repositories plus pasted or uploaded code. Private repository support would require authenticated repository access and backend changes." },
  { q: "What languages are practical right now?", a: "Any text-based code file can pass through the heuristic pipeline, but the current experience is strongest on JavaScript, TypeScript, Python, Java, and similar repository structures where imports, duplication, and control flow can be interpreted reliably." },
  { q: "What is cognitive debt in this project?", a: "Here, cognitive debt means the extra mental work needed to read, simulate, and safely modify code. The project currently models that using metrics like CCD, ES, AES, RDI, CU, FR, CLI, IAS, RI, and CEB." },
];

const team = [
  { name: "Aditya Puvanthala Rajesh", role: "IIT Tirupati | cs24b003@iittp.ac.in", initials: "AP" },
  { name: "Nandini Goud", role: "IIT Tirupati | cs24b008@iittp.ac.in", initials: "NG" },
  { name: "Rudresh Prasad", role: "IIT Tirupati | cs24b034@iittp.ac.in", initials: "RP" },
  { name: "Vottikalla Santhosh", role: "IIT Tirupati | cs24b050@iittp.ac.in", initials: "VS" },
  { name: "Maan Kamble", role: "IIT Tirupati | cs24b023@iittp.ac.in", initials: "MK" },
];

const technicalDebtMetrics = [
  {
    title: "Base Technical Debt Score (TDS)",
    formula: "TDS = C + N + D + S + M",
    desc: "Core structural debt metric combining Complexity (C), Nesting (N), Duplication (D), Size (S), and Modularization Penalty (M).",
    subMetrics: [
      { name: "Complexity (C)", formula: "C = 0.30 if CC>15, 0.18 if CC>8, 0 otherwise", desc: "Based on cyclomatic complexity. Measures independent execution paths." },
      { name: "Nesting Depth (N)", formula: "N = 0.30 if depth>4, 0.18 if depth>3, 0 otherwise", desc: "Deep nesting reduces readability and increases change risk." },
      { name: "Duplication (D)", formula: "D = 0.15 if duplicate blocks>2, 0 otherwise", desc: "Repeated logic blocks violating DRY principles." },
      { name: "Size (S)", formula: "S = 0.25 if LOC>300, 0.15 if LOC>200, 0 otherwise", desc: "Large files increase navigation difficulty and change risk." },
      { name: "Modularization (M)", formula: "M = 0.10 if functions>20, 0 otherwise", desc: "Too many functions can indicate poor cohesion and fragmented structure." },
    ],
  },
  {
    title: "Advanced Technical Metrics",
    formula: "Evolutionary + structural depth analysis",
    desc: "Beyond static analysis by tracking how code evolves and degrades over time.",
    subMetrics: [
      { name: "Change Proneness (CP)", formula: "CP = modifications / total_commits", desc: "How often a file changes. High CP suggests instability." },
      { name: "Code Churn (CCN)", formula: "CCN = lines_added + lines_deleted", desc: "Volume of change, a strong predictor of defects." },
      { name: "Temporal Complexity (TC)", formula: "TC = change_frequency x complexity", desc: "Complex and frequently changing files are more dangerous." },
      { name: "Defect Density Proxy (DDP)", formula: "DDP = issues_detected / LOC", desc: "Estimates bug concentration per line of code." },
      { name: "Modularity Degradation (MDS)", formula: "MDS = coupling / cohesion", desc: "High coupling with low cohesion signals architectural strain." },
    ],
  },
  {
    title: "Derived Technical Debt",
    formula: "Propagation-aware debt analysis",
    desc: "Measures not just local debt, but how it spreads and persists.",
    subMetrics: [
      { name: "Debt Propagation (DPS)", formula: "DPS = 0.6*TDS + 0.4*AI_likelihood", desc: "How strongly a file spreads debt to dependent files." },
      { name: "Debt Longevity (DLI)", formula: "DLI = 0.5*TDS + 0.5*CCD", desc: "Predicts how long debt will persist in the codebase." },
      { name: "Dependency Risk (DRF)", formula: "DRF = 0.4*AES + 0.3*TDS + 0.3*AI_likelihood", desc: "Risk of depending on this file." },
    ],
  },
];

const cognitiveDebtMetrics = [
  {
    title: "Base Cognitive Debt Score (CDS)",
    formula: "CDS = 0.25*CCD + 0.20*(1-ES) + 0.20*AES + 0.15*RDI + 0.10*CU + 0.10*FR",
    desc: "Measures how hard code is to understand by combining structure, naming, and documentation quality.",
    subMetrics: [
      { name: "Cognitive Complexity Drift (CCD)", formula: "CCD = control_flow_keywords / (total_lines * 0.12 + 1)", desc: "Density of control logic that makes code harder to mentally simulate." },
      { name: "Explainability Score (ES)", formula: "ES = avg_identifier_length / 12", desc: "How meaningful variable and function names are." },
      { name: "AI Entropy Score (AES)", formula: "AES = std_dev(line_lengths) / 40", desc: "Structural variation. Extremely uniform code is harder to scan." },
      { name: "Readability Degradation (RDI)", formula: "RDI = 0.8 if comments>30%, 0.3 if 5-30%, 0.55 if <5%", desc: "Balances over-commenting against missing guidance." },
      { name: "Comment Utility (CU)", formula: "CU = 1 - obvious_comments / total_comments", desc: "Measures whether comments add value or restate the code." },
      { name: "Function Readability (FR)", formula: "FR = normalized(length + nesting + naming_clarity)", desc: "Captures function size, structure, and naming quality." },
    ],
  },
  {
    title: "Advanced Cognitive Metrics",
    formula: "Deep cognitive complexity analysis",
    desc: "Models the developer's mental workload while reading and modifying code.",
    subMetrics: [
      { name: "Cognitive Load Index (CLI)", formula: "CLI = nesting + branching + function_length/50", desc: "Represents mental workload during comprehension." },
      { name: "Identifier Ambiguity (IAS)", formula: "IAS = unclear_names / total_variables", desc: "Higher IAS means more guessing and slower comprehension." },
      { name: "Abstraction Gap (AGS)", formula: "AGS = |intent_complexity - implementation_complexity|", desc: "Mismatch between what the code should do and how it is implemented." },
      { name: "Readability Index (RI)", formula: "RI = normalized(avg_line_length + nesting + naming)", desc: "Overall readability quality." },
      { name: "Context Switching Cost (CSC)", formula: "CSC = dependencies + cross_file_references", desc: "How often a developer must jump between files." },
    ],
  },
  {
    title: "Cognitive Execution Burden (CEB)",
    formula: "CEB = 0.25*IRD + 0.20*CFSC + 0.20*STL + 0.20*DRC + 0.15*AIC",
    desc: "Models how much mental effort is needed to simulate code execution in your head.",
    subMetrics: [
      { name: "Intent Recognition (IRD)", formula: "IRD = 1 - intent_transparency", desc: "Effort required to infer what the code is doing." },
      { name: "Control Flow Simulation (CFSC)", formula: "CFSC = branches * nesting / LOC", desc: "Mental effort to trace execution paths." },
      { name: "State Tracking Load (STL)", formula: "STL = mutable_variables * reassignments", desc: "Burden of tracking variable state changes." },
      { name: "Dependency Resolution (DRC)", formula: "DRC = external_calls + cross_file_refs", desc: "Effort needed to resolve dependencies mentally." },
      { name: "Abstraction Interpretation (AIC)", formula: "AIC = abstraction_layers / complexity", desc: "Effort required to understand abstraction layers." },
    ],
  },
];

const dynamicDebtMetrics = [
  {
    title: "Debt Evolution Model",
    formula: "TDS(c) = TDS(c-1) * G + dC + dD + dN",
    desc: "Tracks how technical and cognitive debt evolve commit by commit.",
    subMetrics: [
      { name: "Growth Factor (G)", formula: "G = 1 + (net_growth * 0.3)", desc: "Rapid code growth amplifies debt while refactoring stabilizes it." },
      { name: "Cognitive Evolution", formula: "CDS(c) = CDS(c-1) * G + dR + dNa + dE", desc: "Tracks readability, naming clarity, and entropy changes over time." },
    ],
  },
  {
    title: "Temporal Behavior Metrics",
    formula: "Dynamic debt analysis layer",
    desc: "Treats debt as a time-evolving signal rather than a static snapshot.",
    subMetrics: [
      { name: "Debt Velocity (DV)", formula: "DV = (TDS(c) - TDS(c-1)) / dt", desc: "Speed at which debt is increasing." },
      { name: "Debt Acceleration (DA)", formula: "DA = DV(c) - DV(c-1)", desc: "Detects worsening trends." },
      { name: "Spike Detection", formula: "Spike = TDS(c) - TDS(c-1) > 0.08", desc: "Detects bad commits, AI dump code, and poor merges." },
      { name: "Debt Momentum", formula: "Momentum = avg(DV last 5 commits)", desc: "Summarizes recent debt trend strength." },
      { name: "Cognitive-Temporal Interaction (CTI)", formula: "CTI = CDS * change_frequency", desc: "Hard-to-understand and frequently modified files are extremely risky." },
    ],
  },
  {
    title: "Predictive and Developer Analysis",
    formula: "Future projection and attribution",
    desc: "Predicts future system health and attributes debt to individual developers.",
    subMetrics: [
      { name: "Future Prediction", formula: "Future_TDS = current_TDS + avg_slope * future_commits", desc: "Linear extrapolation of debt trajectory." },
      { name: "Developer Impact", formula: "Impact(dev) = sum(dTDS + dCDS)", desc: "Measures how each developer affects total system debt." },
      { name: "Debt Introduction (DI)", formula: "DI(c) = max(0, TDS(c) - TDS(c-1))", desc: "New debt introduced in a commit." },
      { name: "Debt Reduction (DR)", formula: "DR(c) = max(0, TDS(c-1) - TDS(c))", desc: "Debt removed by refactoring." },
      { name: "AI Debt Amplification (ADAF)", formula: "ADAF_t = descendant_debt(t) / AI_origin_debt", desc: "How AI-originated code impacts future commits." },
      { name: "Trend Classification", formula: "up slope>0.15, down slope<-0.10, warn >3 spikes, flat otherwise", desc: "Categorizes overall debt trajectory." },
    ],
  },
];

const aiDetectionMetrics = [
  {
    key: "SUS",
    title: "Structural Uniformity Score",
    formula: "SUS = 1 - variance(function_structures)",
    desc: "Flags code where functions follow suspiciously similar shapes, a common AI-generated pattern when many blocks are produced from the same template.",
  },
  {
    key: "PRI",
    title: "Pattern Repetition Index",
    formula: "PRI = repeated_patterns / total_patterns",
    desc: "Measures repeated logic and near-clone blocks. In strict mode this now contributes more heavily to the AI likelihood score.",
  },
  {
    key: "TDD",
    title: "Token Distribution Divergence",
    formula: "TDD = top_token_mass / total_tokens",
    desc: "Captures unnatural token concentration and repetitive vocabulary, which often appears in overly generic generated code.",
  },
  {
    key: "CRS",
    title: "Comment Redundancy Score",
    formula: "CRS = obvious_comments / total_comments",
    desc: "Penalizes comments that simply restate the code instead of adding intent, rationale, or constraints.",
  },
  {
    key: "SCS",
    title: "Style Consistency Score",
    formula: "SCS = 1 - variance(style_features)",
    desc: "Highlights suspiciously uniform formatting and line-shape regularity, especially when paired with low entropy and repeated patterns.",
  },
];

function MetricSection({ title, icon: Icon, metrics, color, indexOffset }: {
  title: string;
  icon: React.ElementType;
  metrics: typeof technicalDebtMetrics;
  color: string;
  indexOffset: number;
}) {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </motion.div>
      <div className="space-y-3">
        {metrics.map((metric, i) => {
          const key = indexOffset + i;
          const isOpen = openItem === key;
          return (
            <motion.div key={metric.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card/70 backdrop-blur-sm overflow-hidden">
              <button onClick={() => setOpenItem(isOpen ? null : key)} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{metric.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{metric.desc}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-3">
                      <div className="rounded-lg bg-secondary/30 px-3 py-2 font-mono text-[11px] text-foreground overflow-x-auto">{metric.formula}</div>
                      <div className="space-y-2">
                        {metric.subMetrics.map(sub => (
                          <div key={sub.name} className="rounded-lg border border-border/50 bg-background/50 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">{sub.name}</span>
                            </div>
                            <div className="rounded bg-muted/30 px-2 py-1 font-mono text-[10px] text-muted-foreground mb-1.5">{sub.formula}</div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{sub.desc}</p>
                          </div>
                        ))}
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

export default function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10 container pt-24 pb-16 space-y-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black text-foreground sm:text-4xl">About <span className="text-gradient-cyber">AIDebt</span></h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe AI is transforming software development, and this project is focused on making the debt signals behind that speed visible, explainable, and actionable.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
          {mission.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 transition-all hover:border-primary/30"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4"><item.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-foreground leading-relaxed italic">
            "The current project combines technical debt, cognitive debt, stricter AI detection, propagation analysis, and commit-based evolution so that teams can see not just risky code, but how that risk spreads, persists, and affects human comprehension."
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6">
            <div className="rounded-lg p-2.5 bg-primary/10 text-primary"><Cpu className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Strict AI Detection Metrics</h2>
              <p className="text-sm text-muted-foreground">A smaller, stricter set of high-signal heuristics is emphasized in the current detector.</p>
            </div>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {aiDetectionMetrics.map((metric, i) => (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-primary/20 bg-card/70 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold text-primary">{metric.key}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">strict mode</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{metric.title}</h3>
                <div className="mt-3 rounded-lg bg-secondary/40 px-3 py-2 font-mono text-[11px] text-foreground">{metric.formula}</div>
                <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{metric.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <MetricSection title="Technical Debt Metrics" icon={Bug} metrics={technicalDebtMetrics} color="bg-accent/10 text-accent" indexOffset={200} />
        <MetricSection title="Cognitive Debt Metrics" icon={Brain} metrics={cognitiveDebtMetrics} color="bg-neon-purple/10 text-neon-purple" indexOffset={300} />
        <MetricSection title="Dynamic Debt Model (Commit-Based)" icon={TrendingUp} metrics={dynamicDebtMetrics} color="bg-primary/10 text-primary" indexOffset={400} />

        <div className="max-w-3xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-foreground text-center mb-8">
            Debt Model Architecture
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Structural Layer", items: ["Complexity (C)", "Nesting (N)", "Duplication (D)", "Size (S)", "Modularization (M)"], color: "border-accent/20 bg-accent/5" },
              { title: "Evolutionary Layer", items: ["Change Proneness (CP)", "Code Churn (CCN)", "Temporal Complexity (TC)", "Debt Velocity (DV)", "Debt Acceleration (DA)"], color: "border-primary/20 bg-primary/5" },
              { title: "Propagation Layer", items: ["DPS - Debt Spread", "DLI - Debt Longevity", "DRF - Dependency Risk", "ADAF - AI Amplification", "CTI - Cognitive-Temporal"], color: "border-neon-purple/20 bg-neon-purple/5" },
            ].map((layer, i) => (
              <motion.div key={layer.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`rounded-xl border p-5 ${layer.color}`}>
                <p className="text-xs font-semibold text-foreground mb-3">{layer.title}</p>
                <ul className="space-y-1.5">
                  {layer.items.map(item => (
                    <li key={item} className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-foreground/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-foreground text-center mb-8">Team</motion.h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {team.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary text-sm">{t.initials}</div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</motion.h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border bg-card/70 backdrop-blur-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors">
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
