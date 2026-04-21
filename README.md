# AI DEBT LENS

**AI DEBT LENS** is a comprehensive code analysis platform that detects, measures, and visualizes AI-induced technical debt in GitHub repositories. It goes beyond traditional static analysis by identifying patterns specific to AI-generated code and tracking how debt propagates across your codebase.

## 🌐 Live App

Set your deployed application URL here.

---

## 📖 How It Works

### Analysis Pipeline

1. **Repository Ingestion** — Fetches source files from any public GitHub repo via the GitHub API (up to 40 code files)
2. **Pattern Detection** — Runs 14+ heuristic checks on each file for AI-generated code patterns
3. **Technical Debt Scoring** — Measures complexity, nesting, duplication, file size, and modularization
4. **Cognitive Debt Analysis** — Evaluates naming clarity, comment usefulness, readability, and abstraction consistency
5. **Propagation Graph** — Maps import dependencies and shared-pattern connections between files
6. **Commit Timeline** — Analyzes the last N commits to track debt evolution, detect spikes, and identify contributors
7. **AI-Powered Detection** — Uses LLM-based analysis to verify AI-generated code signals
8. **Recommendations Engine** — Generates step-by-step refactor plans based on detected issues

---

## 🧱 Technical Debt Metrics (Foundation Layer)

Technical Debt (TD) refers to structural and design inefficiencies in code that increase maintenance cost, reduce scalability, and degrade long-term software quality.

### Base Technical Debt Score (TDS)

**Formula**: `TDS = C + N + D + S + M`

| Component | Formula | Description |
|-----------|---------|-------------|
| **Complexity (C)** | `C = 0.30 if CC>15, 0.18 if CC>8, 0 otherwise` | Based on Cyclomatic Complexity (McCabe). Measures independent execution paths. High complexity = harder to test, debug, and more defect-prone |
| **Nesting Depth (N)** | `N = 0.30 if depth>4, 0.18 if depth>3, 0 otherwise` | Measures control flow depth (if, loops). Deep nesting reduces readability and increases bug probability |
| **Duplication (D)** | `D = 0.15 if duplicate_blocks>2, 0 otherwise` | Detects repeated logic blocks. Violates DRY — fixing one bug requires fixing multiple places |
| **Size (S)** | `S = 0.25 if LOC>300, 0.15 if LOC>200, 0 otherwise` | Large files increase navigation difficulty, change risk, and merge conflicts |
| **Modularization (M)** | `M = 0.10 if functions>20, 0 otherwise` | Too many functions indicate poor cohesion and spaghetti structure |

### Advanced Technical Debt Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| **Change Proneness (CP)** | `CP = modifications / total_commits` | How often a file changes. High CP = unstable code, likely design issues |
| **Code Churn (CCN)** | `CCN = lines_added + lines_deleted` | Volume of change. Strong predictor of defects |
| **Temporal Complexity (TC)** | `TC = change_frequency × complexity` | Complex AND frequently changing = dangerous |
| **Defect Density Proxy (DDP)** | `DDP = issues_detected / LOC` | Estimates bug concentration per line of code |
| **Modularity Degradation (MDS)** | `MDS = coupling / cohesion` | High coupling + low cohesion = poor architecture |

### Derived Technical Debt Metrics (Novel)

| Metric | Formula | Description |
|--------|---------|-------------|
| **Debt Propagation Score (DPS)** | `DPS = 0.6·TDS + 0.4·AI_likelihood` | How much a file spreads debt to dependent files |
| **Debt Longevity Index (DLI)** | `DLI = 0.5·TDS + 0.5·CCD` | Predicts how long debt will persist |
| **Dependency Risk Factor (DRF)** | `DRF = 0.4·AES + 0.3·TDS + 0.3·AI_likelihood` | Risk of depending on this file |

### Technical Debt Detection Thresholds

| Check | Threshold | Debt Score |
|-------|-----------|------------|
| Cyclomatic Complexity | >15 | +0.30 |
| Cyclomatic Complexity | >8 | +0.18 |
| Nesting Depth | >4 levels | +0.30 |
| Nesting Depth | >3 levels | +0.18 |
| File Size | >300 LOC | +0.25 |
| File Size | >200 LOC | +0.15 |
| Long Functions | >50 lines | +0.20 per function |
| Duplicate Blocks | >2 duplicates | +0.15 |
| Poor Modularization | >20 functions | +0.10 |

