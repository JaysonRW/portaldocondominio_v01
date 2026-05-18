import { useState, useEffect } from "react"
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

  // 1. Busca todas as unidades desse condomínio cadastrado
  const { data: dbUnidades } = useQuery({
    queryKey: ["condominio_unidades", effectiveCondo?.id],
    queryFn: async () => {
      if (!effectiveCondo?.id) return []
      const { data, error } = await supabase
        .from("condominio_unidades")
        .select("id, bloco, unidade")
        .eq("condominio_id", effectiveCondo.id)
        .eq("ativo", true)
        .order("bloco", { ascending: true })
        .order("unidade", { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!effectiveCondo?.id,
  })

  // Limpa bloco/unidade se o condomínio mudar
  useEffect(() => {
    setBloco("")
    setUnidade("")
  }, [effectiveCondo?.id])

  const temDbUnidades = dbUnidades && dbUnidades.length > 0
  const dbBlocos = temDbUnidades
    ? Array.from(new Set(dbUnidades.map((u) => u.bloco).filter(Boolean))) as string[]
    : []
  const condoHasBlocos = dbBlocos.length > 0

  const dbUnidadesFiltradas = temDbUnidades
    ? dbUnidades.filter((u) => !bloco || u.bloco === bloco)
    : []

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
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
        {/* Background Decorativo */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#C5D932]/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a2e25]/10 blur-3xl" />

        <Card className="w-full max-w-md text-center p-10 space-y-8 shadow-2xl shadow-slate-200/50 border border-white/50 bg-white/80 backdrop-blur-xl relative z-10 rounded-[2.5rem] animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#C5D932] to-[#e4f562] text-[#1a2e25] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#C5D932]/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-800">Solicitação Enviada!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Seu cadastro no <strong className="text-slate-800">{effectiveCondo?.nome || tenant?.nome}</strong> foi realizado com sucesso.
              Você já pode fazer login no portal usando seu e-mail e a senha cadastrada.
            </p>
          </div>
          <Button 
            className="w-full h-14 text-base font-bold shadow-lg shadow-[#1a2e25]/20 bg-[#1a2e25] hover:bg-[#1a2e25]/90 text-white rounded-xl transition-all"
            onClick={() => navigate(withTenantPrefix("/login", effectiveCondo?.slug || tenant?.slug))}
          >
            Ir para o Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden bg-slate-50">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C5D932]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1a2e25]/10 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg shadow-2xl shadow-slate-200/50 border border-white/50 bg-white/80 backdrop-blur-xl relative z-10 overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C5D932] to-[#1a2e25]" />
        
        <CardHeader className="pt-10 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1a2e25] to-slate-800 flex items-center justify-center shadow-lg shadow-[#1a2e25]/20">
            <ShieldCheck className="w-8 h-8 text-[#C5D932]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-800">Adesão ao Portal</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2 leading-relaxed max-w-sm mx-auto">
              Solicite seu acesso exclusivo ao condomínio <strong className="text-slate-800">{effectiveCondo?.nome || tenant?.nome || "informado abaixo"}</strong>.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 md:px-8 pt-2">
          {!isTenantResolved && (
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-600 uppercase">Nome do Condomínio *</label>
              <Input
                className="h-12 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]"
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
          <div className={`flex flex-col items-center gap-5 p-6 rounded-2xl border-2 transition-all duration-300 ${
            fotoUrl
              ? 'bg-[#C5D932]/10 border-[#C5D932]/30 shadow-inner'
              : 'bg-white/50 border-dashed border-slate-200 hover:border-slate-300'
          }`}>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Escolha seu avatar
            </p>
            <div className="flex gap-6">
              <button 
                type="button"
                onClick={() => setFotoUrl('/avatar-M.jpg')}
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                  fotoUrl === '/avatar-M.jpg' ? 'border-[#C5D932] shadow-lg shadow-[#C5D932]/30 scale-110' : 'border-white shadow-sm opacity-60 hover:opacity-100 hover:scale-105 filter grayscale hover:grayscale-0'
                }`}
              >
                <img src="/avatar-M.jpg" alt="Avatar Masculino" className="w-full h-full object-cover" />
                {fotoUrl === '/avatar-M.jpg' && (
                  <div className="absolute inset-0 bg-[#1a2e25]/20 flex items-center justify-center backdrop-blur-[2px]">
                    <CheckCircle2 className="w-8 h-8 text-[#C5D932] drop-shadow-md" />
                  </div>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setFotoUrl('/avatar-F.jpg')}
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                  fotoUrl === '/avatar-F.jpg' ? 'border-[#C5D932] shadow-lg shadow-[#C5D932]/30 scale-110' : 'border-white shadow-sm opacity-60 hover:opacity-100 hover:scale-105 filter grayscale hover:grayscale-0'
                }`}
              >
                <img src="/avatar-F.jpg" alt="Avatar Feminino" className="w-full h-full object-cover" />
                {fotoUrl === '/avatar-F.jpg' && (
                  <div className="absolute inset-0 bg-[#1a2e25]/20 flex items-center justify-center backdrop-blur-[2px]">
                    <CheckCircle2 className="w-8 h-8 text-[#C5D932] drop-shadow-md" />
                  </div>
                )}
              </button>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo *</label>
              <Input className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como no documento" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">E-mail *</label>
              <Input className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail de acesso" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Celular / WhatsApp
              </label>
              <Input
                className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                type="tel"
              />
            </div>
            {temDbUnidades ? (
              <>
                {condoHasBlocos ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Bloco / Torre *</label>
                      <select
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus-visible:ring-[#C5D932] outline-none text-slate-750 font-bold"
                        value={bloco}
                        onChange={(e) => {
                          setBloco(e.target.value)
                          setUnidade("")
                        }}
                      >
                        <option value="">Selecione o Bloco</option>
                        {dbBlocos.map((b) => (
                          <option key={b} value={b}>
                            Bloco {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Apartamento / Unidade *</label>
                      <select
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus-visible:ring-[#C5D932] outline-none text-slate-750 font-bold disabled:opacity-50"
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        disabled={!bloco}
                      >
                        <option value="">Selecione a Unidade</option>
                        {dbUnidadesFiltradas.map((u) => (
                          <option key={u.id} value={u.unidade}>
                            {u.unidade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Apartamento / Unidade *</label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm focus-visible:ring-[#C5D932] outline-none text-slate-750 font-bold"
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                    >
                      <option value="">Selecione a Unidade</option>
                      {dbUnidades.map((u) => (
                        <option key={u.id} value={u.unidade}>
                          {u.unidade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Bloco / Torre</label>
                  <Input 
                    className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" 
                    value={bloco} 
                    onChange={(e) => setBloco(e.target.value)} 
                    placeholder="Ex: Bloco A" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Apartamento / Unidade</label>
                  <Input 
                    className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" 
                    value={unidade} 
                    onChange={(e) => setUnidade(e.target.value)} 
                    placeholder="Ex: 101" 
                  />
                </div>
              </>
            )}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Número da Vaga</label>
              <Input className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" value={vaga} onChange={(e) => setVaga(e.target.value)} placeholder="Ex: 12" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Crie uma Senha *</label>
              <Input className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Confirme a Senha *</label>
              <Input className="h-11 rounded-xl bg-white/50 border-slate-200 focus-visible:ring-[#C5D932]" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita sua senha" />
            </div>
            <div className="md:col-span-2 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    checked={aceiteTermos} 
                    onChange={(e) => setAceiteTermos(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#C5D932] focus:ring-[#C5D932] accent-[#C5D932] cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">
                  Li e concordo com os <a href="#" className="text-[#1a2e25] font-bold hover:underline">Termos de Uso</a> e <a href="#" className="text-[#1a2e25] font-bold hover:underline">Política de Privacidade</a>, autorizando o tratamento dos meus dados para acesso ao portal do condomínio.
                </span>
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-5 border-t border-slate-100 pt-8 px-6 md:px-8 pb-8 bg-slate-50/50">
          {!fotoUrl && (
            <div className="w-full flex items-center gap-3 text-xs font-medium text-amber-700 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl px-4 py-3 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
              <span>A <strong>escolha de um avatar é obrigatória</strong> para validação pela administração.</span>
            </div>
          )}
          <Button
            className="w-full h-14 text-base font-bold shadow-lg shadow-[#1a2e25]/20 bg-[#1a2e25] hover:bg-[#1a2e25]/90 text-white rounded-xl transition-all"
            onClick={() => submitRequest.mutate()}
            disabled={submitRequest.isPending}
          >
            {submitRequest.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enviando Solicitação...</>
            ) : "Solicitar Adesão ao Condomínio"}
          </Button>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
            Seus dados serão processados conforme a LGPD e validados pelo síndico.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
