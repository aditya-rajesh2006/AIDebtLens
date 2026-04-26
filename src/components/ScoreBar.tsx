import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

export default function ScoreBar({ label, value, maxValue = 1 }: Props) {
  const pct = Math.min((value / maxValue) * 100, 100);
  const hue = 174 - (pct / 100) * 174; // cyan to red

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate mr-2">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: `hsl(${hue}, 72%, 52%)` }}
        />
      </div>
    </div>
  );
}
