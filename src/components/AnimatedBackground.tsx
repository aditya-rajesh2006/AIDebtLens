import { useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";

const nodes = [
  { x: 14, y: 24, size: 10, tone: "primary", delay: 0.1 },
  { x: 26, y: 36, size: 12, tone: "muted", delay: 0.6 },
  { x: 40, y: 22, size: 8, tone: "primary", delay: 1.1 },
  { x: 54, y: 34, size: 14, tone: "purple", delay: 1.4 },
  { x: 68, y: 26, size: 10, tone: "primary", delay: 1.8 },
  { x: 82, y: 38, size: 9, tone: "muted", delay: 2.1 },
  { x: 20, y: 68, size: 11, tone: "purple", delay: 1.2 },
  { x: 36, y: 78, size: 8, tone: "muted", delay: 1.7 },
  { x: 56, y: 72, size: 13, tone: "primary", delay: 2.3 },
  { x: 76, y: 66, size: 10, tone: "purple", delay: 2.8 },
];

const links = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [1, 6], [6, 7], [3, 8], [8, 9], [2, 8],
];

function nodeStyle(tone: string) {
  if (tone === "primary") {
    return {
      border: "hsl(var(--primary) / 0.24)",
      fill: "hsl(var(--primary) / 0.12)",
      glow: "0 0 20px hsl(var(--primary) / 0.16)",
    };
  }
  if (tone === "purple") {
    return {
      border: "hsl(var(--neon-purple) / 0.2)",
      fill: "hsl(var(--neon-purple) / 0.10)",
      glow: "0 0 18px hsl(var(--neon-purple) / 0.14)",
    };
  }
  return {
    border: "hsl(var(--border) / 0.8)",
    fill: "hsl(var(--foreground) / 0.04)",
    glow: "0 0 14px hsl(var(--foreground) / 0.05)",
  };
}

