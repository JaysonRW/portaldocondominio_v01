import { useEffect } from "react"
import { useNavigate } from "react-router"
import { supabase } from "../../lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"

export default function AuthCallback() {
  const navigate = useNavigate()
  const { tenant } = useTenantStore()

  useEffect(() => {
    const checkSession = async () => {
      // 1. Verificar se o Supabase retornou um erro na hash da URL
      const hash = window.location.hash
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const errorCode = params.get('error_code')
        const errorDescription = params.get('error_description')

        if (errorCode === 'otp_expired') {
          toast.error("Link expirado", {
            description: "Seu link mágico expirou (validade de 1h). Solicite um novo acesso.",
            duration: 6000,
          })
        } else {
          toast.error("Falha na autenticação", {
            description: errorDescription?.replace(/\+/g, ' ') || "Tente solicitar um novo link.",
          })
        }
        navigate(withTenantPrefix("/login", tenant?.slug), { replace: true })
        return
      }

      // 2. Caso normal — verificar sessão estabelecida
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        toast.error("Erro na autenticação", {
          description: error.message,
        })
        navigate(withTenantPrefix("/login", tenant?.slug), { replace: true })
        return
      }

      if (session) {
        // Obter claims do JWT (app_metadata)
        const role = session.user.app_metadata?.role
        const ativo = session.user.app_metadata?.ativo

        toast.success("Bem-vindo!", {
          description: "Sessão autenticada com sucesso.",
        })

        // 1. Caso MASTER
        if (role === 'super_admin' || session.user.email === "propagoumkd@gmail.com") {
          navigate("/painel-master", { replace: true })
          return
        }

        // 2. Caso conta inativa
        if (ativo === false) {
          toast.error("Conta inativa", { description: "Sua conta foi desativada pela administração." })
          await supabase.auth.signOut()
          navigate(withTenantPrefix("/login", tenant?.slug), { replace: true })
          return
        }

        // 3. Caso MORADOR
        if (role === 'morador') {
          navigate(withTenantPrefix("/portal/comunicados", tenant?.slug), { replace: true })
          return
        }

        // 4. Caso SINDICO / ADM
        if (role === 'sindico' || role === 'subsindico') {
          navigate(withTenantPrefix("/painel", tenant?.slug), { replace: true })
          return
        }

        // 5. Caso ZELADOR
        if (role === 'zelador') {
          navigate(withTenantPrefix("/painel", tenant?.slug), { replace: true })
          return
        }

        // 5. Caso FORNECEDOR (Placeholder)
        if (role === 'fornecedor') {
          navigate("/painel-fornecedor", { replace: true })
          return
        }

        // Fallback
        navigate(withTenantPrefix("/", tenant?.slug), { replace: true })
      } else {
        navigate(withTenantPrefix("/login", tenant?.slug), { replace: true })
      }
    }

    checkSession()
  }, [navigate, tenant?.slug])

  return (
    <div className="flex h-screen items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Autenticando sua sessão...</p>
      </div>
    </div>
  )
}
