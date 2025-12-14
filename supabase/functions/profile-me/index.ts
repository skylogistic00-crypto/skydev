import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseAnonClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight request FIRST
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createSupabaseAnonClient();
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (req.method === 'GET') {
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Get entity-specific data based on role
      let entityData = null;
      const entityTables = {
        driver: 'drivers',
        employee: 'employees',
        supplier: 'suppliers',
        customer: 'customers',
      };

      // Try to find entity data
      for (const [type, table] of Object.entries(entityTables)) {
        const { data } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          entityData = { type, ...data };
          break;
        }
      }

      return new Response(
        JSON.stringify({
          profile: userProfile,
          entity: entityData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { full_name, phone, address, ...entityUpdates } = body;

      // Update user profile
      const userUpdates: any = {};
      if (full_name) userUpdates.full_name = full_name;
      if (phone) userUpdates.phone = phone;

      if (Object.keys(userUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update profile' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      // Update entity-specific data if provided
      if (Object.keys(entityUpdates).length > 0) {
        // Determine which table to update
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const entityTables: Record<string, string> = {
          driver: 'drivers',
          employee: 'employees',
          supplier: 'suppliers',
          customer: 'customers',
        };

        const table = entityTables[userProfile?.role || ''];
        if (table) {
          await supabase
            .from(table)
            .update(entityUpdates)
            .eq('user_id', user.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Profile updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
