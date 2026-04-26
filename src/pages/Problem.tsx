import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, Brain, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const problems = [
  {
    icon: AlertTriangle,
    title: "Silent Accumulation",
    desc: "AI-generated code introduces subtle patterns that traditional tools miss — generic naming, unnecessary abstractions, and logic inconsistencies that compound over time.",
  },
  {
    icon: TrendingUp,
    title: "Exponential Propagation",
    desc: "Once AI-generated patterns enter a codebase, they get copy-pasted, imported, and adapted — spreading debt faster than human-written patterns ever could.",
  },
  {
    icon: Brain,
    title: "Cognitive Overload",
    desc: "AI code often looks correct but is hard to understand. Developers spend 60%+ of time reading code, and AI-generated patterns increase that cognitive burden significantly.",
  },
  {
    icon: Layers,
    title: "Invisible Dependencies",
    desc: "AI doesn't understand your system architecture. It creates implicit dependencies and tightly coupled modules that make future changes risky and expensive.",
  },
];

export default function Problem() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">The Problem</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            AI coding assistants are generating billions of lines of code. But nobody is tracking the debt they leave behind.
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {problems.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="rounded-lg bg-destructive/10 p-2.5 w-fit mb-4">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