---

## 🧠 Cognitive Debt Metrics

Cognitive Debt (CD) refers to the mental effort required for a developer to understand, reason about, and modify code. It captures how much a codebase deviates from human-friendly comprehension patterns.

### Base Cognitive Debt Score (CDS)

**Formula**: `CDS = 0.25·CCD + 0.20·(1-ES) + 0.20·AES + 0.15·RDI + 0.10·CU + 0.10·FR`

| Component | Formula | Description |
|-----------|---------|-------------|
| **Cognitive Complexity Drift (CCD)** | `CCD = control_flow_keywords / (total_lines × 0.12 + 1)` | Density of control logic. High CCD = too many branches, hard to mentally simulate execution |
| **Explainability Score (ES)** | `ES = avg_identifier_length / 12` | How meaningful variable/function names are. `x, temp, data` → confusing; `calculateFinalGrade` → clear intent |
| **AI Entropy Score (AES)** | `AES = std_dev(line_lengths) / 40` | Structural variation. Low variance = too uniform (AI-like), harder to scan |
| **Readability Degradation (RDI)** | `0.8 if comments>30%, 0.3 if 5-30%, 0.55 if <5%` | Too many comments = noise, too few = lack of guidance. Optimal range: 5–30% |
| **Comment Utility (CU)** | `CU = 1 - obvious_comments / total_comments` | Measures usefulness of comments — penalizes restating code |
| **Function Readability (FR)** | `normalized(length + nesting + naming_clarity)` | Captures function size, structure, and naming quality |

### Advanced Cognitive Debt Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| **Cognitive Load Index (CLI)** | `CLI = nesting + branching + function_length/50` | Mental workload based on Cognitive Load Theory (Sweller) |
| **Identifier Ambiguity (IAS)** | `IAS = unclear_names / total_variables` | High IAS = more guessing, slower comprehension |
| **Abstraction Gap Score (AGS)** | `AGS = |intent_complexity - implementation_complexity|` | Mismatch between what code should do and what it does |
| **Readability Index (RI)** | `normalized(avg_line_length + nesting + naming)` | Overall readability quality. Lower RI = higher cognitive debt |
| **Context Switching Cost (CSC)** | `dependencies + cross_file_references` | How often a developer must jump between files — breaks focus |

### Cognitive Execution Burden (CEB) — Core Novel Metric

**Formula**: `CEB = 0.25·IRD + 0.20·CFSC + 0.20·STL + 0.20·DRC + 0.15·AIC`

This models how much mental effort is needed to simulate code execution in your head.

| Component | Formula | Weight | Description |
|-----------|---------|--------|-------------|
| **Intent Recognition Difficulty (IRD)** | `1 - intent_transparency` | 0.25 | Effort to infer what the code does |
| **Control Flow Simulation Cost (CFSC)** | `branches × nesting / LOC` | 0.20 | Mental effort to trace execution paths |
| **State Tracking Load (STL)** | `mutable_variables × reassignments` | 0.20 | Burden of tracking variable state changes |
| **Dependency Resolution Cost (DRC)** | `external_calls + cross_file_refs` | 0.20 | Effort to resolve dependencies mentally |
| **Abstraction Interpretation Cost (AIC)** | `abstraction_layers / complexity` | 0.15 | Effort to understand abstraction levels |

**Research Backing**: Program comprehension models (Pennington), Cognitive Load Theory (Sweller), Working memory limits.

### Derived Cognitive Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| **Cognitive Debt Propagation** | `CEB × DPS` | Hard-to-understand + widely used = dangerous |
| **Cognitive Debt Persistence** | `CEB × DLI` | Predicts long-term confusion |
| **AI Cognitive Impact (ACI)** | `AES + IAS + AGS` | AI-induced comprehension issues |

---

## 🔄 Dynamic Debt Model (Commit-Based Analysis)

Instead of asking "How bad is the code now?", we ask: "How did the debt evolve, who caused it, and where is it heading?"

### Debt Evolution

