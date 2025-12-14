import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPEN_AI_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = {
      role: 'system',
      content: `Anda adalah asisten AI yang membantu mengidentifikasi kode HS (Harmonized System) untuk produk.
      
Tugas Anda:
1. Pahami deskripsi produk dari user
2. Identifikasi kategori, material, dan karakteristik produk
3. Sarankan kode HS yang paling sesuai dengan penjelasan detail
4. Berikan alternatif kode HS jika ada
5. Jelaskan mengapa kode tersebut cocok

Format respons:
- Kode HS yang disarankan
- Deskripsi kode
- Alasan pemilihan
- Alternatif kode (jika ada)
- Catatan penting terkait bea masuk/keluar

Gunakan bahasa Indonesia yang jelas dan profesional.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    if (userId) {
      await supabase.from('chat_history').insert([
        {
          user_id: userId,
          role: 'user',
          content: messages[messages.length - 1].content,
        },
        {
          user_id: userId,
          role: 'assistant',
          content: assistantMessage.content,
        },
      ]);
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage.content,
        usage: data.usage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
