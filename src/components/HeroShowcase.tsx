import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, BrainCircuit, Sparkles } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";
import heroGraph from "@/assets/hero-graph.png";
import heroAiDetect from "@/assets/hero-ai-detect.png";

const slides = [
  {
    src: heroDashboard,
    alt: "AI debt dashboard with layered metrics",
    label: "Signal Room",
    eyebrow: "Repository command center",
    stat: "23 files flagged",
    accent: "from-primary/35 via-primary/10 to-transparent",
  },
  {
    src: heroGraph,
    alt: "Propagation graph for technical debt spread",
    label: "Spread Map",
    eyebrow: "Propagation pathways",
    stat: "6 critical clusters",
    accent: "from-[hsl(270_72%_62%_/_0.32)] via-transparent to-transparent",
  },
  {
    src: heroAiDetect,
    alt: "AI generated code detection interface",
    label: "Pattern Scan",
    eyebrow: "Human vs model fingerprint",
    stat: "85% confidence",
    accent: "from-[hsl(36_95%_58%_/_0.3)] via-transparent to-transparent",
  },
];

export default function HeroShowcase() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto mt-20 max-w-6xl">
      <div className="absolute inset-x-16 top-10 h-64 rounded-full bg-primary/12 blur-[120px]" />
      <div className="absolute right-8 top-24 h-48 w-48 rounded-full bg-[hsl(270_72%_62%_/_0.16)] blur-[110px]" />

      <div className="grid gap-8 lg:grid-cols-[1.12fr_0.52fr] xl:gap-10">
        <div className="relative overflow-hidden rounded-[28px] bg-noise-overlay surface-panel glow-panel">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--foreground)/0.08),transparent_28%,transparent_70%,hsl(var(--primary)/0.12))]" />

          <div className="flex items-center justify-between border-b border-border/70 bg-background/50 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--neon-green))]/70" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Live Workspace</p>
                <p className="text-sm font-semibold text-foreground">AI DEBT LENS / session</p>
              </div>
            </div>

            <div className="hidden rounded-full px-3 py-1 text-[11px] text-muted-foreground surface-chip md:flex md:items-center md:gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Dynamic repo diagnostics
            </div>
          </div>

          <div className="grid gap-8 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:p-7">
            <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-border/70 bg-background/55 panel-sheen">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slides[current].label}
                  initial={{ opacity: 0, x: 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -48 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${slides[current].accent}`} />
                  <img
                    src={slides[current].src}
                    alt={slides[current].alt}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_45%,hsl(var(--background)/0.88)_100%)]" />
                  <div className="absolute left-4 top-4 rounded-full border border-border/70 bg-background/72 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-md">
                    {slides[current].eyebrow}
                  </div>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Panel View</p>
                      <h3 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl dark:text-white">{slides[current].label}</h3>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/72 px-4 py-3 text-right backdrop-blur-xl">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Current read</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{slides[current].stat}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              {slides.map((slide, index) => {
                const active = index === current;
                return (
                  <button
                    key={slide.label}
                    onClick={() => setCurrent(index)}
                    className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.14)]"
                        : "border-border/70 bg-background/45 hover:border-border hover:bg-background/65"
                    }`}
                  >
                    <motion.div
                      animate={{ x: active ? 0 : -18, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{slide.eyebrow}</p>
                        <h4 className="mt-2 text-sm font-semibold text-foreground">{slide.label}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{slide.stat}</p>
                      </div>
                      <ArrowUpRight className={`mt-1 h-4 w-4 transition-transform ${active ? "text-primary" : "text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
                    </div>
                  </button>
                );
              })}

              <div className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,hsl(var(--background)/0.88),hsl(var(--primary)/0.08))] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/12 p-2 text-primary">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Why it feels human</p>
                    <p className="text-sm font-medium text-foreground">Motion is tied to state changes, not decorative loops.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { title: "Signal strength", value: "0.85", detail: "Model-likeness score" },
            { title: "Debt cluster", value: "12", detail: "Interconnected hot spots" },
            { title: "Review window", value: "< 30m", detail: "Time to first action" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * index }}
              className="rounded-[24px] p-6 surface-panel glow-panel"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{item.title}</p>
              <p className="mt-4 text-3xl font-black text-foreground">{item.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