**Technical**: `TDS(c) = TDS(c-1) · G + ΔC + ΔD + ΔN`
**Cognitive**: `CDS(c) = CDS(c-1) · G + ΔR + ΔNa + ΔE`
**Growth Factor**: `G = 1 + (net_growth × 0.3)` where `net_growth = (additions - deletions) / total_changes`

### Temporal Behavior Metrics (Novel)

| Metric | Formula | Description |
|--------|---------|-------------|
| **Debt Velocity (DV)** | `DV = (TDS(c) - TDS(c-1)) / Δt` | Speed at which debt increases. High DV = dangerous system |
| **Debt Acceleration (DA)** | `DA = DV(c) - DV(c-1)` | Detects worsening trends — increasing velocity = runaway debt |
| **Spike Detection** | `Spike = TDS(c) - TDS(c-1) > 0.08` | Detects bad commits, AI dump code, poor merges |
| **Debt Momentum** | `avg(DV last 5 commits)` | Recent trend: High = rapid degradation, Low = stable |
| **Cognitive-Temporal Interaction (CTI)** | `CDS × change_frequency` | Hard to understand AND frequently modified = extremely risky |

### Predictive & Developer Analysis

| Metric | Formula | Description |
|--------|---------|-------------|
| **Future Prediction** | `Future_TDS = current_TDS + avg_slope × future_commits` | Projects future system health |
| **Developer Impact** | `Impact(dev) = Σ(ΔTDS + ΔCDS)` | How each developer affects total system debt |
| **Debt Introduction** | `DI(c) = max(0, TDS(c) - TDS(c-1))` | New debt introduced per commit |
| **Debt Reduction** | `DR(c) = max(0, TDS(c-1) - TDS(c))` | Debt removed by refactoring |
| **AI Debt Amplification (ADAF)** | `ADAF_t = descendant_debt(t) / AI_origin_debt` | How AI code impacts future commits |

**Trend Classification**:
- 📈 Increasing: avg_slope > 0.15
- 📉 Improving: avg_slope < -0.10
- ⚠️ Unstable: >3 spikes
- 🔁 Fluctuating: otherwise

---

## 🤖 AI Detection Metrics

### AI Detection Heuristics (14 Checks — Strict Mode)

1. **Generic Naming** — Detects `temp`, `data`, `result`, `item`, `val`, `handler`, `callback`, `args`, `params`, `config`, etc. Threshold: >0.8% of lines
2. **Excessive Comments** — Comment ratio >20% flags AI-generated verbosity
3. **Over-Explained Comments** — Comments that restate code: "// get the value", "// return result"
4. **Duplicate Code Blocks** — Lines repeated 2+ times (strict) with length >12 chars
5. **Similar Function Structures** — Functions stripped of identifiers showing <60% unique patterns
6. **Cross-File Repetition** — 40-80 char chunks found verbatim in other files
7. **Inconsistent Naming** — Mixed camelCase + snake_case in same file
8. **Long Parameter Lists** — Parameters spanning >90 characters
9. **Magic Numbers** — Unexplained numeric literals >2 digits
10. **Missing Error Handling** — Async code without try/catch
11. **Unnecessary Abstraction** — Tiny wrapper functions (<80 chars when minified)
12. **Uniform Line Lengths** — Standard deviation <12 across 20+ lines (AI signature)
13. **Perfectly Sorted Imports** — Import statements in alphabetical order (AI tendency)
14. **Excessive Type Annotations** — >5% of lines with primitive type annotations

### AI Detection Sub-Metrics

| Metric | Abbreviation | Formula | Description |
|--------|-------------|---------|-------------|
| **Structural Uniformity** | SUS | `1 - std_dev(function_structures)` | How similar all functions look (high = AI) |
| **Token Distribution Divergence** | TDD | `KL_divergence(tokens, human_baseline)` | Token usage deviation from human patterns |
| **Pattern Repetition Index** | PRI | `repeated_patterns / total_patterns` | Frequency of repeated logic blocks |
| **Comment Redundancy** | CRS | `obvious_comments / total_comments` | Comments that restate the code |
| **Style Consistency** | SCS | `1 - variance(formatting_features)` | Overly consistent formatting (AI signal) |

### AI-Induced Debt Metrics (Research-Grade)

