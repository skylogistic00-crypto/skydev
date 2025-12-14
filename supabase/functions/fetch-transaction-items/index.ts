import { corsHeaders } from "@shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ItemData {
  id: string;
  item_name: string;
  detail: string;
  price?: number;
  stock_qty?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    const { tipeItemTransaksi } = await req.json();

    if (!tipeItemTransaksi || !['Barang', 'Jasa'].includes(tipeItemTransaksi)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Tipe Item Transaksi' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let items: ItemData[] = [];

    console.log('Fetching items for type:', tipeItemTransaksi);

    if (tipeItemTransaksi === 'Barang') {
      console.log('Querying stock table...');
      const { data, error } = await supabase
        .from('stock')
        .select('id, item_name, jenis_barang, selling_price, stock_qty')
        .limit(100);

      if (error) {
        console.error('Stock query error:', error);
        throw error;
      }

      console.log('Stock data received:', data?.length || 0, 'items');
      items = (data || []).map((row: any) => ({
        id: row.id,
        item_name: row.item_name,
        jenis_barang: row.jenis_barang || '',
        selling_price: row.selling_price,
        quantity: row.stock_qty,
      }));
    } else {
      console.log('Querying service_items table...');
      const { data, error } = await supabase
        .from('service_items')
        .select('id, service_name, service_type, price')
        .eq('is_active', true)
        .limit(100);

      if (error) {
        console.error('Service items query error:', error);
        throw error;
      }

      console.log('Service items data received:', data?.length || 0, 'items');
      items = (data || []).map((row: any) => ({
        id: row.id,
        service_name: row.service_name,
        service_type: row.service_type,
        price: row.price,
      }));
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
