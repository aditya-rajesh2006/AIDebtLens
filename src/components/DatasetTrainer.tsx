import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Upload, Play, FileCode, BarChart3, Database,
  Loader2, CheckCircle2, AlertTriangle, X, Github, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StarterDatasets from "./StarterDatasets";

interface ModelStats {
  total_samples: number;
  ai_samples: number;
  human_samples: number;
  model_trained: boolean;
  model_accuracy: number | null;
  last_trained: string | null;
}

interface TrainResult {
  accuracy: number;
  samples_used: number;
  ai_samples: number;
  human_samples: number;
  feature_importance: { feature: string; weight: number; importance: number }[];
}

export default function DatasetTrainer() {
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteCode, setPasteCode] = useState("");
  const [pasteLabel, setPasteLabel] = useState<"ai" | "human">("ai");
  const [pasteFilename, setPasteFilename] = useState("");
  const [pasteLanguage, setPasteLanguage] = useState("typescript");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLabel, setGithubLabel] = useState<"ai" | "human">("human");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Please sign in to use the training system"); return; }

      const { data, error: fnError } = await supabase.functions.invoke("train-cognitive-model", {
        body: { action: "stats" },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch stats");
    }
  }, []);

  // Auto-fetch stats on mount
  useState(() => { fetchStats(); });

  const addSamples = async (samples: { code: string; label: string; filename?: string; language?: string; source?: string; source_url?: string }[]) => {
    setLoading("adding");
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in");

      const { data, error: fnError } = await supabase.functions.invoke("train-cognitive-model", {
        body: { action: "add-samples", samples },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Samples added", description: `${data.inserted} code samples added to your dataset.` });
      fetchStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add samples";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteCode.trim()) return;
    addSamples([{
      code: pasteCode,
      label: pasteLabel,
      filename: pasteFilename || "pasted-code",
      language: pasteLanguage,
      source: "upload",
    }]);
    setPasteCode("");
    setPasteFilename("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const samples: { code: string; label: string; filename: string; language: string; source: string }[] = [];
    for (const file of Array.from(files)) {
      const code = await file.text();
      const ext = file.name.split('.').pop() || 'txt';
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c',
      };
      samples.push({
        code,
        label: pasteLabel,
        filename: file.name,
        language: langMap[ext] || ext,
        source: "upload",
      });
    }
    if (samples.length > 0) addSamples(samples);
    e.target.value = "";
  };

  const handleGithubFetch = async () => {
    if (!githubUrl.trim()) return;
    setLoading("github");
    setError(null);
    try {
      // Parse owner/repo from URL
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("Invalid GitHub URL");
      const [, owner, repo] = match;

      const GITHUB_TOKEN = undefined; // Fetched via edge function
      const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };

      // Fetch repo tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
      if (!treeRes.ok) throw new Error("Failed to fetch repo. Check URL and make sure it's public.");
      const tree = await treeRes.json();

      const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'rb'];
      const codeFiles = (tree.tree || [])
        .filter((f: any) => f.type === 'blob' && codeExts.some(ext => f.path.endsWith(`.${ext}`)))
        .slice(0, 20); // Cap at 20 files

      if (codeFiles.length === 0) throw new Error("No code files found in repository.");

      const samples: { code: string; label: string; filename: string; language: string; source: string; source_url: string }[] = [];

      for (const file of codeFiles) {
        try {
          const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, { headers });
          if (!contentRes.ok) continue;
          const contentData = await contentRes.json();
          if (contentData.encoding === 'base64' && contentData.content) {
            const code = atob(contentData.content.replace(/\n/g, ''));
            if (code.length > 100 && code.length < 50000) {
              const ext = file.path.split('.').pop() || '';
              const langMap: Record<string, string> = {
                ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
                py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c', rb: 'ruby',
              };
              samples.push({
                code,
                label: githubLabel,
                filename: file.path,
                language: langMap[ext] || ext,
                source: "github",
                source_url: `https://github.com/${owner}/${repo}/blob/HEAD/${file.path}`,
              });
            }
          }
        } catch { /* skip individual file errors */ }
      }

      if (samples.length === 0) throw new Error("Could not extract any code files.");
      await addSamples(samples);
      setGithubUrl("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch from GitHub";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const trainModel = async () => {
    setLoading("training");
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("train-cognitive-model", {
        body: { action: "train" },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setTrainResult(data);
      toast({ title: "Model trained!", description: `Accuracy: ${data.accuracy}% on ${data.samples_used} samples` });
      fetchStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Training failed";
      setError(msg);
      toast({ title: "Training failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Custom Cognitive Model — Dataset & Training
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Feed your model with labeled AI-generated and human-written code samples, then train a lightweight classifier that runs independently — no external AI API required for predictions.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard label="AI Samples" value={stats.ai_samples} icon={Sparkles} color="text-destructive" />
          <StatCard label="Human Samples" value={stats.human_samples} icon={FileCode} color="text-neon-green" />
          <StatCard label="Total" value={stats.total_samples} icon={Database} color="text-primary" />
          <StatCard
            label="Accuracy"
            value={stats.model_trained ? `${stats.model_accuracy}%` : "—"}
            icon={BarChart3}
            color={stats.model_accuracy && stats.model_accuracy > 80 ? "text-neon-green" : "text-accent"}
          />
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <button onClick={() => setError(null)}><X className="h-4 w-4 text-destructive/60" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Starter Datasets */}
      <StarterDatasets onSamplesAdded={fetchStats} />

      {/* Add Samples Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Paste Code */}
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 space-y-4">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Upload className="h-3.5 w-3.5" /> Paste / Upload Code
          </h4>
          <div className="flex gap-2">
            <LabelToggle label={pasteLabel} setLabel={setPasteLabel} />
            <input
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
              placeholder="Filename (optional)"
              value={pasteFilename}
              onChange={e => setPasteFilename(e.target.value)}
            />
            <select
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
              value={pasteLanguage}
              onChange={e => setPasteLanguage(e.target.value)}
            >
              {['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'cpp', 'c', 'ruby'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <textarea
            className="w-full h-40 rounded-lg border border-border bg-background p-3 text-xs font-mono resize-none focus:ring-1 focus:ring-primary"
            placeholder="Paste code here..."
            value={pasteCode}
            onChange={e => setPasteCode(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteCode.trim() || loading === "adding"}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading === "adding" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Sample"}
            </button>
            <input ref={fileInputRef} type="file" multiple accept=".ts,.tsx,.js,.jsx,.py,.java,.go,.rs,.cpp,.c,.rb" className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading === "adding"}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-secondary/30 transition-colors"
            >
              Upload Files
            </button>
          </div>
        </div>

        {/* GitHub Import */}
        <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 space-y-4">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Github className="h-3.5 w-3.5" /> Import from GitHub
          </h4>
          <p className="text-[10px] text-muted-foreground">
            Import code files from a public GitHub repo. Up to 20 files will be extracted.
          </p>
          <div className="flex gap-2">
            <LabelToggle label={githubLabel} setLabel={setGithubLabel} />
          </div>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
          />
          <button
            onClick={handleGithubFetch}
            disabled={!githubUrl.trim() || loading === "github"}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading === "github" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Github className="h-3 w-3" />}
            Fetch & Add
          </button>
        </div>
      </div>

      {/* Train Button */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-6 text-center space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Train Your Model</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Requires at least 10 samples (3+ per class). More data = better accuracy. The model uses logistic regression over a 16-dimensional feature vector.
        </p>
        <button
          onClick={trainModel}
          disabled={loading === "training" || (stats && stats.total_samples < 10)}
          className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {loading === "training" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Training...</>
          ) : (
            <><Play className="h-4 w-4" /> Train Model</>
          )}
        </button>
        {stats && stats.total_samples < 10 && (
          <p className="text-[10px] text-destructive">Need {10 - stats.total_samples} more samples</p>
        )}
      </div>

      {/* Training Results */}
      <AnimatePresence>
        {trainResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-neon-green" />
                <h4 className="text-sm font-semibold text-foreground">Training Complete</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-black font-mono text-neon-green">{trainResult.accuracy}%</p>
                  <p className="text-[10px] text-muted-foreground">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black font-mono text-foreground">{trainResult.samples_used}</p>
                  <p className="text-[10px] text-muted-foreground">Samples</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-mono text-foreground">
                    <span className="text-destructive">{trainResult.ai_samples}</span>
                    {" / "}
                    <span className="text-neon-green">{trainResult.human_samples}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">AI / Human</p>
                </div>
              </div>

              {/* Feature Importance */}
              <div>
                <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Feature Importance</p>
                <div className="space-y-1.5">
                  {trainResult.feature_importance.slice(0, 8).map((f, i) => (
                    <div key={f.feature} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-40 truncate">{f.feature}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${f.weight > 0 ? 'bg-destructive' : 'bg-neon-green'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(f.importance / (trainResult.feature_importance[0]?.importance || 1) * 100, 100)}%` }}
                          transition={{ delay: i * 0.05 }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono w-12 text-right ${f.weight > 0 ? 'text-destructive' : 'text-neon-green'}`}>
                        {f.weight > 0 ? '+' : ''}{f.weight}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-muted-foreground mt-2">
                  <span className="text-destructive">Red</span> = correlates with AI code, <span className="text-neon-green">Green</span> = correlates with human code
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function LabelToggle({ label, setLabel }: { label: "ai" | "human"; setLabel: (l: "ai" | "human") => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setLabel("ai")}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${label === "ai" ? "bg-destructive text-destructive-foreground" : "bg-background text-muted-foreground hover:bg-secondary/30"}`}
      >
        AI
      </button>
      <button
        onClick={() => setLabel("human")}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${label === "human" ? "bg-neon-green text-black" : "bg-background text-muted-foreground hover:bg-secondary/30"}`}
      >
        Human
      </button>
    </div>
  );
}