| Metric | Abbreviation | Formula | Description |
|--------|-------------|---------|-------------|
| **AI Debt Amplification Factor** | ADAF | `total_descendant_debt / original_ai_debt` | How much AI code amplifies debt downstream |
| **Cognitive Trace Divergence** | CTD | `distance(AI_trace, human_trace)` | Deviation from human mental execution trace |
| **Semantic Redundancy Debt** | SRD | `redundant_conditions / total_conditions` | Unnecessary checks introduced by AI |
| **AI Abstraction Misalignment** | AAM | `abstraction_layers / functional_complexity` | Wrong-level abstractions |
| **Intent Obfuscation Score** | IOS | `semantic_entropy(identifiers)` | How hard to infer purpose |
| **Human Mental Model Divergence** | HMMD | `KL(AI_AST_dist, human_AST_dist)` | Structural deviation from human code norms |

### AI Debt Contribution

**Formula**: `AI_signal = AI_Likelihood × StructuralConfidence`

`AI_TD = AI_signal × Final_TD`
`AI_CD = AI_signal × Final_CD`

Display: "AI-generated code contributes X% of total system debt"

---

## 📊 Composite Scores

| Score | Formula | Description |
|-------|---------|-------------|
| **AITDIS** | `0.2×ADAF + 0.15×CTD + 0.15×SRD + 0.15×AAM + 0.15×IOS + 0.1×ADPV + 0.1×HMMD` | AI Technical Debt Impact Score |
| **DCS** | `0.25×IRD + 0.20×CFSC + 0.20×STL + 0.20×DRC + 0.15×AIC` | Developer Cognitive Simulation Score |
| **ACTDI** | `0.4×DCS + 0.3×DPS + 0.2×(DDP+MDS)/2 + 0.1×(1-RI)` | AI Cognitive Technical Debt Index |

---

## 🧠 Debt Model Architecture

The system models debt across 3 layers:

### 1. Structural Layer
- Complexity (C), Nesting (N), Duplication (D), Size (S), Modularization (M)

### 2. Evolutionary Layer
- Change Proneness (CP), Code Churn (CCN), Temporal Complexity (TC), Debt Velocity (DV), Debt Acceleration (DA)

### 3. Propagation Layer (Novel)
- DPS — Debt Spread, DLI — Debt Longevity, DRF — Dependency Risk, ADAF — AI Amplification, CTI — Cognitive-Temporal

**Key Research Statement**: "We model technical and cognitive debt as time-evolving signals over commit history, enabling detection of growth patterns, propagation dynamics, and future risk — something traditional static tools fail to capture."

---

## 🏗️ Architecture

```
┌──────────────┐     ┌────────────────────────┐
│   React App  │────▶│  Lovable Cloud (Edge)  │
│  (Vite/TS)   │     │                        │
│              │     │  analyze-repo/          │
│  Dashboard   │     │  ├── Pattern Detection  │
│  Timeline    │     │  ├── Tech Debt Scoring  │
│  Fix Plan    │     │  ├── Cognitive Analysis │
│  Graph       │     │  └── Propagation Graph  │
│              │     │                        │
│              │     │  analyze-commits/       │
│              │     │  ├── Commit Timeline    │
│              │     │  ├── Spike Detection    │
│              │     │  ├── Developer Impact   │
│              │     │  └── Trend/Prediction   │
│              │     │                        │
│              │     │  ai-detect/             │
│              │     │  └── LLM-based AI code  │
│              │     │      detection (Gemini) │
│              │     │                        │
│              │     │  human-cognitive-model/ │
│              │     │  └── Cognitive pipeline │
│              │     │      via LLM reasoning  │
└──────────────┘     └────────────────────────┘
         │                      │
         │              ┌───────▼──────┐
         └─────────────▶│  Supabase DB │
                        │  (History)   │
                        └──────────────┘
```

---

## 📁 File Structure & Descriptions

### Pages (`src/pages/`)

| File | Purpose |
|------|---------|
| `Index.tsx` | **Home page** — Hero section, repo URL input, feature highlights grid, stats banner, CTA to dashboard |
| `Dashboard.tsx` | **Main analysis page** — 6-tab layout (Overview, Files, Timeline, Fix Plan, Graph, Deep Analysis) with metric cards, charts, and caching |
| `About.tsx` | **About page** — Full metrics documentation with expandable sections for TD, CD, and Dynamic Debt formulas |
| `Auth.tsx` | **Authentication** — Login/signup with email+password |
| `NotFound.tsx` | **404 page** — Fallback for undefined routes |

