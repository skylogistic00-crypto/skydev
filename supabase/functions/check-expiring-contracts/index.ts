import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contracts expiring in 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data: expiringContracts, error } = await supabase
      .from('employment_contracts')
      .select(`
        *,
        employees(full_name, email)
      `)
      .eq('status', 'active')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', thirtyDaysLater.toISOString().split('T')[0]);

    if (error) throw error;

    console.log(`Found ${expiringContracts?.length || 0} expiring contracts`);

    // Send notifications for each expiring contract
    const notifications = [];
    for (const contract of expiringContracts || []) {
      const daysRemaining = Math.ceil(
        (new Date(contract.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notification in database
      const { error: notifError } = await supabase
        .from('hrd_notifications')
        .insert({
          title: 'Kontrak Akan Berakhir',
          message: `Kontrak ${contract.employees.full_name} (${contract.contract_number}) akan berakhir dalam ${daysRemaining} hari`,
          type: 'contract_expiring',
          priority: daysRemaining <= 7 ? 'high' : 'medium',
          related_id: contract.id,
          is_read: false,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      // Send email notification (optional - integrate with email service)
      // Example with Resend:
      /*
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey && contract.employees.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'HRD System <noreply@yourcompany.com>',
            to: [contract.employees.email],
            subject: 'Reminder: Kontrak Akan Berakhir',
            html: `
              <h2>Halo ${contract.employees.full_name},</h2>
              <p>Kontrak kerja Anda akan berakhir dalam <strong>${daysRemaining} hari</strong>.</p>
              <p><strong>Detail Kontrak:</strong></p>
              <ul>
                <li>No. Kontrak: ${contract.contract_number}</li>
                <li>Jenis: ${contract.contract_type}</li>
                <li>Tanggal Berakhir: ${contract.end_date}</li>
              </ul>
              <p>Silakan hubungi HRD untuk informasi lebih lanjut.</p>
            `,
          }),
        });
      }
      */

      notifications.push({
        contract_number: contract.contract_number,
        employee: contract.employees.full_name,
        days_remaining: daysRemaining,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${expiringContracts?.length || 0} expiring contracts`,
        notifications 
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
