import { motion } from "framer-motion";
import { Code, Brain, GitFork, BarChart3, Zap, Shield, Search, Layers, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  { icon: Code, title: "AI Code Detection", desc: "Heuristic engine detects overly generic names, repetitive structures, unusual verbosity, inconsistent conventions, and excessive obvious comments. Outputs AI Likelihood Score (0–1) per file.", category: "Detection" },
  { icon: Layers, title: "Technical Debt Analysis", desc: "Detects duplication, high cyclomatic complexity, deep nesting, poor modularization, and unused logic. Separates AI-induced debt from general debt.", category: "Analysis" },
  { icon: Brain, title: "Cognitive Debt Scoring", desc: "Four proprietary metrics: Cognitive Complexity Drift (CCD), Explainability Score (ES), AI Entropy Score (AES), and Readability Degradation Index (RDI).", category: "Core" },
  { icon: GitFork, title: "Propagation Tracking", desc: "Maps how AI-induced debt spreads via code clones, reused patterns, repeated commits, and dependency chains. Traces back to root cause.", category: "Tracking" },
  { icon: Activity, title: "Interactive Graph", desc: "Force-directed propagation graph with nodes as files/functions and edges as debt paths. Color-coded by risk level.", category: "Visualization" },
  { icon: BarChart3, title: "Metrics Dashboard", desc: "Unified view of DPS, DLI, DRF, CCD, ES, AES, RDI, AI Likelihood, and AI Debt Contribution % across all files.", category: "Dashboard" },
  { icon: Zap, title: "Insights Engine", desc: "Identifies highest debt files, most propagated sources, cognitive burden hotspots, and generates 'refactor this first' recommendations.", category: "Intelligence" },
  { icon: Search, title: "File Drill-Down", desc: "Search, filter, and sort files by any metric. Expand any file for full analysis breakdown with all scores and detected issues.", category: "Exploration" },
  { icon: Shield, title: "Tool Integration", desc: "Built on GitHub API, PMD, SonarQube, and Tree-sitter. Combines tool-based metrics with AI-detection heuristics into unified scoring.", category: "Integration" },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Features</h1>
          <p className="mt-4 text-muted-foreground">Every capability designed specifically for AI-induced debt detection</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-primary/10 p-2"><f.icon className="h-4 w-4 text-primary" /></div>
                <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{f.category}</span>
              </div>
              <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
