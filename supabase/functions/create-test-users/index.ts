import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserAccount {
  email: string
  password: string
  fullName: string
  role: string
}

const testUsers: UserAccount[] = [
  { email: 'superadmin@company.com', password: 'Password123!', fullName: 'Super Admin', role: 'super_admin' },
  { email: 'acc.manager@company.com', password: 'Password123!', fullName: 'Accounting Manager', role: 'accounting_manager' },
  { email: 'acc.staff01@company.com', password: 'Password123!', fullName: 'Accounting Staff 01', role: 'accounting_staff' },
  { email: 'wh.manager@company.com', password: 'Password123!', fullName: 'Warehouse Manager', role: 'warehouse_manager' },
  { email: 'wh.staff01@company.com', password: 'Password123!', fullName: 'Warehouse Staff 01', role: 'warehouse_staff' },
  { email: 'customs01@company.com', password: 'Password123!', fullName: 'Customs Specialist 01', role: 'customs_specialist' },
  { email: 'report@company.com', password: 'Password123!', fullName: 'Report Viewer', role: 'read_only' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const results = []

    for (const user of testUsers) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName
          }
        })

        if (authError) {
          results.push({ email: user.email, status: 'error', message: authError.message })
          continue
        }

        const { error: profileError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: authData.user.id,
            email: user.email,
            full_name: user.fullName,
            role: user.role
          })

        if (profileError) {
          results.push({ email: user.email, status: 'partial', message: 'Auth created but profile failed: ' + profileError.message })
        } else {
          results.push({ email: user.email, status: 'success', role: user.role })
        }
      } catch (error) {
        results.push({ email: user.email, status: 'error', message: error.message })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
