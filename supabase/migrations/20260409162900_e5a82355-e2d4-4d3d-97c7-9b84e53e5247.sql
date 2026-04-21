
-- Training samples table: stores labeled code snippets
CREATE TABLE public.training_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL CHECK (label IN ('ai', 'human')),
  filename TEXT,
  language TEXT,
  code TEXT NOT NULL,
  source TEXT, -- 'upload' or 'github'
  source_url TEXT,
  feature_vector JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Model weights table: stores trained model parameters
CREATE TABLE public.model_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'cognitive-classifier',
  weights JSONB NOT NULL,
  feature_names JSONB NOT NULL,
  training_samples_count INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own samples" ON public.training_samples FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own models" ON public.model_weights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
