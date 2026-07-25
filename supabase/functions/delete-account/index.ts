import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Permanently deletes the authenticated user's account:
// 1) wipes all their app data (public schema) via the security-definer RPC
// 2) deletes the auth.users row itself so the account is truly gone and the
//    email can be reused for a fresh signup.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)
    const user = userData.user

    const admin = createClient(url, serviceKey)

    // 1) Wipe all app data. RPC enforces auth.uid() = _user_id, so run as user.
    const { error: wipeErr } = await userClient.rpc('delete_user_data', { _user_id: user.id })
    if (wipeErr) {
      // Log but continue — we still want to remove the auth account so the email frees up.
      console.error('data wipe error (continuing to auth delete)', wipeErr)
    }

    // 2) Permanently delete the auth user (frees the email for re-registration).
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id, false)
    if (delErr) {
      console.error('auth delete error', delErr)
      return json({ error: 'Could not remove account: ' + delErr.message }, 500)
    }

    return json({ deleted: true }, 200)
  } catch (e) {
    console.error(e)
    return json({ error: 'Internal error: ' + (e as Error).message }, 500)
  }
})

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
