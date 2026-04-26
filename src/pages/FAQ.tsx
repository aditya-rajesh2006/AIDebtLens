import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqs = [
  { q: "What is the current project status?", a: "The current build supports public GitHub repository analysis, single-file upload and paste analysis, file-level technical and cognitive debt breakdowns, propagation graphs, commit timeline analysis for GitHub repositories, human-cognitive comparison views, and downloadable reports." },
  { q: "How strict is the AI detection now?", a: "The current detector is intentionally stricter than the earlier prototype. It weights structural uniformity, repeated logic, token skew, generic naming, redundant comments, low entropy, and suspiciously uniform style more aggressively, while still reducing scores when human-like signals are present." },
  { q: "Which AI metrics are shown in the product?", a: "The main AI detection layer currently exposes SUS, TDD, PRI, CRS, and SCS. These are shown in the dashboard and file analysis views, alongside derived debt metrics that use AI likelihood." },
  { q: "What does the project analyze today?", a: "Today the project analyzes AI likelihood, technical debt, cognitive debt, debt propagation, commit-based debt trends, refactor priority, and developer cognitive simulation signals across supported inputs." },
  { q: "Can I use this on private repositories?", a: "Not in the current public flow. The live experience focuses on public GitHub repositories plus pasted or uploaded code. Private repository support would require authenticated repository access and backend changes." },
  { q: "What languages are practical right now?", a: "Any text-based code file can pass through the heuristic pipeline, but the current experience is strongest on JavaScript, TypeScript, Python, Java, and similar repository structures where imports, duplication, and control flow can be interpreted reliably." },
  { q: "What is cognitive debt in this project?", a: "Here, cognitive debt means the extra mental work needed to read, simulate, and safely modify code. The project currently models that using metrics like CCD, ES, AES, RDI, CU, FR, CLI, IAS, RI, and CEB." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">FAQ</h1>
          <p className="mt-4 text-muted-foreground">Current questions and answers about the project status, AI detection, and debt analysis features.</p>
        </motion.div>

        <div className="mx-auto max-w-2xl space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
              >
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
