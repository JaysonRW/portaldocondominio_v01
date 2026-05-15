import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router"
import { toast } from "sonner"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { withTenantPrefix } from "../../lib/utils"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { tenant } = useTenantStore()
  const { user, perfil } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const tenantSlug = tenant?.slug || null

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('master') === 'true') {
      setEmail("propagoumkd@gmail.com")
    }
  }, [location])

  useEffect(() => {
    if (user && perfil !== undefined) {
      const role = perfil?.role
      const isProfileIncomplete = !perfil?.unidade

      // 1. Caso MASTER
      if (role === 'super_admin' || user.email === "propagoumkd@gmail.com") {
        navigate("/painel-master", { replace: true })
        return
      }

      // 2. Caso perfil incompleto
      if (isProfileIncomplete) {
        navigate(withTenantPrefix("/onboarding", tenantSlug), { replace: true })
        return
      }

      // 3. Caso MORADOR
      if (role === 'morador') {
        navigate(withTenantPrefix("/portal/comunicados", tenantSlug), { replace: true })
        return
      }

      // 4. Caso SINDICO
      if (role === 'sindico' || role === 'subsindico') {
        navigate(withTenantPrefix("/painel", tenantSlug), { replace: true })
        return
      }

      // 5. Caso ZELADOR
      if (role === 'zelador') {
        navigate(withTenantPrefix("/painel", tenantSlug), { replace: true })
        return
      }

      // Fallback padrão
      navigate(withTenantPrefix("/", tenantSlug), { replace: true })
    }
  }, [user, perfil, tenantSlug, navigate])

  const isMasterMode = new URLSearchParams(location.search).get('master') === 'true'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      })

      if (error) throw error

      toast.success("Login realizado com sucesso!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Tente novamente mais tarde."
      toast.error("Erro ao entrar", {
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Insira seu e-mail para recuperar a senha.")
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${withTenantPrefix("/reset-password", tenantSlug)}`,
      })
      if (error) throw error
      toast.success("E-mail de recuperação enviado!")
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message)
    }
  }

  return (
    <div className="flex items-center justify-center h-full p-4 bg-muted/20">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {isMasterMode ? "Acesso Administrativo Master" : "Fazer Login"}
          </CardTitle>
          <CardDescription>
            {isMasterMode 
              ? "Confirme seu e-mail e senha master para acessar o painel global." 
              : "Insira suas credenciais para acessar o condomínio."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">E-mail</label>
              <Input
                id="email"
                type="email"
                placeholder="morador@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Senha</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar no Portal"}
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-2">
              Não tem conta? <Link to={withTenantPrefix("/join", tenantSlug)} className="text-primary font-bold hover:underline">Solicite acesso aqui</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
