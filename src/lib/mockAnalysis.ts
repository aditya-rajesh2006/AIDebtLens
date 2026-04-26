// Mock analysis engine - simulates PMD, SonarQube, Tree-sitter outputs

export interface FileAnalysis {
  file: string;
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  propagationScore: number;
  issues: string[];
  metrics: {
    tds: number; // Base Technical Debt Score
    c: number;   // Complexity
    n: number;   // Nesting
    d: number;   // Duplication
    s: number;   // Size
    m: number;   // Modularization
    cds: number; // Base Cognitive Debt Score
    cu: number;  // Comment Utility
    fr: number;  // Function Readability
    ceb: number; // Cognitive Execution Burden
    ccd: number; // Cognitive Complexity Drift
    es: number;  // Explainability Score
    aes: number; // AI Entropy Score
    rdi: number; // Readability Degradation Index
    dps: number; // Debt Propagation Score
    dli: number; // Debt Longevity Index
    drf: number; // Dependency Risk Factor
    // Advanced Technical
    cp: number;   // Change Proneness
    ccn: number;  // Code Churn
    tc: number;   // Temporal Complexity
    ddp: number;  // Defect Density Proxy
    mds: number;  // Modularity Degradation Score
    // Advanced Cognitive
    cli: number;  // Cognitive Load Index
    ias: number;  // Identifier Ambiguity Score
    ags: number;  // Abstraction Gap Score
    ri: number;   // Readability Index
    csc: number;  // Context Switching Cost
    // AI Detection
    sus: number;  // Structural Uniformity Score
    tdd: number;  // Token Distribution Divergence
    pri: number;  // Pattern Repetition Index
    crs: number;  // Comment Redundancy Score
    scs: number;  // Style Consistency Score
    // AI-Induced Debt Metrics
    adaf: number; // AI Debt Amplification Factor
    ctd: number;  // Cognitive Trace Divergence
    srd: number;  // Semantic Redundancy Debt
    aam: number;  // AI Abstraction Misalignment
    ios: number;  // Intent Obfuscation Score
    hmmd: number; // Human Mental Model Divergence
    aitdis: number; // AI Technical Debt Impact Score (composite)
    // Developer Cognitive Simulation
    ird: number;  // Intent Recognition Difficulty
    cfsc: number; // Control Flow Simulation Cost
    stl: number;  // State Tracking Load
    drc: number;  // Dependency Resolution Cost
    aic: number;  // Abstraction Interpretation Cost
    dcs: number;  // Developer Cognitive Simulation Score (composite)
    actdi: number; // AI Cognitive Technical Debt Index (final composite)
  };
  linesOfCode: number;
  functions: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
  explanation: string;
  datasetScore: number;
  featureVector: number[];
}

export interface PropagationEdge {
  source: string;
  target: string;
  weight: number;
  type: 'clone' | 'dependency' | 'pattern' | 'import';
}

export interface AnalysisResult {
  repoName: string;
  totalFiles: number;
  stars?: number;
  language?: string;
  files: FileAnalysis[];
  propagation: PropagationEdge[];
  summary: {
    avgAiLikelihood: number;
    avgTechnicalDebt: number;
    avgCognitiveDebt: number;
    totalIssues: number;
    highRiskFiles: number;
    topRefactorTargets: string[];
    aiContribution?: number;
  };
}

export interface CommitAnalysis {
  sha: string;
  message: string;
  author: string;
  date: string;
  techDebt: number;
  cogDebt: number;
  aiContribution: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  isSpike: boolean;
  growthFactor?: number;
  debtVelocity?: number;
  debtAcceleration?: number;
  cognitiveTemporalInteraction?: number;
  debtIntroduction?: number;
  debtReduction?: number;
}

export interface CommitTimelineData {
  commits: CommitAnalysis[];
  developers: { name: string; techImpact: number; cogImpact: number; commits: number; totalImpact: number }[];
  trend: string;
  momentum: string;
  prediction: { techDebt5: number; techDebt10: number; cogDebt5: number; cogDebt10: number };
  spikeCount: number;
  averageDebtVelocity?: number;
  averageDebtAcceleration?: number;
  trendClassification?: string;
}

const ISSUE_TYPES = [
  'duplicate code', 'deep nesting', 'high cyclomatic complexity',
  'overly generic naming', 'excessive comments', 'unused imports',
  'poor modularization', 'inconsistent naming', 'redundant logic',
  'unnecessary abstraction', 'missing error handling', 'magic numbers',
  'long parameter list', 'god function', 'dead code',
];

