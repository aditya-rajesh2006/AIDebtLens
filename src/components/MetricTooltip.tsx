import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface MetricInfo {
  fullName: string;
  description: string;
  formula?: string;
}

const METRIC_EXPLANATIONS: Record<string, MetricInfo> = {
  // ─── Base Technical Debt ───
  "TDS": {
    fullName: "Base Technical Debt Score",
    description: "Core structural debt metric combining complexity, nesting, duplication, size, and modularization.",
    formula: "TDS = C + N + D + S + M",
  },
  "C": {
    fullName: "Complexity Score",
    description: "Based on Cyclomatic Complexity (McCabe). Measures independent execution paths.",
    formula: "C = 0.30 if CC>15, 0.18 if CC>8, 0 otherwise",
  },
  "N": {
    fullName: "Nesting Depth Score",
    description: "Control flow depth — deep nesting reduces readability and increases bug probability.",
    formula: "N = 0.30 if depth>4, 0.18 if depth>3, 0 otherwise",
  },
  "D": {
    fullName: "Duplication Score",
    description: "Detects repeated logic blocks violating DRY principle.",
    formula: "D = 0.15 if duplicate blocks>2, 0 otherwise",
  },
  "S": {
    fullName: "Size Score",
    description: "Large files increase navigation difficulty and change risk.",
    formula: "S = 0.25 if LOC>300, 0.15 if LOC>200, 0 otherwise",
  },
  "M": {
    fullName: "Modularization Penalty",
    description: "Too many functions indicate poor cohesion and spaghetti structure.",
    formula: "M = 0.10 if functions>20, 0 otherwise",
  },

  // ─── Advanced Technical ───
  "CP": {
    fullName: "Change Proneness",
    description: "How often a file changes — high CP means unstable code and likely design issues.",
    formula: "CP = modifications / total_commits",
  },
  "CCN": {
    fullName: "Code Churn",
    description: "Volume of change — strong predictor of defects and code volatility.",
    formula: "CCN = lines_added + lines_deleted",
  },
  "TC": {
    fullName: "Temporal Complexity",
    description: "Complex AND frequently changing = dangerous code.",
    formula: "TC = change_frequency × complexity",
  },
  "DDP": {
    fullName: "Defect Density Proxy",
    description: "Estimates bug concentration per line of code.",
    formula: "DDP = issues_detected / LOC",
  },
  "MDS": {
    fullName: "Modularity Degradation Score",
    description: "High coupling + low cohesion = poor architecture.",
    formula: "MDS = coupling / cohesion",
  },

  // ─── Derived Technical (Novel) ───
  "DPS": {
    fullName: "Debt Propagation Score",
    description: "Measures how much a file spreads debt to dependent files.",
    formula: "DPS = 0.6·TDS + 0.4·AI_likelihood",
  },
  "DLI": {
    fullName: "Debt Longevity Index",
    description: "Predicts how long debt will persist in the codebase.",
    formula: "DLI = 0.5·TDS + 0.5·CCD",
  },
  "DRF": {
    fullName: "Dependency Risk Factor",
    description: "Combined risk from dependencies, structure, and AI patterns.",
    formula: "DRF = 0.4·AES + 0.3·TDS + 0.3·AI_likelihood",
  },

  // ─── Base Cognitive Debt ───
  "CDS": {
    fullName: "Base Cognitive Debt Score",
    description: "Measures how hard code is to understand — combining structural difficulty, naming clarity, and documentation quality.",
    formula: "CDS = 0.25·CCD + 0.20·(1-ES) + 0.20·AES + 0.15·RDI + 0.10·CU + 0.10·FR",
  },
  "CCD": {
    fullName: "Cognitive Complexity Drift",
    description: "Density of control logic — too many branches make code hard to mentally simulate.",
    formula: "CCD = control_flow_keywords / (total_lines × 0.12 + 1)",
  },
  "ES": {
    fullName: "Explainability Score",
    description: "How meaningful variable/function names are. Low ES = confusing names.",
    formula: "ES = avg_identifier_length / 12",
  },
  "AES": {
    fullName: "AI Entropy Score",
    description: "Structural variation — too uniform = AI-like and harder to scan.",
    formula: "AES = std_dev(line_lengths) / 40",
  },
  "RDI": {
    fullName: "Readability Degradation Index",
    description: "Too many comments = noise, too few = lack of guidance. Optimal: 5–30%.",
    formula: "RDI = 0.8 if comments>30%, 0.3 if 5–30%, 0.55 if <5%",
  },
  "CU": {
    fullName: "Comment Utility",
    description: "Measures usefulness of comments — penalizes restating code.",
    formula: "CU = 1 - obvious_comments / total_comments",
  },
  "FR": {
    fullName: "Function Readability",
    description: "Captures function size, structure, and naming quality.",
    formula: "FR = normalized(length + nesting + naming_clarity)",
  },

  // ─── Advanced Cognitive ───
  "CLI": {
    fullName: "Cognitive Load Index",
    description: "Based on Cognitive Load Theory — represents mental workload.",
    formula: "CLI = nesting_depth + branching_factor + function_length / 50",
  },
  "IAS": {
    fullName: "Identifier Ambiguity Score",
    description: "High IAS means more guessing, slower comprehension.",
    formula: "IAS = unclear_variable_names / total_variables",
  },
  "AGS": {
    fullName: "Abstraction Gap Score",
    description: "Mismatch between what code should do and what it actually does.",
    formula: "AGS = |intent_complexity - implementation_complexity|",
  },
  "RI": {
    fullName: "Readability Index",
    description: "Overall readability score — lower RI = higher cognitive debt.",
    formula: "RI = normalized(avg_line_length + nesting + naming_score)",
  },
  "CSC": {
    fullName: "Context Switching Cost",
    description: "How often a developer must jump between files — breaks focus.",
    formula: "CSC = dependencies + cross_file_references",
  },

  // ─── Cognitive Execution Burden (Novel) ───
  "CEB": {
    fullName: "Cognitive Execution Burden",
    description: "Models how much mental effort is needed to simulate code execution. Based on Pennington's comprehension model and Sweller's cognitive load theory.",
    formula: "CEB = 0.25·IRD + 0.20·CFSC + 0.20·STL + 0.20·DRC + 0.15·AIC",
  },
  "IRD": {
    fullName: "Intent Recognition Difficulty",
    description: "Effort to infer what the code is trying to do.",
    formula: "IRD = 1 - intent_transparency",
  },
  "CFSC": {
    fullName: "Control Flow Simulation Cost",
    description: "Mental effort to trace execution paths.",
    formula: "CFSC = branches × nesting / LOC",
  },
  "STL": {
    fullName: "State Tracking Load",
    description: "Burden of tracking variable state changes through mutations.",
    formula: "STL = mutable_variables × reassignments",
  },
  "DRC": {
    fullName: "Dependency Resolution Cost",
    description: "Effort to understand external references and imports.",
    formula: "DRC = external_calls + cross_file_refs",
  },
  "AIC": {
    fullName: "Abstraction Interpretation Cost",
    description: "Effort to understand layered abstraction levels.",
    formula: "AIC = abstraction_layers / complexity",
  },
  "DCS": {
    fullName: "Developer Cognitive Simulation Score",
    description: "Composite mental effort to simulate code execution — same as CEB.",
    formula: "DCS = 0.25·IRD + 0.20·CFSC + 0.20·STL + 0.20·DRC + 0.15·AIC",
  },
  "G": {
    fullName: "Growth Factor",
    description: "How much debt is amplified by repository growth or reduced by contraction.",
    formula: "G = 1 + (net_growth × 0.3)",
  },

  // ─── AI Detection ───
  "SUS": {
    fullName: "Structural Uniformity Score",
    description: "How similar function structures are — high = AI-like patterns.",
    formula: "SUS = 1 - variance(function_structures)",
  },
  "TDD": {
    fullName: "Token Distribution Divergence",
    description: "Deviation from natural human token usage patterns.",
    formula: "TDD = KL_divergence(token_dist, human_baseline)",
  },
  "PRI": {
    fullName: "Pattern Repetition Index",
    description: "Frequency of repeated logic blocks across the codebase.",
    formula: "PRI = repeated_patterns / total_patterns",
  },
  "CRS": {
    fullName: "Comment Redundancy Score",
    description: "Comments that explain obvious code — an AI hallmark.",
    formula: "CRS = obvious_comments / total_comments",
  },
  "SCS": {
    fullName: "Style Consistency Score",
    description: "Suspiciously uniform formatting typical of AI generation.",
    formula: "SCS = 1 - variance(style_features)",
  },

  // ─── AI-Induced Debt ───
  "ADAF": {
    fullName: "AI Debt Amplification Factor",
    description: "How much debt grows from an AI code seed to downstream files.",
    formula: "ADAF = descendant_debt / AI_origin_debt",
  },
  "CTD": {
    fullName: "Cognitive Trace Divergence",
    description: "How much execution logic deviates from typical human reasoning patterns.",
    formula: "CTD = divergence(AI_trace, human_trace)",
  },
  "SRD": {
    fullName: "Semantic Redundancy Debt",
    description: "Redundant conditions and checks commonly introduced by AI.",
    formula: "SRD = redundant_conditions / total_conditions",
  },
  "AAM": {
    fullName: "AI Abstraction Misalignment",
    description: "When AI introduces abstractions at the wrong level of complexity.",
    formula: "AAM = |expected_abstraction - actual_abstraction|",
  },
  "IOS": {
    fullName: "Intent Obfuscation Score",
    description: "How hard it is to infer the purpose of the code from its structure.",
    formula: "IOS = 1 - intent_clarity",
  },
  "HMMD": {
    fullName: "Human Mental Model Divergence",
    description: "KL divergence between AI AST distribution and human patterns.",
    formula: "HMMD = KL(AI_AST_dist, Human_AST_dist)",
  },
  "AITDIS": {
    fullName: "AI Technical Debt Impact Score",
    description: "Weighted composite of ADAF, CTD, SRD, AAM, IOS, ADPV, HMMD.",
    formula: "AITDIS = 0.20·ADAF + 0.15·CTD + 0.15·SRD + 0.15·AAM + 0.10·IOS + 0.10·ADPV + 0.15·HMMD",
  },
  "ACTDI": {
    fullName: "AI Cognitive Technical Debt Index",
    description: "Final composite combining DCS, propagation, and maintainability.",
    formula: "ACTDI = weighted(DCS, propagation, code_smell_density, maintainability_loss)",
  },

  // ─── Dynamic / Temporal ───
  "DV": {
    fullName: "Debt Velocity",
    description: "Speed at which debt is increasing — high DV = dangerous system.",
    formula: "DV = (TDS(c) - TDS(c-1)) / Δt",
  },
  "DA": {
    fullName: "Debt Acceleration",
    description: "Detects worsening trends — increasing velocity = runaway debt.",
    formula: "DA = DV(c) - DV(c-1)",
  },
  "CTI": {
    fullName: "Cognitive-Temporal Interaction",
    description: "Hard to understand AND frequently modified = extremely risky.",
    formula: "CTI = CDS × change_frequency",
  },
  "DI": {
    fullName: "Debt Introduction",
    description: "New debt introduced by a commit.",
    formula: "DI(c) = max(0, TDS(c) - TDS(c-1))",
  },
  "DR": {
    fullName: "Debt Reduction",
    description: "Debt removed by a commit or refactor.",
    formula: "DR(c) = max(0, TDS(c-1) - TDS(c))",
  },

  // ─── Dashboard Composites ───
  "AI Likelihood": {
    fullName: "AI Likelihood",
    description: "Probability that code was generated by AI based on naming, structure, and comment patterns.",
    formula: "Hybrid: heuristic (40%) + dataset calibration (40%) + structural (20%)",
  },
  "Technical Debt": {
    fullName: "Technical Debt",
    description: "Complexity, nesting, duplication, and modularity issues that slow development.",
    formula: "Final_TD = 0.6·Sonar_TD + 0.4·Custom_TD",
  },
  "Cognitive Debt": {
    fullName: "Cognitive Debt",
    description: "Mental effort required to understand code — naming, structure, and readability.",
    formula: "Final_CD = 0.7·(Base_CD + AI_Amplification) + 0.3·confusion_score",
  },
  "Propagation": {
    fullName: "Debt Propagation",
    description: "How much this file's issues spread to other connected files.",
    formula: "Propagation = DPS × connected_files",
  },
  "High Risk Files": {
    fullName: "High Risk Files",
    description: "Files with high AI likelihood AND high technical debt — refactor these first.",
    formula: "Risk = (AI_likelihood + TD + CD) / 3 > threshold",
  },
  "Refactor Priority Score": {
    fullName: "Refactor Priority Score",
    description: "Combined urgency score (0–100) based on average tech + cognitive debt.",
    formula: "Score = ((avg_TD + avg_CD) / 2) × 100",
  },
  "Debt Confidence Score": {
    fullName: "Debt Confidence Score",
    description: "How reliable the detection is based on issue density and metric consistency.",
    formula: "Confidence = (issue_density × 0.4 + metric_consistency × 0.6) × 100",
  },
};

interface Props {
  metricKey?: string;
  metric?: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  customFormula?: string;
  customDesc?: string;
}

export default function MetricTooltip({ metricKey, metric, children, side = "top", customFormula, customDesc }: Props) {
  const key = metricKey || metric;
  const info = key ? METRIC_EXPLANATIONS[key] : null;
  
  if (!info && !customFormula && !customDesc) return <>{children}</>;

  const formula = customFormula || info?.formula;
  const desc = customDesc || info?.description;
  const fullName = info?.fullName;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed p-3 space-y-1.5">
          {fullName && <p className="font-semibold text-foreground">{fullName}</p>}
          {desc && <p className="text-muted-foreground">{desc}</p>}
          {formula && (
            <p className="font-mono text-[10px] text-primary bg-primary/10 rounded px-1.5 py-1 mt-1">{formula}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
