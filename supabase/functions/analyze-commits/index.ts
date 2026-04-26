import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";

async function fetchGH(url: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AIDebtTracker'
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

function parseOwnerRepo(input: string): { owner: string; repo: string } {
  const cleaned = input.replace(/\/$/, '').replace(/\.git$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) return { owner: match[1], repo: match[2] };
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 2) return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
  throw new Error('Invalid repository URL');
}

// Quick heuristic debt scoring for a single file's patch/diff
function scorePatch(patch: string): { techDelta: number; cogDelta: number; aiDelta: number } {
  const addedLines = patch.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  const removedLines = patch.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
  const added = addedLines.join('\n');
  const removed = removedLines.join('\n');

  let techDelta = 0;
  let cogDelta = 0;
  let aiDelta = 0;

  // Nesting increase
  const addedBraces = (added.match(/{/g) || []).length;
  const removedBraces = (removed.match(/{/g) || []).length;
  if (addedBraces > removedBraces + 3) techDelta += 0.15;

  // Complexity increase
  const addedBranches = (added.match(/\b(if|else|for|while|switch|catch|&&|\|\|)\b/g) || []).length;
  const removedBranches = (removed.match(/\b(if|else|for|while|switch|catch|&&|\|\|)\b/g) || []).length;
  techDelta += Math.max(0, (addedBranches - removedBranches) * 0.02);

  // File size increase
  const netLines = addedLines.length - removedLines.length;
  if (netLines > 50) techDelta += 0.1;
  if (netLines > 100) techDelta += 0.15;

  // Duplicate patterns
  const addedTrimmed = addedLines.map(l => l.slice(1).trim()).filter(l => l.length > 20);
  const freq = new Map<string, number>();
  for (const l of addedTrimmed) freq.set(l, (freq.get(l) || 0) + 1);
  const dupes = [...freq.values()].filter(v => v >= 3).length;
  if (dupes > 0) { techDelta += 0.1; aiDelta += 0.12; }

  // Generic naming
  const genericNames = (added.match(/\b(temp|data|result|value|item|obj|val|ret|tmp|output|input|foo|bar)\b/g) || []).length;
  if (genericNames > 5) { cogDelta += 0.1; aiDelta += 0.08; }

  // Over-explained comments
  const comments = addedLines.filter(l => l.match(/^\+\s*(\/\/|#|\*)/));
  if (comments.length > addedLines.length * 0.3) { cogDelta += 0.1; aiDelta += 0.1; }

  // Magic numbers
  const magics = (added.match(/(?<![.\w])\d{2,}(?![.\w])/g) || []).length;
  if (magics > 3) techDelta += 0.05;

  // Missing error handling
  const hasAsync = added.includes('async') || added.includes('await');
  const hasTryCatch = added.includes('try') && added.includes('catch');
  if (hasAsync && !hasTryCatch) techDelta += 0.08;

  return {
    techDelta: Math.min(techDelta, 1),
    cogDelta: Math.min(cogDelta, 1),
    aiDelta: Math.min(aiDelta, 1),
  };
}

interface CommitAnalysis {
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
  growthFactor: number;
  debtVelocity: number;
  debtAcceleration: number;
  cognitiveTemporalInteraction: number;
  debtIntroduction: number;
  debtReduction: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { repoUrl, commitCount = 15 } = await req.json();
    if (!repoUrl) throw new Error('repoUrl is required');

    const { owner, repo } = parseOwnerRepo(repoUrl);
    const count = Math.min(commitCount, 30);

    // Fetch recent commits
    const commits = await fetchGH(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${count}`
    );

    const analyses: CommitAnalysis[] = [];
    let runningTech = 0.1;
    let runningCog = 0.1;
    let runningAi = 0.05;

    // Process commits oldest-first for accumulation
    const orderedCommits = [...commits].reverse();

    for (const commit of orderedCommits) {
      let techDelta = 0;
      let cogDelta = 0;
      let aiDelta = 0;
      let filesChanged = 0;
      let additions = 0;
      let deletions = 0;
      let growthFactor = 1;

      try {
        const detail = await fetchGH(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`
        );
        filesChanged = detail.files?.length || 0;
        additions = detail.stats?.additions || 0;
        deletions = detail.stats?.deletions || 0;

        for (const file of (detail.files || []).slice(0, 10)) {
          if (file.patch) {
            const scores = scorePatch(file.patch);
            techDelta += scores.techDelta;
            cogDelta += scores.cogDelta;
            aiDelta += scores.aiDelta;
          }
        }

        // Normalize by files
        if (filesChanged > 0) {
          techDelta = techDelta / Math.max(filesChanged, 1);
          cogDelta = cogDelta / Math.max(filesChanged, 1);
          aiDelta = aiDelta / Math.max(filesChanged, 1);
        }

        // Accumulate - debt grows but can also improve if deletions > additions
        const netGrowth = (additions - deletions) / Math.max(additions + deletions, 1);
        growthFactor = netGrowth > 0 ? 1 + netGrowth * 0.3 : 1 + netGrowth * 0.1;

        runningTech = Math.min(Math.max(runningTech * growthFactor + techDelta, 0), 1);
        runningCog = Math.min(Math.max(runningCog * growthFactor + cogDelta, 0), 1);
        runningAi = Math.min(Math.max(runningAi + aiDelta * 0.5, 0), 1);
      } catch { /* skip commit */ }

      const prev = analyses[analyses.length - 1];
      const debtIntroduction = prev ? Math.max(0, runningTech - prev.techDebt) : Math.max(0, runningTech - 0.1);
      const debtReduction = prev ? Math.max(0, prev.techDebt - runningTech) : 0;
      const debtVelocity = prev ? ((runningTech + runningCog) - (prev.techDebt + prev.cogDebt)) : 0;
      const priorVelocity = analyses.length > 1 ? analyses[analyses.length - 1].debtVelocity : 0;
      const debtAcceleration = debtVelocity - priorVelocity;
      const cognitiveTemporalInteraction = Math.min(runningCog * ((filesChanged / 10) + Math.max(additions - deletions, 0) / 200), 1);

      analyses.push({
        sha: commit.sha.slice(0, 7),
        message: (commit.commit?.message || "").split('\n')[0].slice(0, 80),
        author: commit.commit?.author?.name || commit.author?.login || "unknown",
        date: commit.commit?.author?.date || "",
        techDebt: Math.round(runningTech * 100) / 100,
        cogDebt: Math.round(runningCog * 100) / 100,
        aiContribution: Math.round(runningAi * 100) / 100,
        filesChanged,
        additions,
        deletions,
        isSpike: false,
        growthFactor: Math.round(growthFactor * 100) / 100,
        debtVelocity: Math.round(debtVelocity * 100) / 100,
        debtAcceleration: Math.round(debtAcceleration * 100) / 100,
        cognitiveTemporalInteraction: Math.round(cognitiveTemporalInteraction * 100) / 100,
        debtIntroduction: Math.round(debtIntroduction * 100) / 100,
        debtReduction: Math.round(debtReduction * 100) / 100,
      });
    }

    // Detect spikes (>20% jump in techDebt or cogDebt)
    const spikeThreshold = 0.08;
    for (let i = 1; i < analyses.length; i++) {
      const techJump = analyses[i].techDebt - analyses[i - 1].techDebt;
      const cogJump = analyses[i].cogDebt - analyses[i - 1].cogDebt;
      if (techJump > spikeThreshold || cogJump > spikeThreshold) {
        analyses[i].isSpike = true;
      }
    }

    // Developer impact
    const devImpact = new Map<string, { techImpact: number; cogImpact: number; commits: number }>();
    for (let i = 1; i < analyses.length; i++) {
      const author = analyses[i].author;
      const existing = devImpact.get(author) || { techImpact: 0, cogImpact: 0, commits: 0 };
      existing.techImpact += analyses[i].techDebt - analyses[i - 1].techDebt;
      existing.cogImpact += analyses[i].cogDebt - analyses[i - 1].cogDebt;
      existing.commits += 1;
      devImpact.set(author, existing);
    }

    const developers = [...devImpact.entries()]
      .map(([name, d]) => ({
        name,
        techImpact: Math.round(d.techImpact * 100) / 100,
        cogImpact: Math.round(d.cogImpact * 100) / 100,
        commits: d.commits,
        totalImpact: Math.round((d.techImpact + d.cogImpact) * 100) / 100,
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact);

    // Trend classification
    const first = analyses[0];
    const last = analyses[analyses.length - 1];
    const techSlope = last.techDebt - first.techDebt;
    const cogSlope = last.cogDebt - first.cogDebt;
    const avgSlope = (techSlope + cogSlope) / 2;
    const spikeCount = analyses.filter(a => a.isSpike).length;

    let trend: string;
    if (avgSlope > 0.15) trend = "increasing";
    else if (avgSlope < -0.1) trend = "improving";
    else if (spikeCount > 3) trend = "unstable";
    else trend = "fluctuating";

    // Momentum
    const recentSlice = analyses.slice(-5);
    const recentSlope = recentSlice.length > 1
      ? (recentSlice[recentSlice.length - 1].techDebt - recentSlice[0].techDebt) / recentSlice.length
      : 0;
    const momentum = recentSlope > 0.05 ? "fast" : recentSlope > 0 ? "slow" : "stable";
    
    // Calculate meaningful DV (Debt Velocity) - rate of change in debt
    // Ensure non-zero value by scaling appropriately
    const debtVelocityValues = analyses.length > 1
      ? analyses.slice(1).map(c => Math.abs(c.debtVelocity))
      : [];
    const maxVelocity = debtVelocityValues.length > 0 ? Math.max(...debtVelocityValues) : 0;
    const avgAbsVelocity = debtVelocityValues.length > 0 
      ? debtVelocityValues.reduce((sum, v) => sum + v, 0) / debtVelocityValues.length 
      : 0;
    // Scale to 15-85% range for visibility
    const averageDebtVelocity = Math.min(0.15 + (avgAbsVelocity * 0.7), 0.85);
    
    // Calculate meaningful DA (Debt Acceleration) - rate of change in velocity
    // Higher acceleration = more unstable/volatile
    const accelValues = analyses.length > 2
      ? analyses.slice(2).map(c => Math.abs(c.debtAcceleration))
      : [];
    const avgAbsAccel = accelValues.length > 0
      ? accelValues.reduce((sum, a) => sum + a, 0) / accelValues.length
      : 0;
    // Scale volatility to 10-80% range
    const averageDebtAcceleration = Math.min(0.10 + (avgAbsAccel * 0.8), 0.80);

    // Future prediction (linear extrapolation)
    const prediction = {
      techDebt5: Math.round(Math.min(Math.max(last.techDebt + techSlope * 0.5, 0), 1) * 100) / 100,
      techDebt10: Math.round(Math.min(Math.max(last.techDebt + techSlope, 0), 1) * 100) / 100,
      cogDebt5: Math.round(Math.min(Math.max(last.cogDebt + cogSlope * 0.5, 0), 1) * 100) / 100,
      cogDebt10: Math.round(Math.min(Math.max(last.cogDebt + cogSlope, 0), 1) * 100) / 100,
    };

    return new Response(JSON.stringify({
      commits: analyses,
      developers,
      trend,
      momentum,
      prediction,
      spikeCount,
      averageDebtVelocity: Math.round(averageDebtVelocity * 100) / 100,
      averageDebtAcceleration: Math.round(averageDebtAcceleration * 100) / 100,
      trendClassification: trend,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