### Core Components (`src/components/`)

| File | Purpose |
|------|---------|
| `Navbar.tsx` | Top navigation bar with links, auth state, and theme toggle |
| `Footer.tsx` | Site footer with links and branding |
| `AnimatedBackground.tsx` | Animated gradient mesh with mouse-tracking parallax |
| `ThemeToggle.tsx` | Dark/light mode toggle |
| `RepoInput.tsx` | GitHub URL input with validation |
| `Chatbot.tsx` | Floating AI chatbot for metric explanations and solutions |
| `HeroShowcase.tsx` | Auto-rotating hero image carousel |
| `ReviewsSection.tsx` | Testimonial cards grid |

### Dashboard Components (`src/components/`)

| File | Purpose |
|------|---------|
| `MetricCard.tsx` | Animated metric card with AnimatedCounter |
| `ScoreBar.tsx` | Gradient progress bar for 0–1 scores |
| `MetricTooltip.tsx` | Hover tooltip with metric explanations and formulas |
| `InsightsPanel.tsx` | AI debt contribution, most problematic file, debt rankings |
| `FileTable.tsx` | Sortable/filterable file table with expandable debt breakdowns |
| `DebtBreakdown.tsx` | Per-file breakdown: TD, CD, and AI detection metrics with line-by-line layout |
| `CommitTimeline.tsx` | Interactive commit timeline with slider, spike markers, developer leaderboard |
| `PropagationGraph.tsx` | Circular dependency graph with explanation panels |
| `RefactorRecommendations.tsx` | Interactive fix plan checklist with priority lanes and progress tracking |
| `ReportDownload.tsx` | Download analysis as Markdown or JSON |
| `HistoryPanel.tsx` | Previously analyzed repos with favorites |
| `DeveloperCognitiveSimulation.tsx` | AITDIS, DCS, ACTDI composite score visualizations |
| `HumanCognitiveModel.tsx` | LLM-powered 5-stage cognitive analysis pipeline |

### Backend Functions (`supabase/functions/`)

| Function | Description |
|----------|-------------|
| `analyze-repo/` | Main analysis engine — 14 heuristic checks, hybrid TD/CD scoring, propagation graph |
| `analyze-commits/` | Commit timeline engine — debt evolution, spike detection, developer impact, predictions |
| `ai-detect/` | LLM AI detection — sends code to Gemini for signal verification |
| `human-cognitive-model/` | Cognitive pipeline — 5-stage LLM analysis for comprehension debt |
| `chatbot/` | Streaming AI chatbot for metric explanations and code analysis assistance |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts (Bar, Pie, Radar, Area, Heatmap)
- **Backend**: Lovable Cloud (Supabase Edge Functions, Deno)
- **AI**: Lovable AI Gateway (Google Gemini 3 Flash)
- **Database**: PostgreSQL (via Supabase) with Row-Level Security
- **Auth**: Supabase Auth with email/password

---

## 🔬 Research Foundations

- **Cognitive Complexity** — SonarQube's cognitive complexity metric (G. Ann Campbell, SonarSource)
- **Code Churn & Change Proneness** — Nagappan & Ball (ICSE 2005) linking churn to defect density
- **LLM Authorship Attribution** — Structural uniformity and token distribution (DetectGPT, Mitchell et al., ICML 2023)
- **Code Entropy Profiling** — Information-theoretic measures for AI-generated uniformity (Kirchenbauer et al., ICLR 2023)
- **Cognitive Load Theory** — Sweller's cognitive load framework applied to code comprehension
- **Program Comprehension** — Pennington's mental model theory for code understanding
- **Debt Propagation** — Dependency structure matrix analysis with AI-specific propagation vectors

---

## 🔒 Security

- All user data is protected by Row-Level Security (RLS) policies
- Users can only access their own analysis history
- API keys are stored as secrets, never in client code
- GitHub API tokens are server-side only

---

## 📄 License

This project is built with React, Vite, Tailwind CSS, Supabase, and custom analysis services.
