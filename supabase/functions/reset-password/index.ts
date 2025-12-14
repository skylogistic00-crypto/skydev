import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { validatePassword } from "@shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Token and new password required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Find reset token
    const { data: resetRecord, error: tokenError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !resetRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if token expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Reset token has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reset password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    if (markUsedError) {
      console.error('Failed to mark token as used:', markUsedError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
