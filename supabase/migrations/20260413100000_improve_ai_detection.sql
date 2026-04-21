-- Enhanced AI detection with confidence calibration

-- Add confidence calibration table
CREATE TABLE public.ai_detection_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_name TEXT NOT NULL,
  weight NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  threshold_low NUMERIC(3,2) DEFAULT 0.30,
  threshold_high NUMERIC(3,2) DEFAULT 0.70,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(signal_name)
);

-- Add detection history for continuous learning
CREATE TABLE public.ai_detection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL,
  detected_probability NUMERIC(3,2) NOT NULL,
  user_confirmed_label TEXT, -- 'ai' or 'human'
  signals JSONB,
  detected_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(code_hash)
);

-- Enable RLS
ALTER TABLE public.ai_detection_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_detection_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read calibration" ON public.ai_detection_calibration FOR SELECT USING (true);
CREATE POLICY "Users can track their detections" ON public.ai_detection_history FOR SELECT TO authenticated USING (true);

-- Insert initial calibration parameters based on empirical analysis
INSERT INTO public.ai_detection_calibration (signal_name, weight, threshold_low, threshold_high, description) VALUES
('structural_uniformity', 0.22, 0.40, 0.70, 'Structural Uniformity Score (SUS) - repetitive function patterns'),
('token_distribution', 0.15, 0.25, 0.60, 'Token Distribution Divergence (TDD) - skewed token usage'),
('pattern_repetition', 0.22, 0.20, 0.65, 'Pattern Repetition Index (PRI) - duplicate code blocks'),
('comment_redundancy', 0.18, 0.30, 0.75, 'Comment Redundancy Score (CRS) - obvious/restating comments'),
('style_consistency', 0.12, 0.50, 0.85, 'Style Consistency Score (SCS) - uniform formatting'),
('identifier_ambiguity', 0.15, 0.25, 0.65, 'Identifier Ambiguity Score (IAS) - generic variable names'),
('code_entropy', 0.10, 0.20, 0.55, 'Code Entropy - low variation in line structure'),
('complexity_simplicity', 0.08, 0.05, 0.35, 'Very low cyclomatic complexity for file size'),
('comment_ratio', 0.12, 0.12, 0.30, 'Excessive comment density (>12-30% of lines)');
