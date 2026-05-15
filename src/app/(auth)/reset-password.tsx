import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"
import { ShieldCheck, Lock } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { tenant } = useTenantStore()
  const navigate = useNavigate()
  const tenantSlug = tenant?.slug || null

  useEffect(() => {
    // Quando o usuário clica no link do e-mail, o Supabase anexa o access_token na URL (hash).
    // O Supabase SDK processa isso e salva a sessão no localStorage automaticamente, 
    // então a gente verifica se ele pegou erros na hash
    const hash = window.location.hash
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const errorDescription = params.get('error_description')
      toast.error("Link inválido", {
        description: errorDescription?.replace(/\+/g, ' ') || "Solicite a recuperação de senha novamente."
      })
      navigate(withTenantPrefix("/login", tenantSlug), { replace: true })
    }
  }, [navigate, tenantSlug])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Atualizar o perfil para marcar que o primeiro acesso foi concluído
      const { data: { user } } = await supabase.auth.getUser()
      let isMorador = false;
      
      if (user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .update({ primeiro_acesso: false })
          .eq('id', user.id)
          .select('role')
          .single()
          
        isMorador = perfil?.role === 'morador'
      }

      toast.success("Senha definida com sucesso!")
      
      if (isMorador) {
        navigate(withTenantPrefix("/portal/comunicados", tenantSlug), { replace: true })
      } else {
        navigate(withTenantPrefix("/login", tenantSlug), { replace: true })
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex bg-muted/20 min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg pb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Nova Senha</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80 font-medium">
            Defina sua nova senha de acesso ao portal informativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4" /> Nova Senha
              </label>
              <Input
                type="password"
                placeholder="No mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4" /> Confirmar Senha
              </label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50/50 rounded-b-lg border-t py-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest w-full">
            Dica: Use uma combinação de letras e números para maior segurança.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
