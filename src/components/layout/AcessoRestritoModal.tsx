import { Link, useNavigate } from "react-router"
import { ShieldCheck, LogIn, UserPlus, Clock, Mail, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { withTenantPrefix } from "../../lib/utils"
import { useAuthStore } from "../../stores/authStore"
import { supabase } from "../../lib/supabase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { useState } from "react"
import type { ReactNode } from "react"

interface AcessoRestritoModalProps {
  tenantName?: string
  tenantSlug?: string
  to?: string
  children: ReactNode
}

type ModalView = "choice" | "login" | "forgot"

export function AcessoRestritoModal({ tenantName, tenantSlug, to = "/", children }: AcessoRestritoModalProps) {
  const { user, perfil } = useAuthStore()
  const navigate = useNavigate()
  const [view, setView] = useState<ModalView>("choice")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const isAprovado = user && perfil && perfil.status_aprovacao === true
  const isPending = user && perfil && perfil.status_aprovacao === false

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (error) throw error

      toast.success("Login realizado com sucesso!")
      setIsOpen(false)
    } catch (error: any) {
      toast.error("Erro ao entrar: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Insira seu e-mail para recuperar a senha.")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}${withTenantPrefix("/reset-password", tenantSlug)}`,
      })
      if (error) throw error
      toast.success("E-mail de recuperação enviado!")
      setView("login")
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isAprovado) {
      e.preventDefault()
      navigate(withTenantPrefix(to, tenantSlug))
    }
  }

  if (isAprovado) {
    return (
      <div onClick={handleClick} className="cursor-pointer h-full">
        {children}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setView("choice")
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {view === "choice" ? <ShieldCheck className="w-6 h-6 text-primary" /> : 
             view === "login" ? <LogIn className="w-6 h-6 text-primary" /> :
             <Mail className="w-6 h-6 text-primary" />}
          </div>
          <DialogTitle className="text-2xl font-bold">
            {isPending ? "Aguardando Aprovação" : 
             view === "choice" ? "Portal do Morador" :
             view === "login" ? "Entrar no Portal" :
             "Recuperar Senha"}
          </DialogTitle>
          <DialogDescription>
            {isPending 
              ? `Sua solicitação para o ${tenantName || "condomínio"} ainda está sendo analisada pelo síndico.`
              : view === "choice" ? `Escolha como deseja acessar o portal do ${tenantName || "seu condomínio"}.` :
                view === "login" ? "Insira suas credenciais de acesso." :
                "Enviaremos um link de recuperação para o seu e-mail."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isPending ? (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
              <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
              <p className="text-sm font-bold text-amber-900">
                Olá {perfil?.nome}! Recebemos seu pedido. <br/>
                O síndico validará seus dados em breve.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="https://wa.me/5541995343245?text=Ola%20sindico,%20solicitei%20acesso%20ao%20portal" target="_blank">
                  Falar com Síndico
                </Link>
              </Button>
            </div>
          ) : view === "choice" ? (
            <>
              <Button 
                className="h-24 flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-[#C5D932]/10 border border-slate-100 hover:border-[#C5D932] transition-all rounded-2xl group"
                variant="ghost"
                onClick={() => setView("login")}
              >
                <div className="flex items-center gap-2 font-black text-xl text-slate-800 group-hover:text-[#1a2e25]">
                  <LogIn className="w-6 h-6 text-[#C5D932]" />
                  Já sou cadastrado
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Entrar com meu e-mail</span>
              </Button>

              <Button 
                className="h-24 flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-[#C5D932]/10 border border-slate-100 hover:border-[#C5D932] transition-all rounded-2xl group"
                variant="ghost"
                asChild
              >
                <Link to={withTenantPrefix("/join", tenantSlug)}>
                  <div className="flex items-center gap-2 font-black text-xl text-slate-800 group-hover:text-[#1a2e25]">
                    <UserPlus className="w-6 h-6 text-[#C5D932]" />
                    Quero me cadastrar
                  </div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Solicitar adesão ao condomínio</span>
                </Link>
              </Button>
            </>
          ) : view === "login" ? (
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-right text-xs text-primary hover:underline font-bold"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Entrar no Portal
              </Button>
              <Button variant="ghost" type="button" onClick={() => setView("choice")} disabled={isLoading} className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-2" /> Voltar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Seu e-mail cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar link de recuperação
              </Button>
              <Button variant="ghost" type="button" onClick={() => setView("login")} disabled={isLoading} className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-2" /> Voltar para o Login
              </Button>
            </form>
          )}
        </div>

        <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
          Plataforma Smart Condomínio
        </div>
      </DialogContent>
    </Dialog>
  )
}
