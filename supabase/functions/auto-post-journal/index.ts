import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JournalEntry {
  transaction_id: string;
  transaction_date: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
  created_by: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const { type, record } = body;

    if (!type || !record) {
      throw new Error('Missing required fields: type and record');
    }

    const journalEntries: JournalEntry[] = [];
    let transactionId = '';

    // Handle different transaction types
    if (type === 'sales_transaction') {
      transactionId = `SALE-${record.id.substring(0, 8)}`;

      if (record.transaction_type === 'Barang') {
        // 1. Dr Kas/Piutang
        const cashCode = record.payment_method === 'Piutang' ? '1-1200' : '1-1100';
        const cashName = record.payment_method === 'Piutang' ? 'Piutang Usaha' : 'Kas';
        
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: cashCode,
          account_name: cashName,
          debit: record.total_amount,
          credit: 0,
          description: `Penjualan Barang - ${record.item_name} (${record.payment_method})`,
          created_by: record.created_by || 'system',
        });

        // 2. Cr Pendapatan
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: record.coa_revenue_code || record.coa_account_code,
          account_name: record.coa_account_name || 'Pendapatan Penjualan',
          debit: 0,
          credit: record.subtotal,
          description: `Pendapatan Penjualan Barang - ${record.item_name}`,
          created_by: record.created_by || 'system',
        });

        // 3. Cr Pajak
        if (record.tax_amount > 0) {
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: '2-1250',
            account_name: 'Hutang PPN',
            debit: 0,
            credit: record.tax_amount,
            description: `PPN Keluaran ${record.tax_percentage}%`,
            created_by: record.created_by || 'system',
          });
        }

        // 4. Dr HPP
        if (record.coa_cogs_code) {
          const cogs = record.quantity * (record.unit_price - (record.subtotal / record.quantity));
          
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: record.coa_cogs_code,
            account_name: 'Harga Pokok Penjualan',
            debit: cogs,
            credit: 0,
            description: `HPP - ${record.item_name}`,
            created_by: record.created_by || 'system',
          });

          // 5. Cr Persediaan
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: record.coa_inventory_code,
            account_name: 'Persediaan Barang',
            debit: 0,
            credit: cogs,
            description: `Pengurangan Persediaan - ${record.item_name}`,
            created_by: record.created_by || 'system',
          });
        }
      } else {
        // Penjualan Jasa
        // 1. Dr Kas/Piutang
        const cashCode = record.payment_method === 'Piutang' ? '1-1200' : '1-1100';
        const cashName = record.payment_method === 'Piutang' ? 'Piutang Usaha' : 'Kas';
        
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: cashCode,
          account_name: cashName,
          debit: record.total_amount,
          credit: 0,
          description: `Penjualan Jasa - ${record.item_name} (${record.payment_method})`,
          created_by: record.created_by || 'system',
        });

        // 2. Cr Pendapatan Jasa
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: record.coa_revenue_code || record.coa_account_code,
          account_name: record.coa_account_name || 'Pendapatan Jasa',
          debit: 0,
          credit: record.subtotal,
          description: `Pendapatan Jasa - ${record.item_name}`,
          created_by: record.created_by || 'system',
        });

        // 3. Cr Pajak
        if (record.tax_amount > 0) {
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: '2-1250',
            account_name: 'Hutang PPN',
            debit: 0,
            credit: record.tax_amount,
            description: `PPN Keluaran ${record.tax_percentage}%`,
            created_by: record.created_by || 'system',
          });
        }
      }
    } else if (type === 'expense') {
      transactionId = `EXP-${record.id.substring(0, 8)}`;

      // 1. Dr Biaya Operasional
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.expense_date || record.transaction_date,
        account_code: record.coa_expense_code || record.coa_account_code,
        account_name: record.coa_account_name || 'Biaya Operasional',
        debit: record.amount || record.subtotal,
        credit: 0,
        description: `${record.expense_type || 'Pengeluaran'} - ${record.description || ''}`,
        created_by: record.created_by || 'system',
      });

      // 2. Dr PPN Masukan (if any)
      if (record.tax_amount > 0) {
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.expense_date || record.transaction_date,
          account_code: '1-1720',
          account_name: 'Piutang Pajak',
          debit: record.tax_amount,
          credit: 0,
          description: `PPN Masukan ${record.tax_percentage || 11}%`,
          created_by: record.created_by || 'system',
        });
      }

      // 3. Cr Kas/Bank
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.expense_date || record.transaction_date,
        account_code: '1-1100',
        account_name: 'Kas',
        debit: 0,
        credit: record.total_amount || (record.amount + (record.tax_amount || 0)),
        description: `Pembayaran ${record.expense_type || 'Pengeluaran'}`,
        created_by: record.created_by || 'system',
      });
    } else if (type === 'tax_payment') {
      transactionId = `TAX-${record.id.substring(0, 8)}`;

      // 1. Dr Kewajiban Pajak
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.transaction_date,
        account_code: record.coa_tax_code,
        account_name: record.coa_tax_name || 'Kewajiban Pajak',
        debit: record.amount,
        credit: 0,
        description: `Pembayaran ${record.tax_type}`,
        created_by: record.created_by || 'system',
      });

      // 2. Cr Kas/Bank
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.transaction_date,
        account_code: '1-1100',
        account_name: 'Kas',
        debit: 0,
        credit: record.amount,
        description: `Pembayaran ${record.tax_type}`,
        created_by: record.created_by || 'system',
      });
    } else if (type === 'internal_usage') {
      transactionId = `USAGE-${record.id.substring(0, 8)}`;

      // 1. Dr Beban Operasional
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.usage_date || record.transaction_date,
        account_code: record.coa_expense_code || record.coa_account_code,
        account_name: record.coa_account_name || 'Beban Operasional',
        debit: record.total_cost || record.total_amount,
        credit: 0,
        description: `Pemakaian Internal - ${record.item_name} (${record.department_name || ''})`,
        created_by: record.created_by || 'system',
      });

      // 2. Cr Persediaan
      journalEntries.push({
        transaction_id: transactionId,
        transaction_date: record.usage_date || record.transaction_date,
        account_code: record.coa_inventory_code,
        account_name: 'Persediaan Barang',
        debit: 0,
        credit: record.total_cost || record.total_amount,
        description: `Pengurangan Persediaan - ${record.item_name}`,
        created_by: record.created_by || 'system',
      });
    } else if (type === 'stock_adjustment') {
      transactionId = `SADJ-${record.id.substring(0, 8)}`;
      console.log('Processing stock adjustment:', { sku: record.sku, transaction_type: record.transaction_type });

      // Get stock item details for COA codes
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('coa_inventory_code, coa_cogs_code, unit_price, item_name')
        .eq('sku', record.sku)
        .maybeSingle();

      console.log('Stock query result:', { stockData, stockError });

      // If stock not found, use default values
      const inventoryCode = stockData?.coa_inventory_code || '1-1300';
      const cogsCode = stockData?.coa_cogs_code || '5-1100';
      const unitPrice = stockData?.unit_price || 0;
      const itemName = stockData?.item_name || record.item_name || 'Unknown Item';

      console.log('Using values:', { inventoryCode, unitPrice, itemName });

      // If unit_price is 0, we can't calculate adjustment amount
      // In this case, we'll skip journal posting
      if (unitPrice === 0) {
        console.warn(`Unit price is 0 for SKU: ${record.sku}. Skipping journal posting.`);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Unit price is 0. Please update unit_price in stock table before posting to journal.',
            entries: 0,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 but with success: false
          }
        );
      }

      const adjustmentAmount = Math.abs(record.adjustment_value || 0) * unitPrice;
      console.log('Adjustment amount:', adjustmentAmount);

      if (record.transaction_type === 'stock_in') {
        // Barang Masuk (Non-Pembelian)
        // 1. Dr Persediaan
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: inventoryCode,
          account_name: 'Persediaan Barang',
          debit: adjustmentAmount,
          credit: 0,
          description: `Barang Masuk - ${itemName} (${record.reason || 'No reason'})`,
          created_by: record.created_by || 'system',
        });

        // 2. Cr Pendapatan Lain-lain / Koreksi Persediaan
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: '4-2100',
          account_name: 'Pendapatan Lain-lain',
          debit: 0,
          credit: adjustmentAmount,
          description: `${record.reason || 'Stock In'} - ${itemName}`,
          created_by: record.created_by || 'system',
        });
      } else if (record.transaction_type === 'stock_out') {
        // Barang Keluar (Non-Penjualan)
        // 1. Dr Beban Lain-lain / Kerugian
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: '6-2100',
          account_name: 'Beban Lain-lain',
          debit: adjustmentAmount,
          credit: 0,
          description: `${record.reason || 'Stock Out'} - ${itemName}`,
          created_by: record.created_by || 'system',
        });

        // 2. Cr Persediaan
        journalEntries.push({
          transaction_id: transactionId,
          transaction_date: record.transaction_date,
          account_code: inventoryCode,
          account_name: 'Persediaan Barang',
          debit: 0,
          credit: adjustmentAmount,
          description: `Pengurangan Persediaan - ${itemName}`,
          created_by: record.created_by || 'system',
        });
      } else if (record.transaction_type === 'adjustment' || record.transaction_type === 'opname') {
        // Koreksi Stok / Stock Opname
        if (record.adjustment_value > 0) {
          // Selisih Lebih (Stok bertambah)
          // 1. Dr Persediaan
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: inventoryCode,
            account_name: 'Persediaan Barang',
            debit: adjustmentAmount,
            credit: 0,
            description: `${record.transaction_type === 'opname' ? 'Stock Opname' : 'Koreksi Stok'} - ${itemName} (Selisih Lebih)`,
            created_by: record.created_by || 'system',
          });

          // 2. Cr Pendapatan Lain-lain
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: '4-2100',
            account_name: 'Pendapatan Lain-lain',
            debit: 0,
            credit: adjustmentAmount,
            description: `Selisih Lebih ${record.transaction_type === 'opname' ? 'Opname' : 'Koreksi'} - ${itemName}`,
            created_by: record.created_by || 'system',
          });
        } else if (record.adjustment_value < 0) {
          // Selisih Kurang (Stok berkurang)
          // 1. Dr Beban Lain-lain
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: '6-2100',
            account_name: 'Beban Lain-lain',
            debit: adjustmentAmount,
            credit: 0,
            description: `${record.transaction_type === 'opname' ? 'Stock Opname' : 'Koreksi Stok'} - ${itemName} (Selisih Kurang)`,
            created_by: record.created_by || 'system',
          });

          // 2. Cr Persediaan
          journalEntries.push({
            transaction_id: transactionId,
            transaction_date: record.transaction_date,
            account_code: inventoryCode,
            account_name: 'Persediaan Barang',
            debit: 0,
            credit: adjustmentAmount,
            description: `Pengurangan Persediaan - ${itemName}`,
            created_by: record.created_by || 'system',
          });
        }
      }
    }

    console.log('Journal entries to insert:', JSON.stringify(journalEntries, null, 2));

    // Validate journal balance
    const totalDebit = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);

    console.log('Balance check:', { totalDebit, totalCredit, diff: Math.abs(totalDebit - totalCredit) });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Jurnal tidak balance! Debit: ${totalDebit}, Kredit: ${totalCredit}`);
    }

    // Insert journal entries
    const { data: insertedJournals, error: journalError } = await supabase
      .from('journal_entries')
      .insert(journalEntries)
      .select();

    if (journalError) {
      console.error('Journal insert error:', journalError);
      throw journalError;
    }

    // Insert journal_entry_lines for each journal entry
    if (insertedJournals && insertedJournals.length > 0) {
      const journalLines = insertedJournals.map((journal: any) => ({
        journal_id: journal.id,
        account_code: journal.account_code,
        account_name: journal.account_name,
        debit: journal.debit,
        credit: journal.credit,
        description: journal.description,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(journalLines);

      if (linesError) {
        console.error('Journal lines error:', linesError);
      }
    }

    console.log('Success! Inserted', journalEntries.length, 'entries');

    return new Response(
      JSON.stringify({
        success: true,
        message: `${journalEntries.length} entri jurnal berhasil dibuat`,
        transaction_id: transactionId,
        entries: journalEntries.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});