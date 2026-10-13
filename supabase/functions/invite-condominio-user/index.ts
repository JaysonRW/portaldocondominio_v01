import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1"

type CallerProfile = {
  role: string
  condominio_id: string | null
  ativo: boolean | null
  status_aprovacao: boolean | null
}

const assignableBySindico = new Set([
  "morador",
  "subsindico",
  "zelador",
  "portaria",
  "fornecedor",
  "clube_gestor",
])
const assignableByMaster = new Set([...assignableBySindico, "sindico"])

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
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    if (req.method !== "POST") return jsonResponse(405, { error: "Método não permitido" })

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error("Variáveis de ambiente ausentes.");
      return jsonResponse(500, { error: "Variáveis de ambiente do Supabase não configuradas" })
    }

    const authHeader = req.headers.get("Authorization") ?? ""
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResponse(401, { error: "Não autenticado" })
    }

    const caller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user: callerUser }, error: callerUserError } = await caller.auth.getUser()
    if (callerUserError || !callerUser) {
      console.error("Erro ao validar chamador:", callerUserError);
      return jsonResponse(401, { error: "Não autenticado" })
    }

    const { data: callerProfileData, error: profileError } = await admin
      .from("perfis")
      .select("role, condominio_id, ativo, status_aprovacao")
      .eq("id", callerUser.id)
      .maybeSingle()

    if (profileError) {
      console.error("Erro ao buscar perfil do chamador:", profileError);
      return jsonResponse(500, { error: "Não foi possível validar as permissões" })
    }

    const callerProfile = callerProfileData as CallerProfile | null
    const isMaster = callerProfile?.role === "super_admin"
    if (
      !callerProfile ||
      callerProfile.ativo !== true ||
      callerProfile.status_aprovacao !== true ||
      (!isMaster && callerProfile.role !== "sindico")
    ) {
      return jsonResponse(403, { error: "Sem permissão" })
    }

    // 2. Ler payload
    let payload: any
    try {
      payload = await req.json()
    } catch {
      return jsonResponse(400, { error: "JSON inválido" })
    }

    const { 
      email: rawEmail,
      nome, 
      role: requestedRole = 'morador',
      condominio_id,
      tenantSlug,
      telefone,
      bloco,
      unidade,
      horario_trabalho,
      password
    } = payload

    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
    if (!email) return jsonResponse(400, { error: "E-mail é obrigatório" })
    const normalizedPassword = typeof password === "string" && password.trim()
      ? password.trim()
      : null

    const targetCondominioId = condominio_id || callerProfile.condominio_id
    const role = String(requestedRole).trim().toLowerCase()

    if (!targetCondominioId) return jsonResponse(400, { error: "Condomínio é obrigatório" })
    if (!(isMaster ? assignableByMaster : assignableBySindico).has(role)) {
      return jsonResponse(403, { error: "Papel não permitido" })
    }
    if (!isMaster && targetCondominioId !== callerProfile.condominio_id) {
      return jsonResponse(403, { error: "Sem permissão para outro condomínio" })
    }

    let invited: any
    let inviteError: any

    if (normalizedPassword) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: normalizedPassword,
        email_confirm: true,
        user_metadata: {
          nome: nome || email.split('@')[0]
        }
      })
      invited = data
      inviteError = error
    } else {
      const requestedOrigin = typeof payload.origin === "string"
        ? payload.origin
        : req.headers.get("Origin")
      let redirectUrl: string | undefined

      if (requestedOrigin) {
        try {
          const url = new URL(requestedOrigin)
          if (url.protocol === "https:" || url.protocol === "http:") {
            const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1"
            if (tenantSlug && !isLocal) {
              const domain = url.hostname.split('.').slice(-2).join('.')
              url.hostname = `${tenantSlug}.${domain}`
            }
            url.pathname = tenantSlug && isLocal ? `/${tenantSlug}/set-password` : "/set-password"
            url.search = ""
            url.hash = ""
            redirectUrl = url.toString()
          }
        } catch {
          redirectUrl = undefined
        }
      }

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          nome: nome || email.split('@')[0]
        },
      })
      invited = data
      inviteError = error
    }

    if (inviteError) {
      console.error("Erro na criação/convite Auth:", inviteError.message)
      return jsonResponse(400, { 
        error: inviteError.message,
        details: "Erro ao criar/convidar usuário no Supabase Auth." 
      })
    }

    // 5. Upsert no perfil publico
    const { error: upsertError } = await admin
      .from("perfis")
      .upsert({
        id: invited.user.id,
        condominio_id: targetCondominioId,
        role,
        nome: nome || email.split('@')[0],
        email,
        telefone,
        bloco,
        unidade,
        horario_trabalho,
        status_aprovacao: true, // Convidados pelo admin já nascem aprovados
        ativo: true,
        primeiro_acesso: !normalizedPassword
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error("Erro no upsert de perfil:", upsertError);
      return jsonResponse(500, { error: "Erro ao criar perfil: " + upsertError.message })
    }

    return jsonResponse(200, { 
      message: "Convite enviado com sucesso!",
      userId: invited.user.id 
    })
  } catch (error: any) {
    console.error("Erro interno não tratado na Edge Function:", error);
    return jsonResponse(500, { error: "Erro interno no servidor", details: error.message })
  }
})