const FILE_TEMPLATES = [
  'src/components/Dashboard.tsx', 'src/utils/helpers.ts', 'src/api/client.ts',
  'src/hooks/useAuth.ts', 'src/services/analytics.ts', 'src/lib/parser.ts',
  'src/components/DataTable.tsx', 'src/utils/formatters.ts', 'src/api/endpoints.ts',
  'src/hooks/useData.ts', 'src/services/cache.ts', 'src/lib/validators.ts',
  'src/components/Chart.tsx', 'src/utils/constants.ts', 'src/api/interceptors.ts',
  'src/hooks/useWebSocket.ts', 'src/services/logger.ts', 'src/lib/transforms.ts',
  'src/components/Modal.tsx', 'src/utils/types.ts', 'src/middleware/auth.ts',
  'src/components/Form.tsx', 'src/store/actions.ts', 'src/store/reducers.ts',
];

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate realistic metrics based on code properties
function generateMetrics(linesOfCode: number, functions: number, cyclomaticComplexity: number, nestingDepth: number, aiLikelihood: number) {
  const isHighAI = aiLikelihood > 0.6;
  
  // Helper to ensure value is never zero
  const nonZero = (min: number, max: number) => Math.max(min, Math.min(max, Math.round((min + Math.random() * (max - min)) * 100) / 100));
  
  // Technical Debt Components (guaranteed non-zero)
  const c = nonZero(0.20, 0.45);
  const n = nonZero(0.15, 0.45);
  const d = nonZero(0.08, 0.25);
  const s = nonZero(0.12, 0.40);
  const m = nonZero(0.08, 0.15);
  const tds = Math.round(Math.min(c + n + d + s + m, 0.95) * 100) / 100;

  // AI Detection Metrics (guaranteed visible)
  const sus = isHighAI ? nonZero(0.50, 0.95) : nonZero(0.20, 0.45);
  const tdd = nonZero(0.25, 0.70);
  const pri = isHighAI ? nonZero(0.40, 0.85) : nonZero(0.15, 0.35);
  const crs = isHighAI ? nonZero(0.40, 0.85) : nonZero(0.15, 0.30);
  const scs = isHighAI ? nonZero(0.60, 0.95) : nonZero(0.30, 0.55);

  // Cognitive Debt Components
  const ccd = nonZero(0.30, 0.95);
  const es = nonZero(0.25, 0.80);
  const aes = isHighAI ? nonZero(0.50, 0.95) : nonZero(0.25, 0.50);
  const rdi = nonZero(0.35, 0.95);
  const cu = nonZero(0.35, 0.90);
  const fr = nonZero(0.35, 0.85);
  const cds = nonZero(0.30, 0.95);

  // Advanced Technical Metrics
  const cp = nonZero(0.25, 0.80);
  const tc = nonZero(0.25, 0.90);
  const ddp = nonZero(0.15, 0.70);
  const mds = nonZero(0.20, 0.80);
  const ccn = cyclomaticComplexity;

  // Derived Metrics
  const dps = nonZero(0.20, 0.90);
  const dli = nonZero(0.20, 0.90);
  const drf = nonZero(0.20, 0.80);

  // Advanced Cognitive
  const cli = nonZero(0.30, 0.90);
  const ias = nonZero(0.25, 0.80);
  const ags = nonZero(0.20, 0.70);
  const ri = nonZero(0.35, 0.80);
  const csc = nonZero(0.25, 0.90);

  // Cognitive Execution Burden
  const ird = nonZero(0.25, 0.70);
  const cfsc = nonZero(0.20, 0.65);
  const stl = nonZero(0.15, 0.55);
  const drc = nonZero(0.20, 0.55);
  const aic = nonZero(0.15, 0.45);
  const ceb = nonZero(0.25, 0.90);
  const dcs = nonZero(0.25, 0.90);
  const actdi = nonZero(0.20, 0.95);

  // AI-Induced Debt Metrics
  const adaf = isHighAI ? nonZero(2, 8) : nonZero(0.8, 2.5);
  const ctd = isHighAI ? nonZero(0.40, 0.85) : nonZero(0.15, 0.35);
  const srd = isHighAI ? nonZero(0.30, 0.75) : nonZero(0.10, 0.25);
  const aam = isHighAI ? nonZero(0.40, 0.85) : nonZero(0.15, 0.30);
  const ios = isHighAI ? nonZero(0.40, 0.75) : nonZero(0.15, 0.35);
  const hmmd = isHighAI ? nonZero(0.40, 0.85) : nonZero(0.15, 0.35);
  const aitdis = nonZero(0.20, 0.95);

  return {
    tds, c, n, d, s, m, cds, cu, fr, ceb, ccd, es, aes, rdi, dps, dli, drf,
    cp, ccn, tc, ddp, mds, cli, ias, ags, ri, csc, sus, tdd, pri, crs, scs,
    adaf, ctd, srd, aam, ios, hmmd, aitdis, ird, cfsc, stl, drc, aic, dcs, actdi,
  };
}

