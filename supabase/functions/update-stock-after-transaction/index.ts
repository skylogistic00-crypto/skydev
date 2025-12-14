import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? '',
    );

    const { 
      transaction_id, 
      item_id, 
      quantity, 
      type,
      transaction_date,
      total_amount,
      payment_method,
      coa_account_code,
      coa_account_name
    } = await req.json();

    if (!transaction_id || !quantity || !type) {
      return new Response(
        JSON.stringify({ error: 'transaction_id, quantity, and type are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update stock
    if (item_id) {
      const { data: currentItem, error: fetchError } = await supabaseClient
        .from('inventory_items')
        .select('qty_available')
        .eq('id', item_id)
        .single();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch current stock', details: fetchError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const newQty = currentItem.qty_available - quantity;

      const { error: stockError } = await supabaseClient
        .from('inventory_items')
        .update({ qty_available: newQty })
        .eq('id', item_id);

      if (stockError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update stock', details: stockError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Create journal entries based on type
    const journalEntries = [];

    if (type === 'SALE') {
      // Debit entry (Kas/Piutang)
      const debitAccountCode = payment_method === 'Piutang' ? '1-1200' : '1-1100';
      const debitAccountName = payment_method === 'Piutang' ? 'Piutang Usaha' : 'Kas';
      
      journalEntries.push({
        transaction_id,
        transaction_date,
        account_code: debitAccountCode,
        account_name: debitAccountName,
        debit: total_amount,
        credit: 0,
        description: `Penjualan - ${payment_method}`
      });

      // Credit entry (Pendapatan)
      journalEntries.push({
        transaction_id,
        transaction_date,
        account_code: coa_account_code || '4-1000',
        account_name: coa_account_name || 'Pendapatan Penjualan',
        debit: 0,
        credit: total_amount,
        description: 'Pendapatan Penjualan'
      });
    } else if (type === 'USAGE') {
      // Debit entry (Biaya Operasional)
      journalEntries.push({
        transaction_id,
        transaction_date,
        account_code: coa_account_code,
        account_name: coa_account_name,
        debit: total_amount,
        credit: 0,
        description: 'Pemakaian Barang Internal'
      });

      // Credit entry (Persediaan)
      journalEntries.push({
        transaction_id,
        transaction_date,
        account_code: '1-1300',
        account_name: 'Persediaan Barang Habis Pakai',
        debit: 0,
        credit: total_amount,
        description: 'Pengurangan Persediaan'
      });
    }

    const { data: insertedJournals, error: journalError } = await supabaseClient
      .from('journal_entries')
      .insert(journalEntries)
      .select();

    if (journalError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create journal entries', details: journalError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
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

      const { error: linesError } = await supabaseClient
        .from('journal_entry_lines')
        .insert(journalLines);

      if (linesError) {
        console.error('Journal lines error:', linesError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stock updated and journal entries created',
        journal_entries: journalEntries.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});