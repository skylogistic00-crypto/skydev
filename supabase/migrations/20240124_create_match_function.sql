CREATE OR REPLACE FUNCTION match_hs_codes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  hs_code varchar,
  description text,
  category varchar,
  sub_category varchar,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    hc.id,
    hc.hs_code,
    hc.description,
    hc.category,
    hc.sub_category,
    1 - (hce.embedding <=> query_embedding) as similarity
  FROM hs_code_embeddings hce
  JOIN hs_codes hc ON hce.hs_code_id = hc.id
  WHERE 1 - (hce.embedding <=> query_embedding) > match_threshold
  ORDER BY hce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
