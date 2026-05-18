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

    // 1. Validar o chamador
    const authHeader = req.headers.get("Authorization") ?? ""
    const caller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: callerUser }, error: callerUserError } = await caller.auth.getUser()
    if (callerUserError || !callerUser) {
      console.error("Erro ao validar chamador:", callerUserError);
      return jsonResponse(401, { error: "Não autenticado" })
    }

    // Buscar perfil do chamador para validar permissão
    const { data: callerProfile, error: profileError } = await caller
      .from("perfis")
      .select("role, condominio_id")
      .eq("id", callerUser.id)
      .single()

    if (profileError || !callerProfile) {
      console.error("Erro ao buscar perfil do chamador:", profileError);
      return jsonResponse(403, { error: "Perfil do chamador não encontrado" })
    }

    // 2. Ler payload
    let payload: any
    try {
      payload = await req.json()
    } catch {
      return jsonResponse(400, { error: "JSON inválido" })
    }

    const { 
      email, 
      nome, 
      role = 'morador', 
      condominio_id,
      tenantSlug,
      telefone,
      bloco,
      unidade,
      horario_trabalho
    } = payload

    if (!email) return jsonResponse(400, { error: "E-mail é obrigatório" })

    // 3. Validar permissões de convite
    const targetCondominioId = condominio_id || callerProfile.condominio_id
    
    if (callerProfile.role === 'super_admin') {
      // Master pode tudo
    } else if (callerProfile.role === 'sindico') {
      // Síndico só convida para o próprio condomínio e não pode convidar super_admin
      if (targetCondominioId !== callerProfile.condominio_id) {
        return jsonResponse(403, { error: "Você só pode convidar usuários para o seu próprio condomínio." })
      }
      if (role === 'super_admin') {
        return jsonResponse(403, { error: "Você não tem permissão para criar um Super Admin." })
      }
    } else {
      // Moradores e Fornecedores não convidam ninguém
      return jsonResponse(403, { error: "Você não tem permissão para convidar usuários." })
    }

    // 4. Executar convite (Admin API)
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Determinar a URL de redirecionamento correta baseada no tenant e ambiente
    const isLocal = payload.origin?.includes('localhost') || payload.origin?.includes('127.0.0.1')
    const baseUrl = payload.origin || ''
    let redirectUrl = `${baseUrl}/set-password`

    if (tenantSlug) {
      if (isLocal) {
        redirectUrl = `${baseUrl}/${tenantSlug}/set-password`
      } else {
        try {
          const url = new URL(baseUrl)
          const domain = url.hostname.split('.').slice(-2).join('.')
          redirectUrl = `${url.protocol}//${tenantSlug}.${domain}/set-password`
        } catch (e) {
          console.error("URL Base inválida:", baseUrl);
        }
      }
    }

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        role,
        condominio_id: targetCondominioId,
        nome: nome || email.split('@')[0]
      },
    })

    if (inviteError) {
      console.error("Erro no convite Auth:", inviteError.message)
      return jsonResponse(400, { 
        error: inviteError.message,
        details: "Erro ao disparar convite via Supabase Auth. Verifique se o e-mail já existe ou se o SMTP está configurado." 
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
        primeiro_acesso: true // Força definição de senha
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
