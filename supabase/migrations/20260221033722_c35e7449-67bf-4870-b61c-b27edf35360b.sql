
-- Analysis history table to store per-user repo analyses
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  stars INTEGER DEFAULT 0,
  language TEXT,
  avg_ai_likelihood NUMERIC(4,2) DEFAULT 0,
  avg_technical_debt NUMERIC(4,2) DEFAULT 0,
  avg_cognitive_debt NUMERIC(4,2) DEFAULT 0,
  total_files INTEGER DEFAULT 0,
  high_risk_files INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history"
  ON public.analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON public.analysis_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
  ON public.analysis_history FOR DELETE
  USING (auth.uid() = user_id);
