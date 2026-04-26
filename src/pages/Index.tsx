import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  GitFork,
  Radar,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import EnhancedCodeInput from "@/components/EnhancedCodeInput";
import HeroShowcase from "@/components/HeroShowcase";
import ReviewsSection from "@/components/ReviewsSection";

const features = [
  {
    icon: Brain,
    title: "Cognitive debt, not just code smells",
    desc: "Highlight the exact places where generated code becomes harder to reason about over time.",
  },
  {
    icon: GitFork,
    title: "Propagation-aware analysis",
    desc: "See how one AI-assisted shortcut starts influencing neighboring files, modules, and reviews.",
  },
  {
    icon: Radar,
    title: "Detection with context",
    desc: "Blend heuristics, structure patterns, and readability shifts instead of relying on one score.",
  },
  {
    icon: BarChart3,
    title: "Decision-ready visuals",
    desc: "Turn raw metrics into ranked action so teams know what to fix first and why.",
  },
];

const metrics = [
  { value: "85%", label: "Detection accuracy", note: "Benchmarked across mixed codebases" },
  { value: "7+", label: "Debt dimensions", note: "From propagation to readability drift" },
  { value: "<30s", label: "Analysis window", note: "Designed for fast triage in review loops" },
];

const workflow = [
  "Scan the repository and isolate signals that feel statistically over-regular, repetitive, or cognitively expensive.",
  "Map those signals into technical debt, cognitive debt, and propagation risk so the problem is visible, not abstract.",
  "Prioritize refactors with a fix order that helps teams reduce debt without reworking healthy code.",
];

export default function Home() {
  const navigate = useNavigate();

  const handleQuickAnalyze = (input: { type: "github" | "upload" | "paste"; data: string; fileName?: string }) => {
    // For GitHub URLs, add to query param; for others, we'll need to pass via state
    if (input.type === "github") {
      navigate(`/dashboard?repo=${encodeURIComponent(input.data)}`);
    } else {
      // For upload/paste, navigate to dashboard with the input in state
      navigate("/dashboard", { state: { input } });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
          <div className="container">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:gap-20">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Debt Lens
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.08 }}
                  className="mt-7 max-w-4xl"
                >
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-muted-foreground">
                    Editorial diagnostics for modern engineering teams
                  </p>
                  <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
                    Make AI-assisted code feel
                    <span className="block text-gradient-cyber">intentional, maintainable, and visible.</span>
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    Detect the hidden operational cost of AI-generated code with a product language that feels closer to a design-led control room than a template dashboard.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.16 }}
                  className="mt-12 max-w-2xl rounded-[28px] p-6 surface-panel glow-panel"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Start analyzing</p>
                      <p className="mt-2 text-sm text-foreground">Paste a GitHub URL, upload files, or paste code directly.</p>
                    </div>
                    <div className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:block">
                      Live analysis
                    </div>
                  </div>
                  <div className="mt-5">
                    <EnhancedCodeInput onAnalyze={handleQuickAnalyze} loading={false} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.22 }}
                  className="mt-7 flex flex-wrap items-center gap-3"
                >
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:translate-y-[-1px] hover:opacity-95 glow-cyan"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/80 surface-soft"
                  >
                    Explore the method
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:pt-16"
              >
                {metrics.map((metric, index) => (
                  <div key={metric.label} className="rounded-[24px] p-6 surface-panel glow-panel">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Metric {index + 1}</p>
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-4 text-4xl font-black text-foreground">{metric.value}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{metric.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{metric.note}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <HeroShowcase />
          </div>
        </section>

        <section className="section-divider relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="container">
            <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start xl:gap-20">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Why it stands out</p>
                <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl">
                  The interface moves like an instrument panel, not a generated landing page.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Instead of stacked marketing cards, the experience leans into tension, contrast, and stateful animation so the product feels crafted around engineering workflows.
                </p>

                <div className="mt-10 space-y-4">
                  {workflow.map((step, index) => (
                    <div key={step} className="flex gap-4 rounded-2xl p-5 surface-soft">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        0{index + 1}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid gap-5 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -5 }}
                    className="rounded-[24px] p-6 surface-panel glow-panel"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection />

        <section className="section-divider relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,hsl(var(--background)/0.9),hsl(var(--primary)/0.1),hsl(var(--neon-purple)/0.1))] p-8 glow-panel sm:p-10"
            >
              <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-muted-foreground surface-chip">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Built for review quality
                  </div>
                  <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl">
                    Audit your next repository with visuals that match the seriousness of the problem.
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                    The dashboard surfaces debt hotspots, propagation paths, and refactor priority in one pass so teams can move from suspicion to action quickly.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:translate-y-[-1px] hover:opacity-95"
                  >
                    Launch Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/80 surface-soft"
                  >
                    Read the rationale
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
