import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

interface RBACRequest {
  action: string;
  user_id?: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  menu_key?: string;
  permissions?: {
    can_view?: boolean;
    can_create?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
  };
  entity_id?: string;
  filters?: {
    role?: string;
    is_active?: boolean;
    search?: string;
  };
}

const VALID_ROLES = ["admin", "manager", "supervisor", "staff", "hrd", "member"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient();
    const body: RBACRequest = await req.json();
    const { action } = body;

    // GET USERS
    if (action === "get_users") {
      const { filters } = body;

      let query = supabase
        .from("users")
        .select("id, name, email, phone, role, is_active, entity_id, created_at")
        .order("name");

      if (filters?.role) {
        query = query.eq("role", filters.role);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET USER BY ID
    if (action === "get_user") {
      const { user_id } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, phone, role, is_active, entity_id, created_at")
        .eq("id", user_id)
        .single();

      if (error) throw error;

      // Get user's permissions
      const { data: permissions } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", data.role);

      return new Response(
        JSON.stringify({ user: data, permissions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // UPDATE USER
    if (action === "update_user") {
      const { user_id, name, email, phone, role, is_active } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (role && !VALID_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user_id)
        .select("id, name, email, phone, role, is_active")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, user: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET ROLE PERMISSIONS
    if (action === "get_role_permissions") {
      const { role, entity_id } = body;

      let query = supabase
        .from("role_permissions")
        .select("*")
        .order("menu_key");

      if (role) {
        query = query.eq("role", role);
      }
      if (entity_id) {
        query = query.eq("entity_id", entity_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by role
      const grouped: Record<string, any[]> = {};
      for (const perm of data || []) {
        if (!grouped[perm.role]) {
          grouped[perm.role] = [];
        }
        grouped[perm.role].push(perm);
      }

      return new Response(
        JSON.stringify({ data, grouped }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // UPDATE ROLE PERMISSION
    if (action === "update_permission") {
      const { role, menu_key, permissions, entity_id } = body;

      if (!role || !menu_key) {
        return new Response(
          JSON.stringify({ error: "role and menu_key required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!VALID_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Upsert permission
      const { data, error } = await supabase
        .from("role_permissions")
        .upsert({
          role,
          menu_key,
          entity_id: entity_id || null,
          can_view: permissions?.can_view ?? false,
          can_create: permissions?.can_create ?? false,
          can_edit: permissions?.can_edit ?? false,
          can_delete: permissions?.can_delete ?? false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "role,menu_key,entity_id"
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, permission: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // CHECK USER PERMISSION
    if (action === "check_permission") {
      const { user_id, menu_key } = body;

      if (!user_id || !menu_key) {
        return new Response(
          JSON.stringify({ error: "user_id and menu_key required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Get user role
      const { data: user } = await supabase
        .from("users")
        .select("role, entity_id, is_active")
        .eq("id", user_id)
        .single();

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (!user.is_active) {
        return new Response(
          JSON.stringify({
            has_access: false,
            reason: "User is inactive"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Get permission for this role and menu
      const { data: permission } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", user.role)
        .eq("menu_key", menu_key)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          has_access: permission?.can_view ?? false,
          permissions: permission || {
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          },
          user_role: user.role
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET ALL ROLES
    if (action === "get_roles") {
      return new Response(
        JSON.stringify({
          roles: VALID_ROLES,
          descriptions: {
            admin: "Full access to all features",
            manager: "Manage operations, limited settings access",
            supervisor: "Supervise daily operations",
            staff: "Basic operational access",
            hrd: "Human resources management",
            member: "Customer/member access"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET MENU ITEMS FOR ROLE
    if (action === "get_menu_for_role") {
      const { role } = body;

      if (!role) {
        return new Response(
          JSON.stringify({ error: "role required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("role_permissions")
        .select("menu_key, can_view, can_create, can_edit, can_delete")
        .eq("role", role)
        .eq("can_view", true);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          role,
          accessible_menus: data?.map(p => p.menu_key) || [],
          permissions: data
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("RBAC management error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
