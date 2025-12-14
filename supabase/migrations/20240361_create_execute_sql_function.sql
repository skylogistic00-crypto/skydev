-- Create execute_sql function for AI query execution
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query and return results as JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
  
  -- Return empty array if no results
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution error: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION execute_sql IS 'Execute dynamic SQL queries for AI-generated queries. Returns results as JSONB array.';
