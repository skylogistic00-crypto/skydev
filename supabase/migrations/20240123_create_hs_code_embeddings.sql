CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS hs_code_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code_id UUID REFERENCES hs_codes(id) ON DELETE CASCADE,
  embedding vector(1536),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hs_code_embeddings_hs_code_id ON hs_code_embeddings(hs_code_id);
CREATE INDEX idx_hs_code_embeddings_embedding ON hs_code_embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  hs_code_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE hs_code_embeddings;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_history;
