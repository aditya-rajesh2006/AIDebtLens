import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Star, Trash2, ExternalLink, TrendingUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HistoryItem {
  id: string;
  repo_url: string;
  repo_name: string;
  stars: number;
  language: string | null;
  avg_ai_likelihood: number;
  avg_technical_debt: number;
  avg_cognitive_debt: number;
  total_files: number;
  high_risk_files: number;
  is_favorite: boolean;
  created_at: string;
}

interface Props {
  onSelectRepo: (url: string) => void;
}

type SortBy = "recent" | "debt";

export default function HistoryPanel({ onSelectRepo }: Props) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as HistoryItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from("analysis_history").update({ is_favorite: !current }).eq("id", id);
    setHistory(h => h.map(item => item.id === id ? { ...item, is_favorite: !current } : item));
  };

  const deleteItem = async (id: string) => {
    await supabase.from("analysis_history").delete().eq("id", id);
    setHistory(h => h.filter(item => item.id !== id));
  };

  const sorted = [...history].sort((a, b) => {
    if (sortBy === "debt") {
      return (Number(b.avg_technical_debt) + Number(b.avg_cognitive_debt)) - (Number(a.avg_technical_debt) + Number(a.avg_cognitive_debt));
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Favorites first
  const items = [...sorted.filter(i => i.is_favorite), ...sorted.filter(i => !i.is_favorite)];

  if (!user) return null;

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">History</h3>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
        >
          <option value="recent">Recent</option>
          <option value="debt">Highest Debt</option>
        </select>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {loading && (
          <div className="p-6 text-center text-xs text-muted-foreground">Loading...</div>
        )}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">No analyses yet. Try analyzing a repo!</div>
        )}
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.03 }}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer"
              onClick={() => onSelectRepo(item.repo_url)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-foreground truncate">{item.repo_name}</span>
                  {item.language && (
                    <span className="text-[10px] text-muted-foreground">{item.language}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>AI: <strong className="text-primary">{Math.round(Number(item.avg_ai_likelihood) * 100)}%</strong></span>
                  <span>Tech: <strong className="text-accent">{Math.round(Number(item.avg_technical_debt) * 100)}%</strong></span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.is_favorite); }}
                  className="p-1 rounded hover:bg-secondary"
                >
                  <Star className={`h-3 w-3 ${item.is_favorite ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="p-1 rounded hover:bg-destructive/20"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
