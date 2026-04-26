import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sarah Chen",
    role: "Staff Engineer, Stripe",
    text: "This tool caught AI-generated patterns our linter completely missed. The cognitive debt metrics are a game changer for code review.",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Tech Lead, Shopify",
    text: "The propagation graph showed us exactly how one AI-written utility file spread complexity across 12 modules. Fixed it in a day.",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Priya Patel",
    role: "Senior Dev, Google",
    text: "Finally a tool that quantifies what we intuitively felt — AI code looks clean but is often harder to maintain. The DCS metric is brilliant.",
    rating: 5,
    avatar: "PP",
  },
  {
    name: "Alex Rivera",
    role: "CTO, DevScale",
    text: "We integrated this into our CI pipeline. AI debt scores dropped 40% in two sprints. The refactor simulator alone justified the switch.",
    rating: 4,
    avatar: "AR",
  },
  {
    name: "Yuki Tanaka",
    role: "Principal Engineer, Sony",
    text: "The developer cognitive simulation is unlike anything I've seen. It models how hard code is to mentally trace — genuinely novel research.",
    rating: 5,
    avatar: "YT",
  },
  {
    name: "David Kim",
    role: "VP Engineering, Datadog",
    text: "Reduced our onboarding time by identifying the most confusing files first. New hires now tackle clarity-scored code instead of guessing.",
    rating: 5,
    avatar: "DK",
  },
];

export default function ReviewsSection() {
  return (
    <section className="relative z-10 py-20 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Trusted by engineers worldwide</h2>
          <p className="mt-2 text-sm text-muted-foreground">See what developers say about AI-induced debt detection</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i }}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 transition-all hover:border-primary/20"
            >
              <Quote className="h-4 w-4 text-primary/40 mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{r.text}</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {r.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.role}</div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
