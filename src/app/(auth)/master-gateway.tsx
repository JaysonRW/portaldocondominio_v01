import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useAuthStore } from "../../stores/authStore"
import { ShieldCheck } from "lucide-react"

export default function MasterGateway() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, perfil } = useAuthStore()
  const navigate = useNavigate()

  const MASTER_EMAIL = "propagoumkd@gmail.com"

  useEffect(() => {
    const isMaster = user?.email === MASTER_EMAIL || perfil?.role === 'super_admin'
    if (isMaster) {
      navigate("/painel-master", { replace: true })
    }
  }, [user, perfil, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    if (cleanEmail !== MASTER_EMAIL) {
      toast.error("Acesso Negado", {
        description: "Este e-mail não possui privilégios Master.",
      })
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast.success("Link enviado!", {
        description: "Verifique seu e-mail para acessar o painel global.",
      })
    } catch (error: any) {
      toast.error("Erro no acesso", {
        description: error.message || "Tente novamente mais tarde.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
      <Card className="w-full max-w-sm border-none shadow-2xl bg-white rounded-[32px] overflow-hidden">
        <div className="h-2 bg-emerald-500 w-full" />
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Master Control</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Digite seu e-mail administrativo para acessar o controle global da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                placeholder="adm@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 focus:ring-emerald-500"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all" 
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Solicitar Acesso Master"}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Acesso Restrito &bull; SaaS Condomínio Smart
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
