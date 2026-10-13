import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1"

type JsonObject = Record<string, unknown>

type CallerProfile = {
  id: string
  role: string
  condominio_id: string | null
  ativo: boolean | null
  status_aprovacao: boolean | null
}

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

function asJsonObject(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : null
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
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
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse(401, { error: "Não autenticado" })
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerUserData, error: callerUserError } = await caller.auth.getUser()
  if (callerUserError || !callerUserData?.user) {
    return jsonResponse(401, { error: "Não autenticado" })
  }

  // O JWT identifica o usuário; a autorização sempre usa o estado atual do banco.
  const { data: callerProfileData, error: callerProfileError } = await admin
    .from("perfis")
    .select("id, role, condominio_id, ativo, status_aprovacao")
    .eq("id", callerUserData.user.id)
    .maybeSingle()

  if (callerProfileError) {
    console.error("Erro ao buscar perfil do chamador:", callerProfileError)
    return jsonResponse(500, { error: "Não foi possível validar as permissões" })
  }

  const callerProfile = callerProfileData as CallerProfile | null
  if (
    !callerProfile ||
    callerProfile.ativo !== true ||
    callerProfile.status_aprovacao !== true
  ) {
    return jsonResponse(403, { error: "Perfil inativo, pendente ou não encontrado" })
  }

  if (callerProfile.role !== "sindico" && callerProfile.role !== "super_admin") {
    return jsonResponse(403, { error: "Sem permissão" })
  }

  let payload: JsonObject
  try {
    const parsedPayload = asJsonObject(await req.json())
    if (!parsedPayload) return jsonResponse(400, { error: "JSON inválido" })
    payload = parsedPayload
  } catch {
    return jsonResponse(400, { error: "JSON inválido" })
  }

  const email = String(payload?.email ?? "").trim().toLowerCase()
  const telefone = String(payload?.telefone ?? "").trim()
  const nome = optionalString(payload.nome)
  const bloco = optionalString(payload.bloco)
  const unidade = optionalString(payload.unidade)
  const redirectTo = optionalString(payload.redirectTo) ?? optionalString(payload.redirect_to)
  const requestedRole = (optionalString(payload.role) ?? "morador").toLowerCase()
  const requestedCondominioId = optionalString(payload.condominio_id)

  if (!email) return jsonResponse(400, { error: "E-mail é obrigatório" })
  if (!telefone) return jsonResponse(400, { error: "Telefone é obrigatório" })
  if (requestedRole !== "morador" && requestedRole !== "sindico") {
    return jsonResponse(400, { error: "Papel inválido para esta operação" })
  }

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

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo ?? undefined,
    data: {
      nome: nome ?? email.split("@")[0],
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
        ativo: true,
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

