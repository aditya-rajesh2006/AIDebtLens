import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { title: "Paste a GitHub URL", desc: "Point us to any public repository" },
  { title: "AI Pattern Detection", desc: "Our heuristics scan every file for AI-generated code signatures" },
  { title: "Multi-Tool Analysis", desc: "PMD, SonarQube, and Tree-sitter extract structural metrics" },
  { title: "Debt Scoring", desc: "Technical + cognitive debt scores calculated per file" },
  { title: "Propagation Mapping", desc: "Trace how AI-induced debt spreads across the system" },
  { title: "Actionable Insights", desc: "Get prioritized refactoring recommendations" },
];

export default function Solution() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">The Solution</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            A purpose-built analysis pipeline that combines static analysis tools with AI-specific heuristics.
          </p>
        </motion.div>

        <div className="mx-auto max-w-xl space-y-4">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground glow-cyan">
            Try It Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
