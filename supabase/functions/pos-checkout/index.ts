import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  price: number;
  base_price: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

interface CheckoutData {
  cart_items: CartItem[];
  total_amount: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  customer_name?: string;
  notes?: string;
}

async function runSQLQuery(query: string): Promise<any> {
  const { data, error } = await supabase.rpc('execute_sql', { query_text: query });
  
  if (error) {
    throw new Error(`SQL query failed: ${error.message}`);
  }

  return data;
}

function generateTransactionNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = date.getTime().toString().slice(-6);
  return `POS-${dateStr}-${timeStr}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const checkoutData: CheckoutData = await req.json();
    const { cart_items, total_amount, payment_method, payment_amount, change_amount, customer_name, notes } = checkoutData;

    if (!cart_items || cart_items.length === 0) {
      throw new Error("Cart is empty");
    }

    const transactionNumber = generateTransactionNumber();
    let totalCOGS = 0;

    // 1. Create POS transaction record
    const transactionQuery = `INSERT INTO pos_transactions (
      transaction_number,
      total_amount,
      payment_method,
      payment_amount,
      change_amount,
      customer_name,
      notes,
      status,
      transaction_date
    ) VALUES (
      '${transactionNumber}',
      ${total_amount},
      '${payment_method}',
      ${payment_amount},
      ${change_amount},
      ${customer_name ? `'${customer_name.replace(/'/g, "''")}'` : "NULL"},
      ${notes ? `'${notes.replace(/'/g, "''")}'` : "NULL"},
      'completed',
      NOW()
    ) RETURNING id;`;

    let transactionId: string | null = null;
    try {
      const txResult = await runSQLQuery(transactionQuery);
      if (txResult && Array.isArray(txResult) && txResult.length > 0) {
        transactionId = txResult[0].id;
      }
    } catch (err) {
      console.error("Error creating transaction:", err);
      throw new Error("Failed to create transaction");
    }

    // 2. Process each cart item
    for (const item of cart_items) {
      // Insert transaction item
      const itemQuery = `INSERT INTO pos_transaction_items (
        transaction_id,
        product_id,
        sku,
        product_name,
        quantity,
        unit_price,
        base_price,
        subtotal,
        cogs
      ) VALUES (
        '${transactionId}',
        '${item.product_id}',
        '${item.sku}',
        '${item.name.replace(/'/g, "''")}',
        ${item.quantity},
        ${item.price},
        ${item.base_price},
        ${item.subtotal},
        ${item.base_price * item.quantity}
      );`;

      try {
        await runSQLQuery(itemQuery);
      } catch (err) {
        console.error("Error inserting transaction item:", err);
      }

      // 3. Decrease stock using RPC function
      try {
        const decreaseQuery = `SELECT decrease_stock('${item.sku}', ${item.quantity}, 'pos_sale', '${transactionId}', '${transactionNumber}', 'POS Sale');`;
        await runSQLQuery(decreaseQuery);
      } catch (err) {
        console.error("Error decreasing stock:", err);
      }

      // Calculate COGS
      totalCOGS += item.base_price * item.quantity;
    }

    // 4. Send to accounting - create accounting event
    const profit = total_amount - totalCOGS;
    const accountingQuery = `INSERT INTO accounting_events (
      event_type,
      reference_type,
      reference_id,
      reference_number,
      amount,
      debit_account,
      credit_account,
      description,
      metadata
    ) VALUES (
      'sale',
      'pos_transaction',
      '${transactionId}',
      '${transactionNumber}',
      ${total_amount},
      '1-10100',
      '4-10100',
      'Penjualan POS - ${transactionNumber}',
      '${JSON.stringify({
        total_amount,
        cogs: totalCOGS,
        profit,
        payment_method,
        items_count: cart_items.length,
      }).replace(/'/g, "''")}'
    );`;

    try {
      await runSQLQuery(accountingQuery);
    } catch (err) {
      console.error("Error creating accounting event:", err);
    }

    // 5. Create COGS accounting event
    const cogsAccountingQuery = `INSERT INTO accounting_events (
      event_type,
      reference_type,
      reference_id,
      reference_number,
      amount,
      debit_account,
      credit_account,
      description,
      metadata
    ) VALUES (
      'stock_out',
      'pos_transaction',
      '${transactionId}',
      '${transactionNumber}',
      ${totalCOGS},
      '5-10100',
      '1-10100',
      'HPP Penjualan POS - ${transactionNumber}',
      '${JSON.stringify({
        cogs: totalCOGS,
        items: cart_items.map(i => ({ sku: i.sku, qty: i.quantity, cost: i.base_price })),
      }).replace(/'/g, "''")}'
    );`;

    try {
      await runSQLQuery(cogsAccountingQuery);
    } catch (err) {
      console.error("Error creating COGS accounting event:", err);
    }

    // Generate receipt data
    const receiptData = {
      transaction_number: transactionNumber,
      transaction_id: transactionId,
      date: new Date().toISOString(),
      items: cart_items.map(item => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      subtotal: total_amount,
      total: total_amount,
      payment_method,
      payment_amount,
      change: change_amount,
      customer_name,
      cogs: totalCOGS,
      profit,
    };

    return new Response(
      JSON.stringify({
        success: true,
        transaction_number: transactionNumber,
        transaction_id: transactionId,
        total_amount,
        cogs: totalCOGS,
        profit,
        receipt: receiptData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("POS Checkout Error:", error);
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
