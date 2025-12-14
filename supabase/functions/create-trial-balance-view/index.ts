import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sql = `
      DROP VIEW IF EXISTS vw_trial_balance_per_account CASCADE;

      CREATE VIEW vw_trial_balance_per_account AS
      SELECT 
        gl.account_code,
        coa.account_name,
        coa.account_type,
        gl.date AS entry_date,
        SUM(gl.debit - gl.credit) AS balance
      FROM general_ledger gl
      LEFT JOIN chart_of_accounts coa ON gl.account_code = coa.account_code
      GROUP BY gl.account_code, coa.account_name, coa.account_type, gl.date
      ORDER BY gl.account_code, gl.date;
    `;

    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'View created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
