import { useTenantStore } from "../../stores/tenantStore"
import { useNavigate } from "react-router"
import { useState, useMemo } from "react"
import { useAuthStore } from "../../stores/authStore"
import { supabase } from "../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { UserCircle, Building2, Plus, Settings2, Globe, ShieldCheck, Layers, Search, Mail, ExternalLink, CheckCircle, Clock, Copy, Trash2, PauseCircle, MoreVertical, XCircle, Pencil, ShoppingBag, KeyRound, DollarSign, Users } from "lucide-react"
import { MasterSidebar, type MasterSection } from "../../components/layout/MasterSidebar"
import { toast } from "sonner"
import { Skeleton } from "../../components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { isLocalhostHost, isMasterUser } from "../../lib/utils"
import { ParceiroFormModal } from "./clube/ParceiroFormModal"

export default function MasterDashboard() {
  const { perfil: perfilFromStore, user } = useAuthStore()
  const { setTenant, setIsMasterMode } = useTenantStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<MasterSection>("dashboard")
  const [settingsTab, setSettingsTab] = useState<"system" | "users">("system")
  const [condoSearch, setCondoSearch] = useState("")
  const [openModal, setOpenModal] = useState(false)
  const [manageCondo, setManageCondo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [openPartnerModal, setOpenPartnerModal] = useState(false)
  const [partnerToEdit, setPartnerToEdit] = useState<any | null>(null)
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("")
  const [partnerCondoFilter, setPartnerCondoFilter] = useState<string>("all")

  // Form states for new Condo
  const [nome, setNome] = useState("")
  const [slug, setSlug] = useState("")
  const [corP, setCorP] = useState("#3E594D")
  const corS = "#A3C168"

  const [sindicoNome, setSindicoNome] = useState("")
  const [sindicoEmail, setSindicoEmail] = useState("")
  const [sindicoWhatsapp, setSindicoWhatsapp] = useState("")
  const [lastCreatedAdminUrl, setLastCreatedAdminUrl] = useState<string | null>(null)
  const [lastCreatedLoginUrl, setLastCreatedLoginUrl] = useState<string | null>(null)

  const [plano, setPlano] = useState("basico")
  const [isInvitingSindico, setIsInvitingSindico] = useState(false)
  const [inviteForm, setInviteForm] = useState({ nome: "", email: "", whatsapp: "" })

  // Usa o perfil já carregado pelo AppShell em vez de fazer nova query
  const meuPerfil = perfilFromStore

  // 1. Fetch todos os Condomínios — leitura pública, não precisa aguardar perfil
  const { data: condominios, isLoading: loadingCondos } = useQuery({
    queryKey: ['all_condominios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) {
        console.error('[Master] Erro ao buscar condomínios:', error)
        throw error
      }
      return data || []
    },
    enabled: true // RLS pública, não precisa de guarda
  })

  // 2. Fetch todos os Perfis (Global)
  const { data: perfis, isLoading: loadingPerfis } = useQuery({
    queryKey: ['all_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*, condominios(nome)')
        .order('criado_em', { ascending: false })
      if (error) {
        console.error('[Master] Erro ao buscar perfis — verifique RLS:', error)
        throw error
      }
      return data || []
    },
    enabled: activeSection === "settings" && settingsTab === "users",
    retry: 1,
  })

  // 3. Fetch Solicitações de Adesão (sempre habilitado — super_admin precisa do badge)
  const { data: solicitacoes, isLoading: loadingSols } = useQuery({
    queryKey: ['all_solicitacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_adesao')
        .select('*, condominios(nome)')
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false })
      if (error) {
        console.error('[Master] Erro ao buscar solicitações — verifique RLS:', error)
        throw error
      }
      return data || []
    },
    enabled: true, // RLS garante que só admins veem
    retry: 1,
  })

  // 4. Fetch Detalhes do Condomínio Selecionado (Síndico + Stats)
  const { data: condoDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['condo_details', manageCondo?.id],
    queryFn: async () => {
      if (!manageCondo?.id || manageCondo.id === '00000000-0000-0000-0000-000000000000') return null
      
      const [sindicos, moradoresCount, solicitacoesCount] = await Promise.all([
        supabase.from('perfis').select('*').eq('condominio_id', manageCondo.id).eq('role', 'sindico'),
        supabase.from('perfis').select('id', { count: 'exact', head: true }).eq('condominio_id', manageCondo.id),
        supabase.from('solicitacoes_adesao').select('id', { count: 'exact', head: true }).eq('condominio_id', manageCondo.id).eq('status', 'pendente')
      ])

      return {
        sindicos: sindicos.data || [],
        totalMoradores: moradoresCount.count || 0,
        pendencias: solicitacoesCount.count || 0
      }
    },
    enabled: !!manageCondo?.id
  })

  const createCondo = useMutation({
    mutationFn: async () => {
      if (!nome || !slug) throw new Error("Preencha nome e slug!")
      const normalizedSlug = slug.toLowerCase().trim()
      const { data: created, error } = await supabase
        .from('condominios')
        .insert({
        nome,
        slug: normalizedSlug,
        cor_primaria: corP,
        cor_secundaria: corS,
        plano,
        modulos_ativos: plano === 'pro' 
          ? { comunicados: true, assembleias: true, arquivos: true, galeria: true, clube: true, faq: true }
          : { comunicados: true, assembleias: false, arquivos: true, galeria: false, clube: false, faq: true }
      })
        .select('id, slug')
        .single()

      if (error) throw error
      if (!created?.id) throw new Error("Falha ao criar condomínio")

      const isLocal = isLocalhostHost(window.location.hostname)
      const origin = window.location.origin
      const tenantOrigin = isLocal ? origin : `${window.location.protocol}//${normalizedSlug}.${window.location.hostname}`
      const adminUrl = isLocal ? `${origin}/${normalizedSlug}/painel` : `${tenantOrigin}/painel`
      const loginUrl = isLocal ? `${origin}/${normalizedSlug}/login` : `${tenantOrigin}/login`

      setLastCreatedAdminUrl(adminUrl)
      setLastCreatedLoginUrl(loginUrl)

      const shouldInviteSindico =
        sindicoEmail.trim().length > 0 && sindicoWhatsapp.trim().length > 0

      if (shouldInviteSindico) {
        const { error: fnError } = await supabase.functions.invoke('invite-condominio-user', {
          body: {
            role: "sindico",
            condominio_id: created.id,
            nome: sindicoNome.trim().length > 0 ? sindicoNome.trim() : null,
            email: sindicoEmail.trim(),
            telefone: sindicoWhatsapp.trim(),
            origin: origin,
          },
        })

        if (fnError) throw new Error(fnError.message)
      }
    },
    onSuccess: () => {
      toast.success("Novo Condomínio ativado com sucesso!")
      setOpenModal(false)
      setNome(""); setSlug("")
      setSindicoNome("")
      setSindicoEmail("")
      setSindicoWhatsapp("")
      queryClient.invalidateQueries({ queryKey: ['all_condominios'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao criar: " + error.message)
    }
  })

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const { error } = await supabase.from('perfis').update({ role }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['all_profiles'] })
    }
  })

  const updateCondo = useMutation({
    mutationFn: async ({ userId, condoId }: { userId: string, condoId: string }) => {
      const { error } = await supabase.from('perfis').update({ condominio_id: condoId }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Vínculo de condomínio atualizado!")
      queryClient.invalidateQueries({ queryKey: ['all_profiles'] })
    }
  })

  const updateSoliStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'aprovado' | 'recusado' }) => {
      const { error } = await supabase.from('solicitacoes_adesao').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success(`Solicitação ${variables.status === 'aprovado' ? 'aprovada' : 'recusada'}!`)
      queryClient.invalidateQueries({ queryKey: ['all_solicitacoes'] })
    }
  })

  const deleteCondo = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('condominios')
        .delete()
        .eq('id', id)
        .select()
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Permissão negada ou condomínio não encontrado.")
      }
    },
    onSuccess: (_, deletedId) => {
      toast.success("Condomínio removido com sucesso!")
      // Atualiza o cache local imediatamente para remover o card
      queryClient.setQueryData(['all_condominios'], (old: any[]) => {
        return old ? old.filter(c => c.id !== deletedId) : []
      })
      // Força a invalidação para garantir sincronia com o banco
      queryClient.invalidateQueries({ queryKey: ['all_condominios'] })
      queryClient.invalidateQueries({ queryKey: ['all_profiles'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message)
    }
  })

  const updateCondoPlan = useMutation({
    mutationFn: async ({ id, plano }: { id: string, plano: string }) => {
      const modulos = plano === 'pro' 
        ? { comunicados: true, assembleias: true, arquivos: true, galeria: true, clube: true, faq: true }
        : { comunicados: true, assembleias: false, arquivos: true, galeria: false, clube: false, faq: true }
      
      const { error } = await supabase.from('condominios').update({ plano, modulos_ativos: modulos }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['all_condominios'] })
    }
  })

  const inviteUser = useMutation({
    mutationFn: async ({ email, nome, role, condominio_id, telefone }: any) => {
      // Obter o slug do condomínio para o redirect correto
      const condo = condominios?.find((c: any) => c.id === condominio_id)
      const targetSlug = condo?.slug || ""

      const { error } = await supabase.functions.invoke('invite-condominio-user', {
        body: {
          email,
          nome,
          role,
          condominio_id,
          telefone,
          tenantSlug: targetSlug,
          origin: window.location.origin
        }
      })
      
      if (error) {
        console.error("Erro da Edge Function:", error);
        
        let errorMessage = error.message;
        
        // Tenta extrair a resposta JSON da Edge Function caso ela seja uma FunctionsHttpError
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body && body.error) {
              errorMessage = body.error;
            } else if (body && body.details) {
              errorMessage = body.details;
            }
          }
        } catch (e) {
          console.error("Falha ao extrair body do erro:", e);
        }
        
        // Se não for um objeto context legível (ex: FunctionsRelayError), usamos a mensagem base
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!")
      setIsInvitingSindico(false)
      setInviteForm({ nome: "", email: "", whatsapp: "" })
      queryClient.invalidateQueries({ queryKey: ['condo_details'] })
      queryClient.invalidateQueries({ queryKey: ['all_profiles'] })
    },
    onError: (error: any) => {
      toast.error("Falha ao enviar convite", {
        description: error.message
      })
    }
  })

  const toggleCondoStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { error } = await supabase.from('condominios').update({ ativo: active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success(`Condomínio ${vars.active ? 'ativado' : 'desativado'} com sucesso!`)
      // Atualiza o estado local imediatamente
      queryClient.setQueryData(['all_condominios'], (old: any[]) => {
        return old ? old.map(c => c.id === vars.id ? { ...c, ativo: vars.active } : c) : []
      })
      queryClient.invalidateQueries({ queryKey: ['all_condominios'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar status: " + error.message)
    }
  })

  const handleImpersonate = (condo: any) => {
    setTenant(condo)
    setIsMasterMode(true)
    const isLocal = isLocalhostHost(window.location.hostname)
    const targetPath = isLocal ? `/${condo.slug}/painel` : `/painel`
    navigate(targetPath)
  }

  const isMaster = isMasterUser(user, meuPerfil)

  const condoById = useMemo(() => {
    const map = new Map<string, { nome: string; slug: string }>()
    condominios?.forEach((c: { id: string; nome: string; slug: string }) => {
      map.set(c.id, { nome: c.nome, slug: c.slug })
    })
    return map
  }, [condominios])

  // Queries & Mutations para Gerenciamento de Parceiros (Clube)
  const {
    data: allPartners,
    isLoading: loadingPartners,
    isError: partnersQueryFailed,
    error: partnersQueryError,
  } = useQuery({
    queryKey: ['all_partners'],
    queryFn: async () => {
      // Mesmo padrão do painel síndico: select simples (evita falha no embed condominios)
      const { data, error } = await supabase
        .from('clube_parceiros')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) {
        console.error('[Master] Erro ao buscar parceiros:', error)
        throw error
      }
      return data || []
    },
    enabled: (activeSection === "partners" || activeSection === "dashboard") && isMaster,
    retry: 1,
  })

  const partnersEnriched = useMemo(
    () =>
      (allPartners ?? []).map((p: { condominio_id: string | null }) => ({
        ...p,
        condominios: p.condominio_id ? condoById.get(p.condominio_id) ?? null : null,
      })),
    [allPartners, condoById]
  )

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clube_parceiros')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Parceiro excluído com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['all_partners'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir parceiro: " + error.message)
    }
  })

  const filteredPartners = partnersEnriched.filter((p: any) => {
    const matchesSearch = p.nome?.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
                          p.descricao?.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
                          p.categoria?.toLowerCase().includes(partnerSearchTerm.toLowerCase());
    
    if (partnerCondoFilter === "all") return matchesSearch;
    if (partnerCondoFilter === "global") return matchesSearch && p.condominio_id === null;
    return matchesSearch && p.condominio_id === partnerCondoFilter;
  });

  if (!isMaster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center p-8">
        <div className="max-w-md space-y-4">
          <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
          <h2 className="text-2xl font-bold">Acesso Restrito ao Master</h2>
          <p className="text-muted-foreground">Você não possui credenciais para gerenciar a infraestrutura SaaS.</p>
        </div>
      </div>
    )
  }

  const activeCondos = condominios?.filter((c: { ativo?: boolean }) => c.ativo).length || 0
  const pausedCondos = condominios?.filter((c: { ativo?: boolean }) => !c.ativo).length || 0
  const totalPartners = allPartners?.length ?? 0

  const stats = [
    { label: "Condomínios ativos", value: activeCondos, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pausados", value: pausedCondos, icon: PauseCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pendências de adesão", value: solicitacoes?.length || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Parceiros cadastrados", value: totalPartners, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/5" },
  ]

  const filteredCondosList = condominios?.filter((c: { nome?: string; slug?: string }) => {
    if (!condoSearch.trim()) return true
    const q = condoSearch.toLowerCase()
    return c.nome?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q)
  })

  const sectionTitles: Record<MasterSection, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard Master", subtitle: "Visão geral do seu SaaS: tenants, parceiros e faturamento." },
    condos: { title: "Condomínios (Tenants)", subtitle: "Clientes cadastrados na plataforma. Use suporte para entrar no painel de cada um." },
    partners: { title: "Parceiros Globais", subtitle: "Central do Clube de Vantagens em todos os condomínios." },
    invites: { title: "Convites & Adesões", subtitle: "Novas instâncias e solicitações pendentes de moradores." },
    settings: { title: "Configurações do Sistema", subtitle: "Infraestrutura, variáveis globais e usuários da plataforma." },
  }

  const { title: sectionTitle, subtitle: sectionSubtitle } = sectionTitles[activeSection]

  const newCondominioDialog = (
          <Dialog
            open={openModal}
            onOpenChange={(open) => {
              setOpenModal(open)
              if (open) {
                setLastCreatedAdminUrl(null)
                setLastCreatedLoginUrl(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                <Plus className="mr-2 h-5 w-5" /> Novo Condomínio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ativar Nova Instância</DialogTitle>
                <DialogDescription>Configure os dados básicos do novo cliente SaaS.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">Nome</label>
                  <Input className="col-span-3" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Collina Belvedere" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">Slug</label>
                  <Input className="col-span-3" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="colina-belvedere" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">Cor Base</label>
                  <Input type="color" className="col-span-3 h-10 p-1" value={corP} onChange={(e) => setCorP(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">Plano</label>
                  <select 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-primary"
                    value={plano}
                    onChange={(e) => setPlano(e.target.value)}
                  >
                    <option value="basico">Básico (Limitado)</option>
                    <option value="pro">Pro (Completo)</option>
                  </select>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="grid gap-3">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-700">Síndico (opcional)</div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Nome</label>
                    <Input className="col-span-3" value={sindicoNome} onChange={(e) => setSindicoNome(e.target.value)} placeholder="Ex: João da Silva" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">E-mail</label>
                    <Input className="col-span-3" value={sindicoEmail} onChange={(e) => setSindicoEmail(e.target.value)} placeholder="joao@email.com" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">WhatsApp</label>
                    <Input className="col-span-3" value={sindicoWhatsapp} onChange={(e) => setSindicoWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  {lastCreatedLoginUrl ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link de login do síndico</div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-700 truncate">{lastCreatedLoginUrl}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={async () => {
                            await navigator.clipboard.writeText(lastCreatedLoginUrl)
                            toast.success("Link copiado!")
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" /> Copiar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                <Button onClick={() => createCondo.mutate()} disabled={createCondo.isPending}>
                  {createCondo.isPending ? "Criando..." : "Lançar Instância"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
  )

  const getJoinUrl = (slug: string) =>
    isLocalhostHost(window.location.hostname)
      ? `${window.location.origin}/${slug}/join`
      : `${window.location.protocol}//${slug}.${window.location.host}/join`

  return (
    <div className="flex min-h-screen w-full">
      <MasterSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingApprovals={solicitacoes?.length || 0}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 truncate">{sectionTitle}</h1>
            <p className="text-xs text-muted-foreground font-medium truncate">{sectionSubtitle}</p>
          </div>
          {(activeSection === "dashboard" || activeSection === "condos" || activeSection === "invites") && newCondominioDialog}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => (
                  <Card key={s.label} className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-dashed border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    Faturamento (MRR)
                  </CardTitle>
                  <CardDescription>Placeholder — pronto para integração com gateway de pagamento.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 border border-amber-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">MRR estimado</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">—</p>
                    <p className="text-xs text-slate-500 mt-1">Aguardando dados reais</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-amber-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Planos Pro</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">
                      {condominios?.filter((c: { plano?: string }) => c.plano === "pro").length ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-amber-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxa de conversão</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">—</p>
                  </div>
                </CardContent>
              </Card>

              {lastCreatedAdminUrl && lastCreatedLoginUrl ? (
                <Card className="border border-slate-100 shadow-sm">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500">Última instância criada</div>
                      <div className="mt-2 text-sm font-black text-slate-900 truncate">{lastCreatedAdminUrl}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(lastCreatedLoginUrl); toast.success("Link copiado!") }}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar login
                      </Button>
                      <a href={lastCreatedAdminUrl} target="_blank" rel="noreferrer"><Button><ExternalLink className="h-4 w-4 mr-2" /> Abrir</Button></a>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setActiveSection("condos")}><Building2 className="w-4 h-4 mr-2" /> Ver condomínios</Button>
                <Button variant="outline" onClick={() => setActiveSection("partners")}><ShoppingBag className="w-4 h-4 mr-2" /> Parceiros globais</Button>
                {(solicitacoes?.length ?? 0) > 0 && (
                  <Button variant="outline" onClick={() => setActiveSection("invites")}><Clock className="w-4 h-4 mr-2" /> {solicitacoes!.length} pendência(s)</Button>
                )}
              </div>
            </div>
          )}

          {activeSection === "condos" && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar condomínio ou slug..." className="pl-9 rounded-xl" value={condoSearch} onChange={(e) => setCondoSearch(e.target.value)} />
              </div>
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                      <tr>
                        <th className="px-6 py-4">Condomínio</th>
                        <th className="px-6 py-4">Plano</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingCondos ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}><td colSpan={4} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                        ))
                      ) : filteredCondosList?.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Nenhum condomínio encontrado.</td></tr>
                      ) : (
                        filteredCondosList?.map((condo: any) => (
                          <tr key={condo.id} className="hover:bg-slate-50/80">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-10 rounded-full shrink-0" style={{ backgroundColor: condo.cor_primaria || "#3E594D" }} />
                                <div>
                                  <p className="font-bold text-slate-900">{condo.nome}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" />{condo.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold uppercase text-xs">{condo.plano || "—"}</td>
                            <td className="px-6 py-4">
                              <Badge variant={condo.ativo ? "default" : "destructive"} className="text-[10px]">{condo.ativo ? "Online" : "Pausado"}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <Button size="sm" className="rounded-lg font-bold gap-1.5 h-8" onClick={() => handleImpersonate(condo)}>
                                  <KeyRound className="w-3.5 h-3.5" /> Acessar Painel
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-lg h-8" onClick={() => setManageCondo(condo)}>
                                  <Settings2 className="w-3.5 h-3.5 mr-1" /> Gerenciar
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Link de adesão" onClick={() => { navigator.clipboard.writeText(getJoinUrl(condo.slug)); toast.success("Link copiado!") }}>
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { if (confirm(`Excluir ${condo.nome}?`)) deleteCondo.mutate(condo.id) }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "invites" && (
            <div className="space-y-6">
              <Card className="border-slate-100 bg-slate-50/50">
                <CardContent className="p-4 text-sm text-slate-600">
                  Crie novas instâncias com <strong>Novo Condomínio</strong> ou compartilhe o link de adesão na lista de condomínios.
                </CardContent>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                {loadingSols ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
                ) : solicitacoes?.length === 0 ? (
                  <div className="md:col-span-2 py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium">Nenhuma solicitação pendente.</p>
                    <p className="text-sm">Tudo em dia com os novos moradores!</p>
                  </div>
                ) : (
                  solicitacoes?.map((sol: any) => (
                    <Card key={sol.id} className="overflow-hidden border-slate-200">
                      <CardHeader className="pb-4 flex flex-row items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border shadow-inner">
                          {sol.foto_url ? (
                            <img src={sol.foto_url} alt={sol.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <UserCircle className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{sol.nome}</CardTitle>
                          <CardDescription className="flex flex-col">
                            <span>{sol.email}</span>
                            <span className="text-xs font-bold text-primary">{sol.condominios?.nome}</span>
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <span className="block text-[10px] uppercase text-muted-foreground font-bold">Bloco</span>
                          <span className="font-bold">{sol.bloco || "-"}</span>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <span className="block text-[10px] uppercase text-muted-foreground font-bold">Apto</span>
                          <span className="font-bold">{sol.unidade || "-"}</span>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-lg">
                          <span className="block text-[10px] uppercase text-muted-foreground font-bold">Vaga</span>
                          <span className="font-bold">{sol.numero_vaga || "-"}</span>
                        </div>
                      </CardContent>
                      <div className="p-4 border-t bg-slate-50 flex gap-2">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateSoliStatus.mutate({ id: sol.id, status: "aprovado" })}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                        </Button>
                        <Button variant="destructive" className="flex-none w-12" onClick={() => updateSoliStatus.mutate({ id: sol.id, status: "recusado" })}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
                <Button variant={settingsTab === "system" ? "default" : "ghost"} onClick={() => setSettingsTab("system")} className="rounded-lg px-5">Sistema</Button>
                <Button variant={settingsTab === "users" ? "default" : "ghost"} onClick={() => setSettingsTab("users")} className="rounded-lg px-5 gap-2"><Users className="w-4 h-4" /> Usuários globais</Button>
              </div>
              {settingsTab === "system" && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        Status da Infraestrutura
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      {["Banco de Dados (Supabase)", "Storage (Arquivos/Fotos)", "Edge Functions", "DNS / Multi-tenancy"].map((label) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-600">{label}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">OPERACIONAL</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        Configurações Globais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Domínio Principal</label>
                        <Input value="antigravity.com.br" disabled className="rounded-xl bg-slate-50" />
                      </div>
                      <div className="flex flex-col gap-2 pt-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ambiente</label>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[10px]">PRODUCTION</Badge>
                          <span className="text-xs font-bold text-slate-400">v2.5.0-stable</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {settingsTab === "users" && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Controle de Usuários Global</CardTitle>
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou email..." className="pl-9 h-9 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="px-6 py-4">Usuário / Email</th>
                          <th className="px-6 py-4">Condomínio</th>
                          <th className="px-6 py-4">Cargo (Role)</th>
                          <th className="px-6 py-4">Cadastro em</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingPerfis ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></td></tr>
                          ))
                        ) : perfis?.filter((p) => {
                          if (!searchTerm) return true
                          const search = searchTerm.toLowerCase()
                          return p.nome?.toLowerCase()?.includes(search) || p.email?.toLowerCase()?.includes(search) || p.cpf?.toLowerCase()?.includes(search)
                        }).map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                  {(p.nome || p.email || "?").substring(0, 1).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{p.nome || "Usuário sem nome"}</span>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email || "Sem Email"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer max-w-[150px]" value={p.condominio_id || ""} onChange={(e) => updateCondo.mutate({ userId: p.id, condoId: e.target.value })}>
                                <option value="">Sem Vínculo</option>
                                {condominios?.map((c: any) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <select className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer" value={p.role} onChange={(e) => updateRole.mutate({ userId: p.id, role: e.target.value })}>
                                <option value="morador">MORADOR</option>
                                <option value="sindico">SÍNDICO</option>
                                <option value="zelador">ZELADOR</option>
                                <option value="super_admin">MASTER</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(p.criado_em).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === "partners" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[24px] border border-slate-100/50 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por parceiro ou categoria..." 
                    className="pl-9 h-10 rounded-xl text-sm"
                    value={partnerSearchTerm}
                    onChange={(e) => setPartnerSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  value={partnerCondoFilter} 
                  onChange={(e) => setPartnerCondoFilter(e.target.value)}
                  className="flex h-10 w-full sm:w-64 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary outline-none"
                >
                  <option value="all">Filtrar por Condomínio (Todos)</option>
                  <option value="global">Apenas Globais</option>
                  {condominios?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <Button 
                onClick={() => {
                  setPartnerToEdit(null)
                  setOpenPartnerModal(true)
                }} 
                className="bg-primary hover:opacity-90 text-white rounded-xl px-6 h-10 gap-2 shadow-lg shadow-primary/10 w-full sm:w-auto font-bold"
              >
                <Plus className="h-4 w-4" />
                Novo Parceiro
              </Button>
            </div>

            {loadingPartners ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-[32px]" />
                ))}
              </div>
            ) : partnersQueryFailed ? (
              <div className="text-center p-20 bg-white border border-dashed border-red-100 rounded-[32px]">
                <ShoppingBag className="mx-auto h-12 w-12 text-red-200 mb-4" />
                <h3 className="text-lg font-black text-slate-800">Não foi possível carregar os parceiros</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-md mx-auto">
                  {(partnersQueryError as Error)?.message || "Erro de permissão (RLS) ou conexão com o Supabase."}
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Logado como: {user?.email || "—"} · Perfil: {meuPerfil?.role || "sem registro em perfis"}
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['all_partners'] })}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center p-20 bg-white border border-dashed border-slate-100 rounded-[32px]">
                <ShoppingBag className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                <h3 className="text-lg font-black text-slate-800">Nenhum parceiro encontrado</h3>
                <p className="text-slate-500 font-medium mt-2">
                  {allPartners && allPartners.length > 0
                    ? "Altere os filtros de busca ou condomínio."
                    : "Cadastre um parceiro ou verifique o RLS no Supabase (aba Parceiros)."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPartners?.map((partner: any) => (
                  <Card key={partner.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white flex flex-col rounded-[32px] group relative">
                    <div className="h-32 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                      {partner.imagem_banner_url || partner.logo_url ? (
                        <img src={partner.imagem_banner_url || partner.logo_url} alt={partner.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-200 font-black text-3xl uppercase tracking-widest">{partner.nome.substring(0,2)}</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <Badge className="bg-white/90 text-primary border-none font-bold text-[9px] uppercase tracking-widest shadow-sm w-fit backdrop-blur-sm">
                          {partner.selo === 'morador_empreendedor' ? 'Morador' : 'Oficial'}
                        </Badge>
                        {partner.condominio_id === null ? (
                          <Badge className="bg-purple-100 text-purple-700 border-none font-black text-[9px] uppercase tracking-widest shadow-sm w-fit">
                            Global
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] uppercase tracking-widest shadow-sm w-fit max-w-[120px] truncate">
                            {partner.condominios?.nome || "Local"}
                          </Badge>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg shadow bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPartnerToEdit(partner)
                            setOpenPartnerModal(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-700" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg shadow"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Remover o parceiro ${partner.nome}?`)) {
                              deletePartner.mutate(partner.id)
                            }
                          }}
                          disabled={deletePartner.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <CardHeader className="pt-5 pb-2 px-6">
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{partner.categoria}</span>
                      <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{partner.nome}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 py-2 px-6 text-xs text-slate-500 font-medium">
                      <p className="line-clamp-2 leading-relaxed">{partner.descricao}</p>
                      <div className="mt-3 text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 w-fit">
                        Desconto: <span className="text-primary font-black">{partner.desconto_info}</span>
                      </div>
                    </CardContent>

                    <div className="p-6 pt-2 border-t mt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold bg-slate-50/50">
                      <span>Criado em {new Date(partner.criado_em).toLocaleDateString()}</span>
                      <span className="capitalize">{partner.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        </main>
      </div>

      <ParceiroFormModal
        open={openPartnerModal}
        onOpenChange={setOpenPartnerModal}
        parceiroToEdit={partnerToEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['all_partners'] })
        }}
      />

      {/* Modal de Gerenciamento do Condomínio */}
      <Dialog open={!!manageCondo} onOpenChange={(open) => !open && setManageCondo(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
               <Building2 className="w-6 h-6 text-primary" />
               {manageCondo?.nome}
            </DialogTitle>
            <DialogDescription className="font-medium">
               Gerenciamento de instância: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary">{manageCondo?.slug}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-8">
             {/* Estatísticas Rápidas */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Moradores Totais</p>
                   <p className="text-2xl font-black text-slate-800">{loadingDetails ? "..." : condoDetails?.totalMoradores}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                   <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Pendências de Adesão</p>
                   <p className="text-2xl font-black text-amber-700">{loadingDetails ? "..." : condoDetails?.pendencias}</p>
                </div>
             </div>

             {/* Informações do Síndico */}
             <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> Síndico Responsável
                </h3>
                {loadingDetails ? (
                   <Skeleton className="h-20 w-full rounded-2xl" />
                ) : condoDetails?.sindicos && condoDetails.sindicos.length > 0 ? (
                   condoDetails.sindicos.map((s: any) => (
                      <div key={s.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                         <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                            {s.nome?.[0] || "?"}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">{s.nome}</p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                               <Mail className="w-3 h-3" /> {s.telefone || "Sem WhatsApp cadastrado"}
                            </p>
                         </div>
                         <Button variant="outline" size="sm" className="rounded-lg text-[10px] font-black uppercase h-8" asChild>
                            <a href={`https://wa.me/${s.telefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                               WhatsApp
                            </a>
                         </Button>
                      </div>
                   ))
                ) : (
                   <div className="bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                      {!isInvitingSindico ? (
                        <>
                          <p className="text-sm text-slate-500 font-medium">Nenhum síndico vinculado a este condomínio.</p>
                          <Button 
                            variant="link" 
                            className="text-primary font-bold text-xs mt-2"
                            onClick={() => setIsInvitingSindico(true)}
                          >
                            Convidar Síndico agora
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-4 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400">Novo Convite de Síndico</span>
                            <Button variant="ghost" size="sm" onClick={() => setIsInvitingSindico(false)} className="h-6 text-[10px] font-bold">Cancelar</Button>
                          </div>
                          <Input 
                            placeholder="Nome do Síndico" 
                            className="h-9 text-xs rounded-xl"
                            value={inviteForm.nome}
                            onChange={(e) => setInviteForm({ ...inviteForm, nome: e.target.value })}
                          />
                          <Input 
                            placeholder="E-mail" 
                            className="h-9 text-xs rounded-xl"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                          />
                          <Input 
                            placeholder="WhatsApp (opcional)" 
                            className="h-9 text-xs rounded-xl"
                            value={inviteForm.whatsapp}
                            onChange={(e) => setInviteForm({ ...inviteForm, whatsapp: e.target.value })}
                          />
                          <Button 
                            className="w-full h-10 font-black text-xs uppercase tracking-widest"
                            disabled={inviteUser.isPending}
                            onClick={() => inviteUser.mutate({ 
                              email: inviteForm.email, 
                              nome: inviteForm.nome, 
                              role: 'sindico', 
                              condominio_id: manageCondo.id,
                              telefone: inviteForm.whatsapp
                            })}
                          >
                            {inviteUser.isPending ? "Enviando..." : "Enviar Convite Oficial"}
                          </Button>
                        </div>
                      )}
                   </div>
                )}
             </div>

             {/* Acesso Rápido Master */}
             <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> Acesso de Suporte
                </h3>
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] flex flex-col gap-4">
                   <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-slate-800">Entrar como Administrador</p>
                      <p className="text-xs text-slate-500 font-medium">Acesse o painel deste condomínio para suporte técnico ou configuração assistida.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                         className="bg-primary hover:opacity-90 rounded-2xl font-bold gap-2 flex-1"
                         onClick={() => handleImpersonate(manageCondo)}
                      >
                         <KeyRound className="w-4 h-4" /> Acessar Painel (Suporte)
                      </Button>
                      <Button 
                         variant="outline"
                         className="rounded-2xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/10 flex-1"
                         onClick={() => {
                            const isLocal = isLocalhostHost(window.location.hostname)
                            const targetPath = isLocal ? `/${manageCondo.slug}` : `/`
                            window.open(targetPath, '_blank')
                         }}
                      >
                         <Globe className="w-4 h-4" /> Ver Portal Público
                      </Button>
                   </div>
                </div>
             </div>

             {/* Configurações da Instância */}
             <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Settings2 className="w-4 h-4" /> Configurações do Portal
                </h3>
                <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <p className="text-sm font-bold text-slate-800">Plano da Instância</p>
                         <p className="text-xs text-slate-500 font-medium">Define os módulos disponíveis</p>
                      </div>
                      <select 
                        className="bg-white border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 focus:ring-primary"
                        value={manageCondo?.plano}
                        onChange={(e) => updateCondoPlan.mutate({ id: manageCondo.id, plano: e.target.value })}
                      >
                        <option value="basico">Básico</option>
                        <option value="pro">Pro</option>
                      </select>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <p className="text-sm font-bold text-slate-800">Status do Portal</p>
                         <p className="text-xs text-slate-500 font-medium">Ative ou desative o acesso público</p>
                      </div>
                      <Button 
                        variant={manageCondo?.ativo ? "destructive" : "default"} 
                        size="sm" 
                        className="rounded-xl font-bold"
                        onClick={() => toggleCondoStatus.mutate({ id: manageCondo.id, active: !manageCondo.ativo })}
                      >
                         {manageCondo?.ativo ? "Desativar" : "Ativar"}
                      </Button>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <p className="text-sm font-bold text-slate-800">Excluir Instância</p>
                         <p className="text-xs text-slate-500 font-medium text-red-400">Esta ação é irreversível</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-red-100 text-red-500 hover:bg-red-50 font-bold"
                        onClick={() => {
                          if (confirm("Excluir este condomínio permanentemente?")) {
                            deleteCondo.mutate(manageCondo.id, {
                              onSuccess: () => {
                                setManageCondo(null)
                              }
                            })
                          }
                        }}
                      >
                         Remover
                      </Button>
                   </div>
                </div>
             </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button variant="ghost" onClick={() => setManageCondo(null)} className="rounded-xl font-bold">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
