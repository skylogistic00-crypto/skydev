import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { validateEmail } from "@shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      // Don't reveal if user exists - return success anyway for security
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const userId = users[0].id;

    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to process password reset request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send password reset email using Supabase Auth
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
