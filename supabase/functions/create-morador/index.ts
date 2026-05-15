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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
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
  if (callerUserError || !callerUserData?.user) {
    return jsonResponse(401, { error: "Não autenticado" })
  }

  const { data: callerProfile, error: callerProfileError } = await caller
    .from("perfis")
    .select("id, role, condominio_id")
    .eq("id", callerUserData.user.id)
    .single()

  console.log("Caller Profile:", callerProfile)

  if (callerProfileError || !callerProfile) {
    console.error("Erro ao buscar perfil do chamador:", callerProfileError)
    return jsonResponse(403, { error: "Perfil do administrador não encontrado no banco de dados." })
  }

  if (callerProfile.role !== "sindico" && callerProfile.role !== "super_admin") {
    return jsonResponse(403, { error: "Sem permissão" })
  }

  let payload: any
  try {
    payload = await req.json()
    console.log("Payload recebido:", payload)
  } catch {
    return jsonResponse(400, { error: "JSON inválido" })
  }

  const email = String(payload?.email ?? "").trim().toLowerCase()
  const telefone = String(payload?.telefone ?? "").trim()
  const nome = payload?.nome ? String(payload.nome).trim() : null
  const bloco = payload?.bloco ? String(payload.bloco).trim() : null
  const unidade = payload?.unidade ? String(payload.unidade).trim() : null
  const redirectTo = payload?.redirectTo
    ? String(payload.redirectTo).trim()
    : payload?.redirect_to
      ? String(payload.redirect_to).trim()
      : null
  const requestedRoleRaw = payload?.role ? String(payload.role).trim().toLowerCase() : "morador"
  const requestedRole = requestedRoleRaw === "sindico" ? "sindico" : "morador"
  const requestedCondominioId = payload?.condominio_id ? String(payload.condominio_id).trim() : null

  if (!email) return jsonResponse(400, { error: "E-mail é obrigatório" })
  if (!telefone) return jsonResponse(400, { error: "Telefone é obrigatório" })

  if (requestedRole === "sindico" && callerProfile.role !== "super_admin") {
    return jsonResponse(403, { error: "Apenas o master pode criar síndico" })
  }

  const targetCondominioId = requestedCondominioId || callerProfile.condominio_id
  if (!targetCondominioId) {
    return jsonResponse(400, { error: "Condomínio é obrigatório" })
  }

  if (callerProfile.role !== "super_admin" && callerProfile.condominio_id !== targetCondominioId) {
    return jsonResponse(403, { error: "Sem permissão para vincular a outro condomínio" })
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo ?? undefined,
    data: {
      role: requestedRole,
      condominio_id: targetCondominioId,
    },
  })

  if (inviteError) {
    console.error("Erro ao convidar usuário:", inviteError)
    return jsonResponse(400, { error: inviteError.message })
  }

  if (!invited?.user?.id) {
    return jsonResponse(500, { error: "Falha ao criar convite" })
  }

  const profileName = nome && nome.length > 0 ? nome : email.split("@")[0]
  const telefoneDigits = telefone.replace(/\D/g, "")

  const { error: profileError } = await admin
    .from("perfis")
    .upsert(
      {
        id: invited.user.id,
        condominio_id: targetCondominioId,
        role: requestedRole,
        nome: profileName,
        email,
        telefone: telefoneDigits,
        bloco,
        unidade,
        status_aprovacao: true,
      },
      { onConflict: "id" },
    )

  if (profileError) {
    return jsonResponse(500, { error: profileError.message })
  }

  if (requestedRole === "morador") {
    const { error: solicitacaoError } = await admin.from("solicitacoes_adesao").insert({
      condominio_id: targetCondominioId,
      nome: profileName,
      email,
      telefone: telefoneDigits,
      bloco,
      unidade,
      status: "aprovado",
    })

    if (solicitacaoError) {
      return jsonResponse(500, { error: solicitacaoError.message })
    }
  }

  return jsonResponse(200, { userId: invited.user.id, role: requestedRole, condominio_id: targetCondominioId })
})

