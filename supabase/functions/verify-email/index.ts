import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Verification token required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Find verification record
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .is('verified_at', null)
      .single();

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if token expired
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Verification token has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Mark verification as complete
    const { error: updateVerifyError } = await supabase
      .from('email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    if (updateVerifyError) {
      console.error('Failed to update verification:', updateVerifyError);
    }

    // Update user email confirmation in auth
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('Failed to confirm email:', confirmError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Activate user account
    const { error: activateError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', verification.user_id);

    if (activateError) {
      console.error('Failed to activate user:', activateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
