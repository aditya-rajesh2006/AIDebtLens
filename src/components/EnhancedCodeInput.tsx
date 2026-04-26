import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Code2, FileCode2, GitBranch, Loader2, Search, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  onAnalyze: (input: { type: "github" | "upload" | "paste"; data: string; fileName?: string }) => void;
  loading?: boolean;
}

const allowedExtensions = [
  ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".go", ".rs",
  ".cpp", ".c", ".h", ".cs", ".rb", ".php", ".swift", ".kt",
  ".scala", ".vue", ".svelte", ".json", ".xml", ".yaml", ".yml",
  ".sql", ".sh", ".bash", ".html", ".css", ".scss", ".less",
];

export default function EnhancedCodeInput({ onAnalyze, loading }: Props) {
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("github");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const codeStats = useMemo(() => {
    const lines = code ? code.split("\n").length : 0;
    return {
      lines,
      chars: code.length,
      kb: (code.length / 1024).toFixed(1),
    };
  }, [code]);

  const modeMeta = {
    github: {
      icon: GitBranch,
      title: "Repository Scan",
      blurb: "Best for full-system debt detection, propagation mapping, and commit history trends.",
    },
    upload: {
      icon: Upload,
      title: "Single File Review",
      blurb: "Analyze one source file with hybrid AI detection, technical debt, and cognitive debt scoring.",
    },
    paste: {
      icon: Code2,
      title: "Quick Code Probe",
      blurb: "Paste generated snippets, refactors, or suspicious code blocks for a focused interactive scan.",
    },
  } as const;

  const ActiveIcon = modeMeta[activeTab as keyof typeof modeMeta].icon;

  const isValidGitHubUrl = (input: string) => {
    const cleaned = input.replace(/\/$/, "").replace(/\.git$/, "");
    return /github\.com\/[^/]+\/[^/]+/.test(cleaned) || cleaned.split("/").filter(Boolean).length >= 2;
  };

  const handleGitHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidGitHubUrl(trimmed)) {
      setValidationError("Please enter a valid GitHub URL, e.g. https://github.com/owner/repo");
      return;
    }
    setValidationError(null);
    onAnalyze({ type: "github", data: trimmed });
  };

  const processFile = (file: File) => {
    if (file.size > 1024 * 1024) {
      setValidationError("File size must be less than 1MB");
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setValidationError(`File type not supported. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      if (content.length > 100 * 1024) {
        setValidationError("Code size must be less than 100KB");
        return;
      }
      setFileName(file.name);
      setCode(content);
      setValidationError(null);
    };
    reader.onerror = () => setValidationError("Failed to read file");
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (code.length > 100 * 1024) {
      setValidationError("Code size must be less than 100KB");
      return;
    }
    setValidationError(null);
    onAnalyze({
      type: "paste",
      data: code,
      fileName: fileName || "pasted_code",
    });
  };

  const clearUploadedFile = () => {
    setCode("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-primary/40 p-6 dark:bg-gradient-to-br dark:from-primary/10 dark:to-primary/5 bg-gradient-to-br from-blue-50 to-background backdrop-blur-sm">
      <div className="mb-5 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-primary/20 bg-background/60 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <ActiveIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{modeMeta[activeTab as keyof typeof modeMeta].title}</p>
              <p className="text-xs text-muted-foreground">{modeMeta[activeTab as keyof typeof modeMeta].blurb}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background/50 p-3">
          {[
            { label: "Hybrid", value: "AI + heuristics", icon: Sparkles },
            { label: "Debt", value: "Tech + cog", icon: Brain },
            { label: "Mode", value: "Strict", icon: ShieldCheck },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary/30 px-3 py-2">
              <item.icon className="mb-1 h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-[11px] font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 dark:bg-gradient-to-r dark:from-secondary/40 dark:to-secondary/20 bg-gradient-to-r from-slate-200 to-slate-100 border border-border rounded-xl p-1">
          <TabsTrigger value="github" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub URL</span>
            <span className="sm:hidden">GitHub</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">Paste Code</span>
            <span className="sm:hidden">Paste</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github">
          <form onSubmit={handleGitHubSubmit} className="space-y-2">
            <div className={`relative flex items-center rounded-xl border dark:bg-gradient-to-r dark:from-card/80 dark:to-primary/5 bg-white p-1.5 transition-all focus-within:border-primary/50 ${validationError ? "border-destructive" : "dark:border-primary/30 border-primary/40"}`}>
              <GitBranch className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !url.trim()}
                className="gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40 flex items-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analyze
              </motion.button>
            </div>
            {validationError && <p className="text-xs text-destructive">{validationError}</p>}
            <p className="text-xs text-muted-foreground">Analyzes an entire public GitHub repository with debt propagation and timeline support</p>
          </form>
        </TabsContent>

        <TabsContent value="upload">
          <form className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className={`relative rounded-xl border-2 border-dashed transition-all p-6 text-center dark:bg-gradient-to-br dark:from-primary/5 dark:to-background bg-gradient-to-br from-blue-50 to-slate-50 ${validationError ? "border-destructive" : "dark:border-primary/30 border-primary/40 hover:dark:border-primary/50 hover:dark:bg-primary/8 hover:bg-blue-100"} ${isDragging ? "scale-[1.01] border-primary bg-primary/5 shadow-lg shadow-primary/10" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept={allowedExtensions.join(",")}
                className="hidden"
                disabled={loading}
              />

              {!code ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 cursor-pointer w-full disabled:opacity-50"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 1MB | Supports .js, .ts, .py, .java, and more</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <FileCode2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{fileName}</p>
                        <p className="text-xs text-muted-foreground">{codeStats.kb} KB | {codeStats.lines} lines</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearUploadedFile}
                      disabled={loading}
                      className="p-2 hover:bg-destructive/10 rounded-lg disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-left">
                    <div className="rounded-lg bg-background/70 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lines</p>
                      <p className="text-xs font-semibold text-foreground">{codeStats.lines}</p>
                    </div>
                    <div className="rounded-lg bg-background/70 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Chars</p>
                      <p className="text-xs font-semibold text-foreground">{codeStats.chars}</p>
                    </div>
                    <div className="rounded-lg bg-background/70 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</p>
                      <p className="text-xs font-semibold text-foreground">Hybrid</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {code && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onAnalyze({ type: "upload", data: code, fileName });
                }}
                disabled={loading}
                className="w-full gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40 flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analyze File
              </motion.button>
            )}

            {validationError && <p className="text-xs text-destructive">{validationError}</p>}
          </form>
        </TabsContent>

        <TabsContent value="paste">
          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Paste your code here..."
              className="w-full h-40 rounded-lg border dark:border-primary/30 border-primary/40 dark:bg-gradient-to-br dark:from-card/80 dark:to-primary/5 bg-white p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 font-mono resize-none"
            />

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lines</p>
                <p className="text-xs font-semibold text-foreground">{codeStats.lines}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Characters</p>
                <p className="text-xs font-semibold text-foreground">{codeStats.chars}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Readiness</p>
                <p className="text-xs font-semibold text-foreground">{code.trim() ? "Ready to scan" : "Waiting"}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Optional: File name (e.g., component.tsx)"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !code.trim()}
                className="gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40 flex items-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analyze
              </motion.button>
            </div>

            {validationError && <p className="text-xs text-destructive">{validationError}</p>}
            <p className="text-xs text-muted-foreground">Max 100KB | Best for snippets, generated functions, and focused reviews</p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
