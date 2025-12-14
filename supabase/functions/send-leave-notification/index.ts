import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, employeeName, status, leaveType, startDate, endDate, rejectionReason } = await req.json();

    let subject = "";
    let message = "";

    if (status === "pending") {
      subject = "Pengajuan Cuti Diterima";
      message = `
        <h2>Halo ${employeeName},</h2>
        <p>Pengajuan cuti Anda telah diterima dan sedang dalam proses review.</p>
        <p><strong>Detail Pengajuan:</strong></p>
        <ul>
          <li>Jenis Cuti: ${leaveType}</li>
          <li>Tanggal: ${startDate} s/d ${endDate}</li>
          <li>Status: Menunggu Persetujuan</li>
        </ul>
        <p>Anda akan menerima notifikasi lebih lanjut setelah pengajuan direview.</p>
      `;
    } else if (status === "approved") {
      subject = "Pengajuan Cuti Disetujui";
      message = `
        <h2>Halo ${employeeName},</h2>
        <p>Selamat! Pengajuan cuti Anda telah <strong>DISETUJUI</strong>.</p>
        <p><strong>Detail Cuti:</strong></p>
        <ul>
          <li>Jenis Cuti: ${leaveType}</li>
          <li>Tanggal: ${startDate} s/d ${endDate}</li>
          <li>Status: Disetujui</li>
        </ul>
        <p>Silakan nikmati waktu cuti Anda.</p>
      `;
    } else if (status === "rejected") {
      subject = "Pengajuan Cuti Ditolak";
      message = `
        <h2>Halo ${employeeName},</h2>
        <p>Mohon maaf, pengajuan cuti Anda telah <strong>DITOLAK</strong>.</p>
        <p><strong>Detail Pengajuan:</strong></p>
        <ul>
          <li>Jenis Cuti: ${leaveType}</li>
          <li>Tanggal: ${startDate} s/d ${endDate}</li>
          <li>Status: Ditolak</li>
        </ul>
        ${rejectionReason ? `<p><strong>Alasan Penolakan:</strong> ${rejectionReason}</p>` : ""}
        <p>Silakan hubungi HRD untuk informasi lebih lanjut.</p>
      `;
    }

    // In production, integrate with email service like SendGrid, Resend, etc.
    // For now, we'll just log it
    console.log("Sending email to:", to);
    console.log("Subject:", subject);
    console.log("Message:", message);

    // Example with Resend (uncomment and add RESEND_API_KEY to env)
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HRD System <noreply@yourcompany.com>',
        to: [to],
        subject: subject,
        html: message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */

    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent" }),
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
