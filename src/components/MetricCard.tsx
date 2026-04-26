import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface Props {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color: "cyan" | "amber" | "red" | "green" | "purple";
  description?: string;
  delay?: number;
}

const colorMap = {
  cyan: "text-primary border-primary/20 bg-primary/5",
  amber: "text-accent border-accent/20 bg-accent/5",
  red: "text-destructive border-destructive/20 bg-destructive/5",
  green: "text-neon-green border-neon-green/20 bg-neon-green/5",
  purple: "text-neon-purple border-neon-purple/20 bg-neon-purple/5",
};

const iconBg = {
  cyan: "bg-primary/10 text-primary",
  amber: "bg-accent/10 text-accent",
  red: "bg-destructive/10 text-destructive",
  green: "bg-neon-green/10 text-neon-green",
  purple: "bg-neon-purple/10 text-neon-purple",
};

export default function MetricCard({ title, value, suffix = "", icon: Icon, color, description, delay = 0 }: Props) {
  const pct = suffix === "%" ? Math.min(Math.max(value, 0), 100) : Math.min(Math.max(value * 100, 0), 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`rounded-xl border p-5 transition-shadow duration-300 hover:shadow-lg ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        <div className={`rounded-lg p-2 ${iconBg[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold">
        <AnimatedCounter value={value} suffix={suffix} decimals={suffix === "%" ? 0 : 2} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/8">
        <motion.div
          className="h-full rounded-full bg-current/80"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.15, duration: 0.7, ease: "easeOut" }}
        />
      </div>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </motion.div>
  );
}
