# 🧠 AI Debt Tracker

**AI Debt Tracker** is a comprehensive code analysis platform that detects, measures, and visualizes AI-induced technical debt in GitHub repositories. It goes beyond traditional static analysis by identifying patterns specific to AI-generated code and tracking how debt propagates across your codebase.

## 🌐 Live App

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

---

## 📖 How It Works

### Analysis Pipeline

1. **Repository Ingestion** — Fetches source files from any public GitHub repo via the GitHub API (up to 40 code files)
2. **Pattern Detection** — Runs 14+ heuristic checks on each file for AI-generated code patterns
3. **Technical Debt Scoring** — Measures complexity, nesting, duplication, file size, and modularization
4. **Cognitive Debt Analysis** — Evaluates naming clarity, comment usefulness, readability, and abstraction consistency
5. **Propagation Graph** — Maps import dependencies and shared-pattern connections between files
6. **Commit Timeline** — Analyzes the last N commits to track debt evolution, detect spikes, and identify contributors
7. **AI-Powered Detection** — Uses Lovable AI (Gemini) to verify AI-generated code signals with LLM-based analysis
8. **Recommendations Engine** — Generates step-by-step refactor plans based on detected issues

---

## 📊 Metrics & Formulas

### Core Metrics

| Metric | Range | Formula | Description |
|--------|-------|---------|-------------|
| **AI Likelihood** | 0–1 | Σ(14 weighted heuristic signals) + 0.08 base | Probability a file was AI-generated |
| **Technical Debt** | 0–1 | complexity + nesting + duplication + file_size + modularization | Code structure quality |
| **Cognitive Debt** | 0–1 | CCD×0.25 + (1-ES)×0.2 + AES×0.2 + RDI×0.15 + comment_utility×0.1 + func_readability×0.1 | How hard the code is to understand |
| **Propagation Score** | 0–1 | DPS (see below) | How widely debt spreads through dependencies |

### Detailed Sub-Metrics

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **Cognitive Complexity Drift** | CCD | control_flow_keywords / (total_lines × 0.12 + 1) | How convoluted the control flow is |
| **Explainability Score** | ES | avg_identifier_length / 12 | How self-explanatory the code naming is |
| **AI Entropy Score** | AES | std_dev(line_lengths) / 40 | Structural variance (low = AI-like uniformity) |
| **Readability Degradation Index** | RDI | f(comment_ratio) — 0.8 if >30%, 0.3 if 5-30%, 0.55 if <5% | Balance of documentation |
| **Debt Propagation Score** | DPS | tech_debt × 0.6 + ai_likelihood × 0.4 | How much this file spreads debt to others |
| **Debt Longevity Index** | DLI | tech_debt × 0.5 + CCD × 0.5 | How persistent the debt is likely to be |
| **Dependency Risk Factor** | DRF | AES × 0.4 + tech_debt × 0.3 + ai_likelihood × 0.3 | Risk from depending on this file |

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

### Technical Debt Detection (Strict Thresholds)

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

### Commit Timeline Formulas

For each commit `c`:

```
TDS(c) = TDS(c-1) × growthFactor + Δcomplexity + Δduplication + Δnesting
CDS(c) = CDS(c-1) × growthFactor + Δreadability + Δnaming + Δentropy
growthFactor = 1 + (net_growth × 0.3)  // where net_growth = (additions - deletions) / total_changes
```

**Spike Detection**: `Spike = TDS(c) - TDS(c-1) > 0.08`

**Future Prediction**: `Future_TDS = current_TDS + avg_slope × future_commits`

**Developer Impact**: `Impact(dev) = Σ(ΔTDS + ΔCDS) for all commits by developer`

**Trend Classification**:
- 📈 Increasing: avg_slope > 0.15
- 📉 Improving: avg_slope < -0.10
- ⚠️ Unstable: >3 spikes
- 🔁 Fluctuating: otherwise

**Momentum**: Rate of recent (last 5 commits) debt growth — `fast` / `slow` / `stable`

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
└──────────────┘     └────────────────────────┘
         │                      │
         │              ┌───────▼──────┐
         └─────────────▶│  Supabase DB │
                        │  (History)   │
                        └──────────────┘
```

### Pages

| Page | Purpose |
|------|---------|
| **Home** (`/`) | Hero, repo input, feature highlights, CTA |
| **Dashboard** (`/dashboard`) | Full analysis with 5 tabs: Overview, Files, Timeline, Fix Plan, Graph |
| **About** (`/about`) | Project info, FAQ accordion, methodology |
| **Auth** (`/auth`) | Login / Signup with email verification |

### Dashboard Tabs

1. **Overview** — Metric cards, refactor priority score, confidence score, top risk files with impact simulator, bar/pie/radar charts, debt heatmap, guided insights
2. **Files** — Sortable/filterable file table with expandable debt breakdowns per file
3. **Timeline** — Commit-by-commit debt evolution with interactive slider, spike markers, developer leaderboard, trend classification, future prediction
4. **Fix Plan** — Step-by-step refactor recommendations with priority levels and impact estimates
5. **Graph** — Propagation graph showing import dependencies and shared-pattern connections

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

## 🚀 Getting Started

### Option 1: Use Lovable (Recommended)

Visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start using it directly.

### Option 2: Local Development

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

Requirements: Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

---

## 🔒 Security

- All user data is protected by Row-Level Security (RLS) policies
- Users can only access their own analysis history
- API keys are stored as secrets, never in client code
- GitHub API tokens are server-side only

---

## 📄 License

This project is built with [Lovable](https://lovable.dev).
