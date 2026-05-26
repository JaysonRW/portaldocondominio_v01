import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  })
}

const MASTER_EMAIL = "propagoumkd@gmail.com"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return jsonResponse(405, { error: "Método não permitido" })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse(500, { error: "Variáveis de ambiente do Supabase não configuradas" })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerUserData, error: callerUserError } = await caller.auth.getUser()
  if (callerUserError || !callerUserData?.user) return jsonResponse(401, { error: "Não autenticado" })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return jsonResponse(400, { error: "JSON inválido" })
  }

  const condominioId = String(payload?.condominio_id ?? "").trim()
  const redirectTo = payload?.redirectTo ? String(payload.redirectTo).trim() : null

  if (!condominioId) return jsonResponse(400, { error: "condominio_id é obrigatório" })
  if (!redirectTo) return jsonResponse(400, { error: "redirectTo é obrigatório" })

  const { data: callerProfile } = await caller
    .from("perfis")
    .select("id, role, condominio_id, email")
    .eq("id", callerUserData.user.id)
    .maybeSingle()

  const isMaster =
    callerProfile?.role === "super_admin" ||
    callerUserData.user.email?.toLowerCase() === MASTER_EMAIL

  if (!isMaster) return jsonResponse(403, { error: "Sem permissão" })

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

  const logBase = {
    master_user_id: callerUserData.user.id,
    condominio_id: condominioId,
    redirect_to: redirectTo,
  }

  try {
    const { data: condo, error: condoError } = await admin
      .from("condominios")
      .select("id, slug, nome")
      .eq("id", condominioId)
      .single()
    if (condoError || !condo) throw new Error("Condomínio não encontrado")

    // Tenta achar um síndico (ou subsíndico) ativo/aprovado para impersonar
    const { data: targetProfile, error: targetError } = await admin
      .from("perfis")
      .select("id, email, role, status_aprovacao, ativo")
      .eq("condominio_id", condominioId)
      .in("role", ["sindico", "subsindico"])
      .not("email", "is", null)
      // NÃ£o filtramos por `ativo`/`status_aprovacao` aqui porque registros antigos podem estar NULL.
      .order("role", { ascending: true }) // sindico antes de subsindico (lexicographic)
      .limit(1)
      .maybeSingle()

    if (targetError || !targetProfile?.email) {
      throw new Error("Nenhum síndico ativo encontrado para este condomínio")
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetProfile.email,
      options: { redirectTo },
    })

    if (linkError) throw linkError

    const actionLink = (linkData as any)?.properties?.action_link ?? null
    if (!actionLink) throw new Error("Falha ao gerar link de acesso")

    await admin.from("support_impersonation_logs").insert({
      ...logBase,
      target_user_id: targetProfile.id,
      target_role: targetProfile.role,
      success: true,
      error: null,
    })

    return jsonResponse(200, {
      action_link: actionLink,
      target_email: targetProfile.email,
      target_role: targetProfile.role,
      condominio: { id: condo.id, slug: condo.slug, nome: condo.nome },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await admin.from("support_impersonation_logs").insert({
      ...logBase,
      success: false,
      error: message,
    })
    return jsonResponse(400, { error: message })
  }
})
