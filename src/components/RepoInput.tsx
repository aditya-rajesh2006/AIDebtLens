import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Loader2, Search } from "lucide-react";

interface Props {
  onAnalyze: (url: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: Props) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidGitHubUrl = (input: string) => {
    const cleaned = input.replace(/\/$/, '').replace(/\.git$/, '');
    return /github\.com\/[^/]+\/[^/]+/.test(cleaned) ||
    cleaned.split('/').filter(Boolean).length >= 2;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidGitHubUrl(trimmed)) {
      setValidationError("Please enter a valid GitHub URL, e.g. https://github.com/owner/repo");
      return;
    }
    setValidationError(null);
    onAnalyze(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-2">
      <div className={`relative flex items-center rounded-xl border bg-card p-1.5 transition-all focus-within:border-primary/50 ${validationError ? 'border-destructive' : 'border-border'}`}>
        <GitBranch className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => {setUrl(e.target.value);if (validationError) setValidationError(null);}}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono" />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !url.trim()}
          className="gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40 flex-row flex items-center justify-start">

          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </motion.button>
      </div>
      {validationError &&
      <p className="text-xs text-destructive text-center">{validationError}</p>
      }
    </form>);

}