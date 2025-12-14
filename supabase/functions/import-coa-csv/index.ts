import { corsHeaders } from "@shared/cors.ts";

interface COARecord {
  account_code: string;
  account_name: string;
  account_type: string;
  level: number;
  is_header: boolean;
  normal_balance: string;
  description: string;
  is_active: boolean;
  kategori_layanan: string;
  jenis_layanan: string;
  balance: number;
  current_balance: number;
  created_by: string;
  trans_type: string;
  flow_type: string;
  usage_role: string;
  parent_code: string;
  status: string;
}

interface ImportCOARequest {
  csv_data: COARecord[];
}

async function runSqlQuery(query: string): Promise<any> {
  const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
  const PICA_SUPABASE_CONNECTION_KEY = Deno.env.get("PICA_SUPABASE_CONNECTION_KEY");
  const SUPABASE_PROJECT_ID = Deno.env.get("SUPABASE_PROJECT_ID");

  if (!PICA_SECRET_KEY || !PICA_SUPABASE_CONNECTION_KEY || !SUPABASE_PROJECT_ID) {
    throw new Error("Missing required environment variables");
  }

  const url = `https://api.picaos.com/v1/passthrough/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-pica-secret": PICA_SECRET_KEY,
      "x-pica-connection-key": PICA_SUPABASE_CONNECTION_KEY,
      "x-pica-action-id": "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (response.status !== 200 && response.status !== 201) {
    const errorText = await response.text();
    throw new Error(`Failed to run sql query: ${errorText}`);
  }

  return response.json();
}

function cleanAndValidateRecord(row: any): COARecord | null {
  if (!row.account_code || !row.account_name) {
    return null;
  }

  return {
    account_code: String(row.account_code || "").trim(),
    account_name: String(row.account_name || "").trim(),
    account_type: String(row.account_type || "").trim(),
    level: Number(row.level) || 0,
    is_header: row.is_header === "true" || row.is_header === true || row.is_header === "1",
    normal_balance: String(row.normal_balance || "Debit").trim(),
    description: String(row.description || "").trim(),
    is_active: row.is_active !== "false" && row.is_active !== false && row.is_active !== "0",
    kategori_layanan: String(row.kategori_layanan || "").trim(),
    jenis_layanan: String(row.jenis_layanan || "").trim(),
    balance: Number(row.balance) || 0,
    current_balance: Number(row.current_balance) || 0,
    created_by: String(row.created_by || "").trim(),
    trans_type: String(row.trans_type || "").trim(),
    flow_type: String(row.flow_type || "non_cash").trim(),
    usage_role: String(row.usage_role || "general").trim(),
    parent_code: String(row.parent_code || "").trim(),
    status: String(row.status || "active").trim(),
  };
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: ImportCOARequest = await req.json();

    if (!payload.csv_data || payload.csv_data.length === 0) {
      throw new Error("No CSV data provided");
    }

    console.log(`Processing ${payload.csv_data.length} records...`);

    // Step 1: Create or reset temp_coa_import table
    console.log("Step 1: Creating temp_coa_import table...");
    await runSqlQuery(`
      DROP TABLE IF EXISTS temp_coa_import;
      CREATE TABLE temp_coa_import (
        account_code text,
        account_name text,
        account_type text,
        level int,
        is_header boolean,
        normal_balance text,
        description text,
        is_active boolean,
        kategori_layanan text,
        jenis_layanan text,
        balance numeric,
        current_balance numeric,
        created_by text,
        trans_type text,
        flow_type text,
        usage_role text,
        parent_code text,
        status text
      );
    `);

    // Step 2 & 3: Clean CSV data and insert into temp_coa_import
    console.log("Step 2 & 3: Cleaning and inserting data...");
    const cleanedRecords: COARecord[] = [];
    const skippedRows: number[] = [];

    payload.csv_data.forEach((row, index) => {
      const cleaned = cleanAndValidateRecord(row);
      if (cleaned) {
        cleanedRecords.push(cleaned);
      } else {
        skippedRows.push(index + 1);
      }
    });

    if (cleanedRecords.length === 0) {
      throw new Error("No valid records found after cleaning");
    }

    // Insert in batches of 100 to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < cleanedRecords.length; i += batchSize) {
      const batch = cleanedRecords.slice(i, i + batchSize);
      
      const values = batch.map((record) => {
        return `(
          '${escapeSQL(record.account_code)}',
          '${escapeSQL(record.account_name)}',
          '${escapeSQL(record.account_type)}',
          ${record.level},
          ${record.is_header},
          '${escapeSQL(record.normal_balance)}',
          '${escapeSQL(record.description)}',
          ${record.is_active},
          '${escapeSQL(record.kategori_layanan)}',
          '${escapeSQL(record.jenis_layanan)}',
          ${record.balance},
          ${record.current_balance},
          '${escapeSQL(record.created_by)}',
          '${escapeSQL(record.trans_type)}',
          '${escapeSQL(record.flow_type)}',
          '${escapeSQL(record.usage_role)}',
          '${escapeSQL(record.parent_code)}',
          '${escapeSQL(record.status)}'
        )`;
      }).join(",\n");

      await runSqlQuery(`
        INSERT INTO temp_coa_import (
          account_code, account_name, account_type, level, is_header, normal_balance,
          description, is_active, kategori_layanan, jenis_layanan, balance, current_balance,
          created_by, trans_type, flow_type, usage_role, parent_code, status
        ) VALUES ${values};
      `);

      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cleanedRecords.length / batchSize)}`);
    }

    // Step 4: UPSERT into chart_of_accounts
    console.log("Step 4: Running UPSERT into chart_of_accounts...");
    await runSqlQuery(`
      INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, level, is_header, normal_balance,
        description, is_active, kategori_layanan, jenis_layanan, balance, current_balance,
        created_by, trans_type, flow_type, usage_role, parent_code, status
      )
      SELECT DISTINCT ON (account_code)
        account_code,
        account_name,
        CASE
          WHEN LOWER(account_type) LIKE '%aset%' THEN 'asset'
          WHEN LOWER(account_type) LIKE '%kewajiban%' THEN 'liability'
          WHEN LOWER(account_type) LIKE '%ekuitas%' THEN 'equity'
          WHEN LOWER(account_type) LIKE '%pendapatan%' THEN 'revenue'
          WHEN LOWER(account_type) LIKE '%beban%' THEN 'expense'
          ELSE 'other'
        END AS account_type,
        COALESCE(level, 0),
        COALESCE(is_header, false),
        normal_balance,
        description,
        COALESCE(is_active, true),
        kategori_layanan,
        jenis_layanan,
        COALESCE(balance, 0),
        COALESCE(current_balance, 0),
        created_by,
        trans_type,
        COALESCE(flow_type, 'non_cash'),
        COALESCE(usage_role, 'general'),
        parent_code,
        COALESCE(status, 'active')
      FROM temp_coa_import
      ON CONFLICT (account_code)
      DO UPDATE SET
        account_name = EXCLUDED.account_name,
        account_type = EXCLUDED.account_type,
        level = EXCLUDED.level,
        is_header = EXCLUDED.is_header,
        normal_balance = EXCLUDED.normal_balance,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        kategori_layanan = EXCLUDED.kategori_layanan,
        jenis_layanan = EXCLUDED.jenis_layanan,
        balance = EXCLUDED.balance,
        current_balance = EXCLUDED.current_balance,
        created_by = EXCLUDED.created_by,
        trans_type = EXCLUDED.trans_type,
        flow_type = EXCLUDED.flow_type,
        usage_role = EXCLUDED.usage_role,
        parent_code = EXCLUDED.parent_code,
        status = EXCLUDED.status;
    `);

    // Step 5: Get count of rows in chart_of_accounts
    console.log("Step 5: Getting row count...");
    const countResult = await runSqlQuery("SELECT COUNT(*) AS total_rows FROM chart_of_accounts;");

    // Clean up temp table
    await runSqlQuery("DROP TABLE IF EXISTS temp_coa_import;");

    const totalRows = countResult?.[0]?.total_rows || countResult?.total_rows || "unknown";

    return new Response(
      JSON.stringify({
        success: true,
        message: "COA import completed successfully",
        records_processed: cleanedRecords.length,
        records_skipped: skippedRows.length,
        skipped_row_numbers: skippedRows.slice(0, 20),
        total_coa_rows: totalRows,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
