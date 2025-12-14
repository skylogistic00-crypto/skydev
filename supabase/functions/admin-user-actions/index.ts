import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient, createSupabaseAnonClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const anonClient = createSupabaseAnonClient();
    
    // Verify user is admin
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: userProfile } = await anonClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const supabase = createSupabaseClient();
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Set audit context
    await supabase.rpc('set_config', {
      setting: 'app.current_user',
      value: user.id,
    });

    switch (action) {
      case 'suspend': {
        const { error } = await supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', userId);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to suspend user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User suspended successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'activate': {
        const { error } = await supabase
          .from('users')
          .update({ is_active: true })
          .eq('id', userId);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to activate user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User activated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'resend-verification': {
        const { data: targetUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

        if (!targetUser) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        const { error: emailError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: targetUser.email,
        });

        if (emailError) {
          return new Response(
            JSON.stringify({ error: 'Failed to send verification email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Verification email sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'verify-docs': {
        const body = await req.json();
        const { status, notes } = body;

        if (!['approved', 'rejected'].includes(status)) {
          return new Response(
            JSON.stringify({ error: 'Invalid status. Must be approved or rejected' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Update user verification status
        const { error } = await supabase
          .from('users')
          .update({
            is_active: status === 'approved',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to verify documents' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Documents ${status}`,
            status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