export function generateMockAnalysis(repoName: string): AnalysisResult {
  const numFiles = 12 + Math.floor(Math.random() * 12);
  const files = pickRandom(FILE_TEMPLATES, numFiles);

  const fileAnalyses: FileAnalysis[] = files.map(file => {
    const aiLikelihood = rand(0.1, 0.95);
    const isHighAI = aiLikelihood > 0.6;

    return {
      file,
      aiLikelihood,
      technicalDebt: isHighAI ? rand(0.4, 0.9) : rand(0.1, 0.5),
      cognitiveDebt: isHighAI ? rand(0.5, 0.95) : rand(0.1, 0.4),
      propagationScore: rand(0.1, 0.9),
      issues: pickRandom(ISSUE_TYPES, isHighAI ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1),
      metrics: (() => {
        const linesOfCode = Math.floor(Math.random() * 400) + 50;
        const functions = Math.floor(Math.random() * 15) + 2;
        const cyclomaticComplexity = Math.floor(Math.random() * 20) + 1;
        const nestingDepth = Math.floor(Math.random() * 6) + 1;
        return generateMetrics(linesOfCode, functions, cyclomaticComplexity, nestingDepth, aiLikelihood);
      })(),
      linesOfCode: Math.floor(Math.random() * 400) + 50,
      functions: Math.floor(Math.random() * 15) + 2,
      cyclomaticComplexity: Math.floor(Math.random() * 20) + 1,
      nestingDepth: Math.floor(Math.random() * 6) + 1,
      aiDebtContribution: isHighAI ? rand(40, 90) : rand(5, 30),
      explanation: isHighAI
        ? 'Strong AI-generation signals — high structural uniformity and generic naming patterns. Technical debt amplified through dependency chains.'
        : 'Relatively clean with low AI indicators and manageable debt levels.',
      datasetScore: isHighAI ? rand(0.5, 0.9) : rand(0.1, 0.4),
      featureVector: Array.from({ length: 12 }, () => rand(0.1, 0.9)),
    };
  });

  const propagation: PropagationEdge[] = [];
  const types: PropagationEdge['type'][] = ['clone', 'dependency', 'pattern', 'import'];
  for (let i = 0; i < Math.min(numFiles * 1.5, 20); i++) {
    const s = Math.floor(Math.random() * numFiles);
    let t = Math.floor(Math.random() * numFiles);
    if (t === s) t = (t + 1) % numFiles;
    propagation.push({
      source: files[s], target: files[t],
      weight: rand(0.2, 1),
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  const avgAiLikelihood = fileAnalyses.reduce((s, f) => s + f.aiLikelihood, 0) / numFiles;
  const avgTechnicalDebt = fileAnalyses.reduce((s, f) => s + f.technicalDebt, 0) / numFiles;
  const avgCognitiveDebt = fileAnalyses.reduce((s, f) => s + f.cognitiveDebt, 0) / numFiles;

  return {
    repoName,
    totalFiles: numFiles,
    files: fileAnalyses,
    propagation,
    summary: {
      avgAiLikelihood: Math.round(avgAiLikelihood * 100) / 100,
      avgTechnicalDebt: Math.round(avgTechnicalDebt * 100) / 100,
      avgCognitiveDebt: Math.round(avgCognitiveDebt * 100) / 100,
      totalIssues: fileAnalyses.reduce((s, f) => s + f.issues.length, 0),
      highRiskFiles: fileAnalyses.filter(f => f.aiLikelihood > 0.7 && f.technicalDebt > 0.5).length,
      topRefactorTargets: fileAnalyses
        .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
        .slice(0, 3)
        .map(f => f.file),
    },
  };
}
