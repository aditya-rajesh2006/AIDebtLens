import { motion } from "framer-motion";
import type { FileAnalysis } from "@/lib/mockAnalysis";
import MetricTooltip from "./MetricTooltip";

interface Props {
  file: FileAnalysis;
}

function MiniBar({
  label,
  value,
  color,
  tooltip,
}: {
  label: string;
  value: number;
  color: string;
  tooltip?: string;
}) {
  const normalized = Math.max(0, Math.min(value, 1));
  const pct = normalized * 100;

  const content = (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55 }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-[11px] font-semibold text-foreground">
        {pct.toFixed(0)}%
      </span>
    </div>
  );

  if (!tooltip) return content;
  return (
    <MetricTooltip metric={tooltip} side="left">
      {content}
    </MetricTooltip>
  );
}

export default function DebtBreakdown({ file }: Props) {
  const aiSignal = file.aiLikelihood * Math.max(file.metrics.sus, file.metrics.pri, 0.3);
  const aiTD = aiSignal * file.technicalDebt;
  const aiCD = aiSignal * file.cognitiveDebt;
  const totalDebt = file.technicalDebt + file.cognitiveDebt;
  const aiPct = totalDebt > 0 ? Math.round(((aiTD + aiCD) / totalDebt) * 100) : 0;

  const metricGroups = [
    {
      title: "Base Technical",
      tone: "border-accent/20 bg-accent/5",
      text: "text-accent",
      metrics: [
        { label: "TDS", value: file.metrics.tds, color: "hsl(36, 95%, 58%)", tooltip: "TDS" },
        { label: "C", value: file.metrics.c, color: "hsl(36, 90%, 56%)", tooltip: "C" },
        { label: "N", value: file.metrics.n, color: "hsl(36, 84%, 52%)", tooltip: "N" },
        { label: "D", value: file.metrics.d, color: "hsl(36, 74%, 48%)", tooltip: "D" },
        { label: "S", value: file.metrics.s, color: "hsl(32, 72%, 46%)", tooltip: "S" },
        { label: "M", value: file.metrics.m, color: "hsl(28, 68%, 42%)", tooltip: "M" },
      ],
    },
    {
      title: "Advanced Technical",
      tone: "border-orange-500/20 bg-orange-500/5",
      text: "text-orange-400",
      metrics: [
        { label: "CP", value: file.metrics.cp, color: "hsl(20, 84%, 58%)", tooltip: "CP" },
        { label: "CCN", value: Math.min(file.metrics.ccn / 400, 1), color: "hsl(18, 78%, 54%)", tooltip: "CCN" },
        { label: "TC", value: file.metrics.tc, color: "hsl(16, 72%, 50%)", tooltip: "TC" },
        { label: "DDP", value: file.metrics.ddp, color: "hsl(14, 68%, 46%)", tooltip: "DDP" },
        { label: "MDS", value: file.metrics.mds, color: "hsl(10, 62%, 42%)", tooltip: "MDS" },
      ],
    },
    {
      title: "Derived Technical",
      tone: "border-primary/20 bg-primary/5",
      text: "text-primary",
      metrics: [
        { label: "DPS", value: file.metrics.dps, color: "hsl(174, 72%, 52%)", tooltip: "DPS" },
        { label: "DLI", value: file.metrics.dli, color: "hsl(174, 64%, 46%)", tooltip: "DLI" },
        { label: "DRF", value: file.metrics.drf, color: "hsl(174, 56%, 40%)", tooltip: "DRF" },
      ],
    },
    {
      title: "Base Cognitive",
      tone: "border-neon-purple/20 bg-neon-purple/5",
      text: "text-neon-purple",
      metrics: [
        { label: "CDS", value: file.metrics.cds, color: "hsl(270, 72%, 62%)", tooltip: "CDS" },
        { label: "CCD", value: file.metrics.ccd, color: "hsl(270, 68%, 58%)", tooltip: "CCD" },
        { label: "ES", value: file.metrics.es, color: "hsl(270, 62%, 54%)", tooltip: "ES" },
        { label: "AES", value: file.metrics.aes, color: "hsl(270, 56%, 50%)", tooltip: "AES" },
        { label: "RDI", value: file.metrics.rdi, color: "hsl(270, 50%, 46%)", tooltip: "RDI" },
        { label: "CU", value: file.metrics.cu, color: "hsl(270, 46%, 42%)", tooltip: "CU" },
        { label: "FR", value: file.metrics.fr, color: "hsl(270, 40%, 38%)", tooltip: "FR" },
      ],
    },
    {
      title: "Advanced Cognitive",
      tone: "border-fuchsia-500/20 bg-fuchsia-500/5",
      text: "text-fuchsia-400",
      metrics: [
        { label: "CLI", value: file.metrics.cli, color: "hsl(308, 72%, 60%)", tooltip: "CLI" },
        { label: "IAS", value: file.metrics.ias, color: "hsl(304, 66%, 56%)", tooltip: "IAS" },
        { label: "AGS", value: file.metrics.ags, color: "hsl(300, 62%, 52%)", tooltip: "AGS" },
        { label: "RI", value: file.metrics.ri, color: "hsl(296, 56%, 48%)", tooltip: "RI" },
        { label: "CSC", value: file.metrics.csc, color: "hsl(292, 50%, 44%)", tooltip: "CSC" },
      ],
    },
    {
      title: "Execution Burden",
      tone: "border-cyan-500/20 bg-cyan-500/5",
      text: "text-cyan-400",
      metrics: [
        { label: "CEB", value: file.metrics.ceb, color: "hsl(192, 86%, 58%)", tooltip: "CEB" },
        { label: "IRD", value: file.metrics.ird, color: "hsl(190, 78%, 54%)", tooltip: "IRD" },
        { label: "CFSC", value: file.metrics.cfsc, color: "hsl(188, 72%, 50%)", tooltip: "CFSC" },
        { label: "STL", value: file.metrics.stl, color: "hsl(186, 66%, 46%)", tooltip: "STL" },
        { label: "DRC", value: file.metrics.drc, color: "hsl(184, 60%, 42%)", tooltip: "DRC" },
        { label: "AIC", value: file.metrics.aic, color: "hsl(182, 54%, 38%)", tooltip: "AIC" },
        { label: "DCS", value: file.metrics.dcs, color: "hsl(180, 48%, 36%)", tooltip: "DCS" },
      ],
    },
    {
      title: "AI Detection",
      tone: "border-primary/20 bg-primary/5",
      text: "text-primary",
      metrics: [
        { label: "SUS", value: file.metrics.sus, color: "hsl(174, 72%, 52%)", tooltip: "SUS" },
        { label: "TDD", value: file.metrics.tdd, color: "hsl(174, 65%, 48%)", tooltip: "TDD" },
        { label: "PRI", value: file.metrics.pri, color: "hsl(174, 58%, 44%)", tooltip: "PRI" },
        { label: "CRS", value: file.metrics.crs, color: "hsl(174, 52%, 40%)", tooltip: "CRS" },
        { label: "SCS", value: file.metrics.scs, color: "hsl(174, 46%, 36%)", tooltip: "SCS" },
      ],
    },
    {
      title: "AI-Induced Debt",
      tone: "border-emerald-500/20 bg-emerald-500/5",
      text: "text-emerald-400",
      metrics: [
        { label: "ADAF", value: Math.min(file.metrics.adaf / 10, 1), color: "hsl(156, 72%, 46%)", tooltip: "ADAF" },
        { label: "CTD", value: file.metrics.ctd, color: "hsl(154, 66%, 42%)", tooltip: "CTD" },
        { label: "SRD", value: file.metrics.srd, color: "hsl(152, 60%, 40%)", tooltip: "SRD" },
        { label: "AAM", value: file.metrics.aam, color: "hsl(150, 56%, 38%)", tooltip: "AAM" },
        { label: "IOS", value: file.metrics.ios, color: "hsl(148, 52%, 36%)", tooltip: "IOS" },
        { label: "HMMD", value: file.metrics.hmmd, color: "hsl(146, 48%, 34%)", tooltip: "HMMD" },
        { label: "AITDIS", value: file.metrics.aitdis, color: "hsl(144, 44%, 32%)", tooltip: "AITDIS" },
        { label: "ACTDI", value: file.metrics.actdi, color: "hsl(142, 40%, 30%)", tooltip: "ACTDI" },
      ],
    },
  ];

  return (
    <div className="mt-3 space-y-5">
      {aiPct > 5 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <span className="text-xs text-muted-foreground">
            AI-generated code contributes <strong className="font-mono text-primary">{aiPct}%</strong> of this file&apos;s total debt
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            TD: {(aiTD * 100).toFixed(0)}% · CD: {(aiCD * 100).toFixed(0)}%
          </span>
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {metricGroups.map((group) => (
          <div key={group.title} className={`rounded-xl border p-5 ${group.tone}`}>
            <p className={`mb-4 text-[11px] font-semibold uppercase tracking-wider ${group.text}`}>{group.title}</p>
            <div className="divide-y divide-border/40">
              {group.metrics.map((metric) => (
                <MiniBar
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  color={metric.color}
                  tooltip={metric.tooltip}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
