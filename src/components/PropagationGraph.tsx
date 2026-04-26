import { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, ChevronRight, Code, GitFork, Info, Wrench, X } from "lucide-react";
import type { AnalysisResult, FileAnalysis, PropagationEdge } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

export default function PropagationGraph({ data }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  const nodes = useMemo(() => {
    return data.files.map((f, i) => {
      const angle = (2 * Math.PI * i) / data.files.length;
      const radius = 200;
      return {
        id: f.file,
        x: 300 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle),
        risk: f.aiLikelihood * 0.5 + f.technicalDebt * 0.3 + f.cognitiveDebt * 0.2,
        label: f.file.split("/").pop() || f.file,
        file: f,
      };
    });
  }, [data.files]);

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);

  const nodeColor = (file: FileAnalysis) => {
    if (file.aiLikelihood > 0.6) return "hsl(270, 72%, 62%)"; // purple - AI
    if (file.technicalDebt > 0.6 || file.cognitiveDebt > 0.6) return "hsl(0, 72%, 55%)"; // red - high debt
    if (file.technicalDebt > 0.35 || file.cognitiveDebt > 0.35) return "hsl(36, 95%, 58%)"; // yellow - medium
    return "hsl(174, 72%, 52%)"; // green - clean
  };

  const edgeColor = (edge: PropagationEdge) => {
    if (edge.type === "clone" || edge.type === "pattern") return "hsl(270, 72%, 62%)"; // purple - AI reuse
    if (edge.weight > 0.6) return "hsl(0, 72%, 55%)"; // red - strong propagation
    return "hsl(174, 72%, 52%)"; // blue/cyan - dependency
  };

  const edgeLabel = (edge: PropagationEdge) => {
    const labels: Record<string, string> = {
      clone: "AI code reuse — duplicated pattern",
      dependency: "Direct dependency — debt flows through import",
      pattern: "Shared AI pattern — structural similarity",
      import: "Import chain — debt propagates via module",
    };
    return labels[edge.type] || "Connection";
  };

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    data.propagation.forEach((edge) => {
      if (edge.source === hoveredNode) connected.add(edge.target);
      if (edge.target === hoveredNode) connected.add(edge.source);
    });
    return connected;
  }, [hoveredNode, data.propagation]);

  const selectedFile = selectedNode ? data.files.find((f) => f.file === selectedNode) : null;

  const getRefactorImpact = (file: FileAnalysis) => {
    const totalTech = data.files.reduce((s, f) => s + f.technicalDebt, 0);
    const totalCog = data.files.reduce((s, f) => s + f.cognitiveDebt, 0);
    const linksRemoved = data.propagation.filter((e) => e.source === file.file || e.target === file.file).length;
    return {
      techReduction: Math.round((file.technicalDebt / totalTech) * 100),
      cogReduction: Math.round((file.cognitiveDebt / totalCog) * 100),
      linksRemoved,
    };
  };

  // Graph explanation
  const mostImpactful = useMemo(() => {
    return [...data.files].sort((a, b) => (b.technicalDebt + b.cognitiveDebt + b.propagationScore) - (a.technicalDebt + a.cognitiveDebt + a.propagationScore))[0];
  }, [data.files]);

  const originFile = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    data.propagation.forEach((e) => {
      sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
    });
    const top = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
    return top ? { file: top[0], count: top[1] } : null;
  }, [data.propagation]);

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Propagation Graph</h3>
        <svg viewBox="0 0 600 500" className="w-full max-w-[600px] mx-auto">
          {/* Edges */}
          {data.propagation.map((edge, i) => {
            const s = getNode(edge.source);
            const t = getNode(edge.target);
            if (!s || !t) return null;
            const isConnected = hoveredNode ? connectedNodes.has(edge.source) && connectedNodes.has(edge.target) : true;
            const isHovered = hoveredEdge === i;
            return (
              <g key={i}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={edgeColor(edge)}
                  strokeOpacity={isConnected ? (isHovered ? 0.9 : 0.15 + edge.weight * 0.3) : 0.04}
                  strokeWidth={isHovered ? 3 : 0.5 + edge.weight * 1.5}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {isHovered && (
                  <foreignObject x={(s.x + t.x) / 2 - 80} y={(s.y + t.y) / 2 - 30} width={160} height={40}>
                    <div className="rounded-md bg-popover border border-border px-2 py-1 text-[9px] text-popover-foreground text-center shadow-lg">
                      {edgeLabel(edge)}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const isConnected = hoveredNode ? connectedNodes.has(node.id) : true;
            const isSelected = selectedNode === node.id;
            const color = nodeColor(node.file);
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
              >
                {/* Glow on hover */}
                {(hoveredNode === node.id || isSelected) && (
                  <circle cx={node.x} cy={node.y} r={16 + node.risk * 12} fill={color} fillOpacity={0.1} className="animate-pulse" />
                )}
                <circle
                  cx={node.x} cy={node.y}
                  r={8 + node.risk * 12}
                  fill={color}
                  fillOpacity={isConnected ? 0.25 : 0.05}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-200"
                />
                <circle
                  cx={node.x} cy={node.y}
                  r={3}
                  fill={color}
                  fillOpacity={isConnected ? 1 : 0.2}
                />
                <text
                  x={node.x}
                  y={node.y + 22 + node.risk * 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] font-mono"
                  fillOpacity={isConnected ? 1 : 0.3}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Clean</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> High Debt</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "hsl(270, 72%, 62%)" }} /> AI-Induced</span>
        </div>
      </div>

      {/* Graph Explanation Panel */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Graph Explanation</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-secondary/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">What This Shows</p>
            <p className="text-xs text-foreground">Each node is a file. Edges show how debt propagates between files through imports, clones, and shared patterns.</p>
          </div>
          {originFile && (
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Debt Origin</p>
              <p className="text-xs text-foreground font-mono">{originFile.file.split("/").pop()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Spreads debt to {originFile.count} connected files</p>
            </div>
          )}
          {mostImpactful && (
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Most Impactful Node</p>
              <p className="text-xs text-foreground font-mono">{mostImpactful.file.split("/").pop()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Combined debt: {((mostImpactful.technicalDebt + mostImpactful.cognitiveDebt) / 2 * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Correction Panel (when node is selected) */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Correction Panel</h3>
                  <span className="text-xs font-mono text-muted-foreground">{selectedFile.file}</span>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Why problematic */}
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-semibold text-foreground">Why This Is Problematic</span>
                  </div>
                  <div className="space-y-2">
                    {selectedFile.technicalDebt > 0.5 && (
                      <p className="text-[11px] text-muted-foreground">• High technical debt ({(selectedFile.technicalDebt * 100).toFixed(0)}%) — complexity slows development</p>
                    )}
                    {selectedFile.cognitiveDebt > 0.5 && (
                      <p className="text-[11px] text-muted-foreground">• High cognitive debt ({(selectedFile.cognitiveDebt * 100).toFixed(0)}%) — hard to understand and maintain</p>
                    )}
                    {selectedFile.aiLikelihood > 0.6 && (
                      <p className="text-[11px] text-muted-foreground">• AI-generated code ({(selectedFile.aiLikelihood * 100).toFixed(0)}%) — may lack intentional design</p>
                    )}
                    {selectedFile.propagationScore > 0.5 && (
                      <p className="text-[11px] text-muted-foreground">• High propagation ({(selectedFile.propagationScore * 100).toFixed(0)}%) — spreads debt to other files</p>
                    )}
                    {selectedFile.cyclomaticComplexity > 10 && (
                      <p className="text-[11px] text-muted-foreground">• Cyclomatic complexity: {selectedFile.cyclomaticComplexity} (target: ≤8)</p>
                    )}
                    {selectedFile.nestingDepth > 3 && (
                      <p className="text-[11px] text-muted-foreground">• Nesting depth: {selectedFile.nestingDepth} (target: ≤3)</p>
                    )}
                  </div>
                </div>

                {/* Issues */}
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-semibold text-foreground">Detected Issues</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedFile.issues.map((issue) => (
                      <div key={issue} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{issue}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                    <span>LOC: <strong className="text-foreground">{selectedFile.linesOfCode}</strong></span>
                    <span>Functions: <strong className="text-foreground">{selectedFile.functions}</strong></span>
                  </div>
                </div>

                {/* Impact of fixing */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-3.5 w-3.5 text-neon-green" />
                    <span className="text-xs font-semibold text-foreground">If You Fix This File</span>
                  </div>
                  {(() => {
                    const impact = getRefactorImpact(selectedFile);
                    return (
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">Tech debt reduction</span>
                            <span className="font-mono text-neon-green">{impact.techReduction}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div className="h-full rounded-full bg-neon-green" initial={{ width: 0 }} animate={{ width: `${impact.techReduction}%` }} transition={{ duration: 0.8 }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">Cognitive debt reduction</span>
                            <span className="font-mono text-neon-green">{impact.cogReduction}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div className="h-full rounded-full bg-neon-green" initial={{ width: 0 }} animate={{ width: `${impact.cogReduction}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <GitFork className="h-3 w-3 text-primary" />
                          <span className="text-[11px] text-muted-foreground">{impact.linksRemoved} propagation links removed</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Suggested fixes */}
              <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-4">
                <p className="text-xs font-semibold text-foreground mb-2">Suggested Fixes</p>
                <div className="space-y-1.5">
                  {selectedFile.cyclomaticComplexity > 10 && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Break complex logic into named helper functions (complexity {selectedFile.cyclomaticComplexity} → target ≤8)</span></div>
                  )}
                  {selectedFile.nestingDepth > 3 && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Use early returns and guard clauses to reduce nesting from {selectedFile.nestingDepth} to ≤3</span></div>
                  )}
                  {selectedFile.linesOfCode > 200 && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Split file ({selectedFile.linesOfCode} LOC) into focused modules of &lt;150 LOC each</span></div>
                  )}
                  {selectedFile.issues.includes("duplicate code blocks") && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Extract duplicate blocks into shared utilities</span></div>
                  )}
                  {selectedFile.aiLikelihood > 0.6 && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Review AI-generated patterns — improve naming and add domain context</span></div>
                  )}
                  {selectedFile.metrics.rdi > 0.5 && (
                    <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Improve readability: add whitespace between sections, use consistent formatting</span></div>
                  )}
                  <div className="flex items-start gap-2"><ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span className="text-[11px] text-muted-foreground">Add unit tests before refactoring to prevent regressions</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
