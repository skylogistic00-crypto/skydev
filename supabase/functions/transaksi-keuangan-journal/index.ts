import { corsHeaders } from "@shared/cors.ts";

type TransactionType = 'Penerimaan' | 'Pengeluaran';

interface TransaksiKeuanganRequest {
  action: 'fetch_kas_bank_accounts' | 'fetch_lawan_accounts' | 'create_journal';
  // For fetch_lawan_accounts
  account_type?: string;
  // For create_journal
  transaction_type?: TransactionType;
  kas_bank_account_id?: string;
  lawan_account_id?: string;
  lawan_account_type?: string;
  nominal?: number;
  description?: string;
  date?: string;
}

interface COAAccount {
  id: string;
  account_name: string;
  account_type: string;
  account_code?: string;
}

const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY") ?? "";
const PICA_SUPABASE_CONNECTION_KEY = Deno.env.get("PICA_OPENAI_CONNECTION_KEY") ?? "";
const SUPABASE_PROJECT_ID = Deno.env.get("SUPABASE_PROJECT_ID") ?? "";

const allowedAccountTypes: Record<TransactionType, string[]> = {
  Penerimaan: ['Pendapatan', 'Aset', 'Kewajiban', 'Ekuitas'],
  Pengeluaran: ['Beban', 'Beban Operasional', 'Beban Pokok Penjualan', 'Aset', 'Kewajiban', 'Ekuitas']
};

function checkAccountType(transactionType: TransactionType, accountType: string): void {
  const allowed = allowedAccountTypes[transactionType];
  const isAllowed = allowed.some(type => 
    accountType.toLowerCase().includes(type.toLowerCase()) || 
    type.toLowerCase().includes(accountType.toLowerCase())
  );
  
  if (!isAllowed) {
    throw new Error(`Akun lawan tidak cocok dengan jenis transaksi. Untuk ${transactionType}, account_type harus salah satu dari: ${allowed.join(', ')}`);
  }
}

interface JournalEntry {
  account_id: string;
  debit: number;
  credit: number;
  description: string;
  transaction_date: string;
}

function buildJournalEntries(
  transactionType: TransactionType,
  kasBankAccountId: string,
  lawanAccountId: string,
  lawanAccountType: string,
  nominal: number,
  description: string,
  date: string
): JournalEntry[] {
  // Validate account type
  checkAccountType(transactionType, lawanAccountType);

  if (transactionType === 'Penerimaan') {
    // Penerimaan: Debit Kas/Bank, Credit Akun Lawan
    return [
      {
        account_id: kasBankAccountId,
        debit: nominal,
        credit: 0,
        description: description,
        transaction_date: date,
      },
      {
        account_id: lawanAccountId,
        debit: 0,
        credit: nominal,
        description: description,
        transaction_date: date,
      }
    ];
  } else {
    // Pengeluaran: Debit Akun Lawan, Credit Kas/Bank
    return [
      {
        account_id: lawanAccountId,
        debit: nominal,
        credit: 0,
        description: description,
        transaction_date: date,
      },
      {
        account_id: kasBankAccountId,
        debit: 0,
        credit: nominal,
        description: description,
        transaction_date: date,
      }
    ];
  }
}

async function runPicaQuery(query: string): Promise<any> {
  const response = await fetch(
    `https://api.picaos.com/v1/passthrough/v1/projects/${SUPABASE_PROJECT_ID}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pica-secret': PICA_SECRET_KEY,
        'x-pica-connection-key': PICA_SUPABASE_CONNECTION_KEY,
        'x-pica-action-id': 'conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg'
      },
      body: JSON.stringify({ query })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pica API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: TransaksiKeuanganRequest = await req.json();

    switch (payload.action) {
      case 'fetch_kas_bank_accounts': {
        // Fetch Kas/Bank accounts from COA
        const query = `SELECT id, account_name, account_type, account_code FROM chart_of_accounts WHERE account_type = 'Aset' AND (account_name ILIKE '%Kas%' OR account_name ILIKE '%Bank%') AND is_active = true ORDER BY account_name`;
        const result = await runPicaQuery(query);
        
        return new Response(
          JSON.stringify({ success: true, data: result.data || result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fetch_lawan_accounts': {
        if (!payload.account_type) {
          throw new Error("account_type is required for fetch_lawan_accounts");
        }
        
        // Handle multiple account types (e.g., "Beban" should also include "Beban Operasional", "Beban Pokok Penjualan")
        let whereClause = '';
        if (payload.account_type === 'Beban') {
          whereClause = `(account_type = 'Beban' OR account_type = 'Beban Operasional' OR account_type = 'Beban Pokok Penjualan')`;
        } else {
          whereClause = `account_type = '${payload.account_type}'`;
        }
        
        const query = `SELECT id, account_name, account_type, account_code FROM chart_of_accounts WHERE ${whereClause} AND is_active = true ORDER BY account_name`;
        const result = await runPicaQuery(query);
        
        return new Response(
          JSON.stringify({ success: true, data: result.data || result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_journal': {
        // Validate required fields
        if (!payload.transaction_type || !payload.kas_bank_account_id || !payload.lawan_account_id || 
            !payload.lawan_account_type || !payload.nominal || !payload.date) {
          throw new Error("Missing required fields for create_journal");
        }

        // Build journal entries
        const journalEntries = buildJournalEntries(
          payload.transaction_type,
          payload.kas_bank_account_id,
          payload.lawan_account_id,
          payload.lawan_account_type,
          payload.nominal,
          payload.description || '',
          payload.date
        );

        // Generate unique journal reference
        const journalRef = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Insert journal entries using transaction
        const insertQuery = `
          BEGIN;
          INSERT INTO journal_entries (journal_ref, account_id, debit, credit, description, tanggal) 
          VALUES ('${journalRef}', '${journalEntries[0].account_id}', ${journalEntries[0].debit}, ${journalEntries[0].credit}, '${journalEntries[0].description.replace(/'/g, "''")}', '${journalEntries[0].transaction_date}');
          INSERT INTO journal_entries (journal_ref, account_id, debit, credit, description, tanggal) 
          VALUES ('${journalRef}', '${journalEntries[1].account_id}', ${journalEntries[1].debit}, ${journalEntries[1].credit}, '${journalEntries[1].description.replace(/'/g, "''")}', '${journalEntries[1].transaction_date}');
          COMMIT;
        `;

        await runPicaQuery(insertQuery);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Journal entries created successfully',
            journal_ref: journalRef,
            entries: journalEntries
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${payload.action}`);
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
