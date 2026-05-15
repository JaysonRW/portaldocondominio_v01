import { useState } from "react"
import { useTenantStore } from "../../stores/tenantStore"
import { supabase } from "../../lib/supabase"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, Phone } from "lucide-react"
import { withTenantPrefix } from "../../lib/utils"

// Máscara simples para telefone brasileiro
function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

export default function JoinCondo() {
  const { tenant } = useTenantStore()
  const navigate = useNavigate()
  const [isSuccess, setIsSuccess] = useState(false)
  const isTenantResolved = !!tenant?.id && tenant.id !== "mock"

  // States do formulário
  const [condoQuery, setCondoQuery] = useState("")
  const [isCondoDropdownOpen, setIsCondoDropdownOpen] = useState(false)
  const [selectedCondo, setSelectedCondo] = useState<{ id: string; slug: string; nome: string } | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [bloco, setBloco] = useState("")
  const [unidade, setUnidade] = useState("")
  const [vaga, setVaga] = useState("")
  const [fotoUrl, setFotoUrl] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [aceiteTermos, setAceiteTermos] = useState(false)

  const { data: condominios } = useQuery({
    queryKey: ["condominios_public_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condominios")
        .select("id, slug, nome")
        .eq("ativo", true)
        .order("nome", { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })

  const filteredCondominios = (condominios ?? [])
    .filter((c) => {
      const q = condoQuery.trim().toLowerCase()
      if (!q) return true
      return c.nome.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    })
    .slice(0, 8)

  const effectiveCondo = isTenantResolved
    ? { id: tenant!.id, slug: tenant!.slug, nome: tenant!.nome }
    : selectedCondo

  const ensureCondoSelected = () => {
    if (isTenantResolved) return { id: tenant!.id, slug: tenant!.slug, nome: tenant!.nome }
    if (selectedCondo) return selectedCondo

    const q = condoQuery.trim().toLowerCase()
    if (!q) return null

    const match =
      (condominios ?? []).find((c) => c.nome.trim().toLowerCase() === q) ??
      (condominios ?? []).find((c) => c.slug.trim().toLowerCase() === q)

    return match ? { id: match.id, slug: match.slug, nome: match.nome } : null
  }

  const submitRequest = useMutation({
    mutationFn: async () => {
      // Validação de campos obrigatórios
      if (!nome.trim() || !email.trim()) {
        throw new Error("Preencha os campos obrigatórios: Nome e E-mail.")
      }

      if (senha.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres.")
      }

      if (senha !== confirmarSenha) {
        throw new Error("As senhas não coincidem.")
      }

      if (!aceiteTermos) {
        throw new Error("Você precisa aceitar os Termos de Uso e Política de Privacidade.")
      }

      // Validação OBRIGATÓRIA da foto
      if (!fotoUrl) {
        throw new Error("A escolha de um avatar é obrigatória para identificação.")
      }

      const condo = ensureCondoSelected()
      if (!condo?.id) {
        throw new Error("Informe o nome do condomínio para vincular sua solicitação.")
      }

      // 1. Cria a solicitação no banco
      const { error: solError } = await supabase
        .from('solicitacoes_adesao')
        .insert({
          condominio_id: condo.id,
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          telefone: telefone.replace(/\D/g, ''), // Salva só números
          bloco: bloco.trim(),
          unidade: unidade.trim(),
          numero_vaga: vaga.trim(),
          foto_url: fotoUrl,
          status: 'pendente'
        })

      if (solError) throw solError

      // 2. Registra o usuário no Supabase Auth para já ter a senha
      // O trigger do banco fará o link com a solicitação recém-criada
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
            role: 'morador',
            condominio_id: condo.id
          }
        }
      })

      if (signUpError) {
        console.error("Erro no Auth SignUp:", signUpError)
        throw new Error(signUpError.message)
      }
    },
    onSuccess: () => {
      setIsSuccess(true)
      toast.success("Solicitação enviada com sucesso!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar solicitação. Tente novamente.")
    }
  })

  if (isSuccess) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Solicitação Enviada!</h2>
            <p className="text-muted-foreground">
              Seu cadastro no <strong>{effectiveCondo?.nome || tenant?.nome}</strong> foi realizado com sucesso.
              Você já pode fazer login no portal usando seu e-mail e a senha cadastrada.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate(withTenantPrefix("/login", effectiveCondo?.slug || tenant?.slug))}>
            Ir para o Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex bg-muted/20 min-h-screen py-10 items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-none">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg pb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Adesão ao Portal</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/80 font-medium">
            Solicite seu acesso exclusivo ao condomínio <strong>{effectiveCondo?.nome || tenant?.nome || "informado abaixo"}</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {!isTenantResolved && (
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-600 uppercase">Nome do Condomínio *</label>
              <Input
                value={selectedCondo ? selectedCondo.nome : condoQuery}
                onChange={(e) => {
                  setSelectedCondo(null)
                  setCondoQuery(e.target.value)
                  setIsCondoDropdownOpen(true)
                }}
                onFocus={() => setIsCondoDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsCondoDropdownOpen(false), 150)}
                placeholder="Digite para buscar..."
              />
              {isCondoDropdownOpen && filteredCondominios.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  {filteredCondominios.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedCondo({ id: c.id, slug: c.slug, nome: c.nome })
                        setCondoQuery("")
                        setIsCondoDropdownOpen(false)
                      }}
                    >
                      <div className="text-sm font-bold text-slate-800">{c.nome}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.slug}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sessão de Avatar — OBRIGATÓRIA */}
          <div className={`flex flex-col items-center gap-4 py-4 rounded-xl border-2 transition-colors ${
            fotoUrl
              ? 'bg-green-50 border-green-200'
              : 'bg-slate-50 border-dashed border-slate-200'
          }`}>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Escolha seu avatar
            </p>
            <div className="flex gap-6">
              <button 
                type="button"
                onClick={() => setFotoUrl('/avatar-M.jpg')}
                className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all hover:scale-105 ${
                  fotoUrl === '/avatar-M.jpg' ? 'border-primary shadow-lg scale-105' : 'border-white shadow-sm opacity-70 hover:opacity-100'
                }`}
              >
                <img src="/avatar-M.jpg" alt="Avatar Masculino" className="w-full h-full object-cover" />
                {fotoUrl === '/avatar-M.jpg' && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setFotoUrl('/avatar-F.jpg')}
                className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all hover:scale-105 ${
                  fotoUrl === '/avatar-F.jpg' ? 'border-primary shadow-lg scale-105' : 'border-white shadow-sm opacity-70 hover:opacity-100'
                }`}
              >
                <img src="/avatar-F.jpg" alt="Avatar Feminino" className="w-full h-full object-cover" />
                {fotoUrl === '/avatar-F.jpg' && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo *</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como no documento" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">E-mail *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail de acesso" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Celular / WhatsApp
              </label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Bloco / Torre</label>
              <Input value={bloco} onChange={(e) => setBloco(e.target.value)} placeholder="Ex: Bloco A" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Apartamento / Unidade</label>
              <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="Ex: 101" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Número da Vaga</label>
              <Input value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Ex: 12" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Crie uma Senha *</label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Confirme a Senha *</label>
              <Input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita sua senha" />
            </div>
            <div className="md:col-span-2 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    checked={aceiteTermos} 
                    onChange={(e) => setAceiteTermos(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-500 leading-tight">
                  Li e concordo com os <a href="#" className="text-primary font-bold hover:underline">Termos de Uso</a> e <a href="#" className="text-primary font-bold hover:underline">Política de Privacidade</a>, autorizando o tratamento dos meus dados para acesso ao portal do condomínio.
                </span>
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          {!fotoUrl && (
            <div className="w-full flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>A <strong>escolha de um avatar é obrigatória</strong> para validação pela administração.</span>
            </div>
          )}
          <Button
            className="w-full h-14 text-lg font-bold shadow-lg"
            onClick={() => submitRequest.mutate()}
            disabled={submitRequest.isPending}
          >
            {submitRequest.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enviando...</>
            ) : "Solicitar Adesão"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-tight">
            Seus dados serão processados conforme a LGPD e validados pelo síndico.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