export default function AnimatedBackground() {
  const mouseX = useMotionValue(0.52);
  const mouseY = useMotionValue(0.34);
  const smoothX = useSpring(mouseX, { damping: 48, stiffness: 82 });
  const smoothY = useSpring(mouseY, { damping: 48, stiffness: 82 });
  const spotlightX = useTransform(smoothX, (value) => `${(value * 100).toFixed(1)}%`);
  const spotlightY = useTransform(smoothY, (value) => `${(value * 100).toFixed(1)}%`);

  useEffect(() => {
    const updatePointer = (event: MouseEvent) => {
      mouseX.set(event.clientX / window.innerWidth);
      mouseY.set(event.clientY / window.innerHeight);
    };

    window.addEventListener("mousemove", updatePointer, { passive: true });
    return () => window.removeEventListener("mousemove", updatePointer);
  }, [mouseX, mouseY]);

  const spotlight = useMotionTemplate`radial-gradient(circle at ${spotlightX} ${spotlightY}, hsl(var(--foreground) / 0.24), transparent 18%)`;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(220_18%_5%))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--primary)/0.07),transparent_24%),radial-gradient(circle_at_86%_12%,hsl(var(--neon-purple)/0.06),transparent_20%),radial-gradient(circle_at_50%_100%,hsl(var(--neon-amber)/0.04),transparent_24%)] light:bg-[radial-gradient(circle_at_12%_8%,hsl(var(--primary)/0.04),transparent_20%),radial-gradient(circle_at_86%_12%,hsl(var(--neon-purple)/0.035),transparent_18%),linear-gradient(180deg,hsl(0_0%_100%),hsl(var(--background)))]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.08] light:opacity-[0.045]" />
      <motion.div className="absolute inset-0 opacity-100" style={{ backgroundImage: spotlight }} />

      <motion.div
        className="absolute left-[-10%] top-[4%] h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[130px]"
        animate={{ x: [0, 34, -10, 0], y: [0, -18, 10, 0], scale: [1, 1.05, 0.99, 1] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[-10%] top-[14%] h-[24rem] w-[24rem] rounded-full bg-[hsl(270_72%_62%_/_0.12)] blur-[120px]"
        animate={{ x: [0, -28, 14, 0], y: [0, 14, -8, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 24, ease: "easeInOut", repeat: Infinity, delay: 1.8 }}
      />

      <div className="absolute inset-0">
        <svg className="h-full w-full opacity-[0.18] light:opacity-[0.11]" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          {links.map(([from, to], index) => {
            const a = nodes[from];
            const b = nodes[to];
            const stroke = index % 3 === 0
              ? "hsl(var(--primary) / 0.46)"
              : index % 3 === 1
                ? "hsl(var(--neon-purple) / 0.34)"
                : "hsl(var(--foreground) / 0.18)";

            return (
              <g key={`${from}-${to}`}>
                <motion.line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={stroke}
                  strokeWidth="0.12"
                  strokeDasharray="0.5 1.3"
                  animate={{ opacity: [0.08, 0.26, 0.08] }}
                  transition={{ duration: 7 + index * 0.45, ease: "easeInOut", repeat: Infinity, delay: index * 0.25 }}
                />
                {index % 2 === 0 && (
                  <motion.circle
                    r="0.22"
                    fill={stroke}
                    animate={{ cx: [a.x, b.x], cy: [a.y, b.y], opacity: [0, 0.7, 0] }}
                    transition={{ duration: 5.8 + index * 0.2, ease: "linear", repeat: Infinity, delay: 1 + index * 0.3 }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <svg className="absolute inset-0 h-full w-full opacity-[0.14] light:opacity-[0.08]" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <motion.path
            d="M0 30C16 24 22 40 38 36C55 32 62 20 78 23C90 25 95 32 100 34"
            stroke="hsl(var(--primary) / 0.34)"
            strokeWidth="0.14"
            strokeDasharray="1 2.2"
            animate={{ pathLength: [0.18, 1, 0.18], opacity: [0.05, 0.18, 0.05] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0 72C14 66 26 82 46 77C60 73 67 61 82 63C90 64 96 68 100 70"
            stroke="hsl(var(--neon-purple) / 0.28)"
            strokeWidth="0.14"
            strokeDasharray="1 2.4"
            animate={{ pathLength: [1, 0.2, 1], opacity: [0.04, 0.16, 0.04] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </svg>

        {nodes.map((node) => {
          const style = nodeStyle(node.tone);
          return (
            <motion.div
              key={`${node.x}-${node.y}`}
              className="absolute rounded-full backdrop-blur-sm"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.size}px`,
                height: `${node.size}px`,
                border: `1px solid ${style.border}`,
                background: style.fill,
                boxShadow: style.glow,
              }}
              animate={{ y: [0, -8, 0], scale: [1, 1.07, 1], opacity: [0.34, 0.74, 0.34] }}
              transition={{ duration: 6.5, ease: "easeInOut", repeat: Infinity, delay: node.delay }}
            >
              {node.tone !== "muted" && (
                <motion.div
                  className="absolute inset-[-5px] rounded-full"
                  style={{ border: `1px solid ${style.border}` }}
                  animate={{ scale: [0.96, 1.6], opacity: [0.14, 0] }}
                  transition={{ duration: 4.8, ease: "easeOut", repeat: Infinity, delay: node.delay + 0.4 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="absolute inset-x-[8%] top-[18%] h-px bg-gradient-to-r from-transparent via-primary/24 to-transparent"
        animate={{ opacity: [0.08, 0.22, 0.08], scaleX: [0.92, 1.02, 0.92] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-x-[14%] top-[62%] h-px bg-gradient-to-r from-transparent via-[hsl(var(--neon-purple)/0.2)] to-transparent"
        animate={{ opacity: [0.06, 0.18, 0.06], scaleX: [1.02, 0.94, 1.02] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity, delay: 1.4 }}
      />
    </div>
  );
}
