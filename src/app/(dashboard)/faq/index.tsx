import { useState, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "react-router"
import { Card } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { CircleHelp, PlusCircle, Trash2, Edit2, ChevronDown, Info, TrendingUp, Eye, AlertTriangle } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"

export default function FAQ() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const location = useLocation()
  
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('new') === 'true') {
      setOpenModal(true)
    }
  }, [location])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [pergunta, setPergunta] = useState("")
  const [resposta, setResposta] = useState("")
  const [categoria, setCategoria] = useState("Portal vs App")
  const [novaCategoria, setNovaCategoria] = useState("")
  const [isNovaCategoria, setIsNovaCategoria] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const canAdmin = perfil?.role === 'sindico' || perfil?.role === 'subsindico' || perfil?.role === 'super_admin'

  const { data: kpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['faq-kpis', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null
      const { data, error } = await supabase.rpc('faq_kpis', { p_condominio_id: tenant.id })
      if (error) throw error
      if (Array.isArray(data)) return data[0] ?? null
      return (data as any) ?? null
    },
    enabled: !!tenant?.id && !!canAdmin,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (!tenant?.id || !canAdmin) return

    const channel = supabase
      .channel(`faq_interactions_${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'faq_interactions',
          filter: `condominio_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['faq-kpis', tenant.id] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, canAdmin, queryClient])

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('categoria', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const saveFAQ = useMutation({
    mutationFn: async () => {
      if (!pergunta || !resposta) throw new Error("Pergunta e Resposta são obrigatórias!")
      if (isNovaCategoria && !novaCategoria.trim()) throw new Error("Informe o nome da nova categoria!")
      
      const payload = {
        condominio_id: tenant?.id,
        pergunta,
        resposta,
        categoria: isNovaCategoria ? novaCategoria.trim() : categoria
      }

      if (editingId) {
        const { error } = await supabase.from('faqs').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('faqs').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "FAQ atualizada!" : "Nova pergunta adicionada!")
      setOpenModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['faqs'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message)
    }
  })

  const deleteFAQ = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("FAQ removida.")
      queryClient.invalidateQueries({ queryKey: ['faqs'] })
    }
  })

  const resetForm = () => {
    setEditingId(null)
    setPergunta("")
    setResposta("")
    setCategoria("Portal vs App")
    setNovaCategoria("")
    setIsNovaCategoria(false)
  }

  const handleEdit = (faq: any) => {
    setEditingId(faq.id)
    setPergunta(faq.pergunta)
    setResposta(faq.resposta)
    setNovaCategoria("")
    setIsNovaCategoria(false)
    
    // Verifica se a categoria do FAQ está nas categorias padrão
    const categoriasPadrao = ["Portal vs App", "Acesso e Perfil", "Assembleias", "Clube de Vantagens", "Outros"]
    if (!categoriasPadrao.includes(faq.categoria)) {
      setCategoria("Nova Categoria...")
      setIsNovaCategoria(true)
      setNovaCategoria(faq.categoria)
    } else {
      setCategoria(faq.categoria)
    }
    setOpenModal(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dúvidas Frequentes (FAQ)</h1>
          <p className="text-slate-500 font-medium">Saiba como utilizar o portal e onde encontrar cada funcionalidade.</p>
        </div>

        {canAdmin && (
          <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
                <PlusCircle className="h-4 w-4" /> Nova Pergunta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-800">{editingId ? 'Editar Pergunta' : 'Nova Pergunta Frequente'}</DialogTitle>
                <DialogDescription className="font-medium">Ajude os moradores a entenderem o novo Portal Informativo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Categoria</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary"
                    value={categoria} 
                    onChange={(e) => {
                      setCategoria(e.target.value)
                      setIsNovaCategoria(e.target.value === "Nova Categoria...")
                    }}
                  >
                    <option value="Portal vs App">Portal vs App (Onde vejo boletos?)</option>
                    <option value="Acesso e Perfil">Acesso e Perfil</option>
                    <option value="Assembleias">Assembleias e Atas</option>
                    <option value="Clube de Vantagens">Clube de Vantagens</option>
                    <option value="Outros">Outros</option>
                    <option value="Nova Categoria..." className="font-bold text-primary">+ Adicionar Nova Categoria...</option>
                  </select>
                </div>

                {isNovaCategoria && (
                  <div className="grid gap-2 animate-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-slate-700 text-primary">Nome da Nova Categoria</label>
                    <Input 
                      value={novaCategoria} 
                      onChange={(e) => setNovaCategoria(e.target.value)} 
                      placeholder="Ex: Regras da Piscina" 
                      className="rounded-xl border-primary/50 focus-visible:ring-primary" 
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Pergunta</label>
                  <Input value={pergunta} onChange={(e) => setPergunta(e.target.value)} placeholder="Ex: Onde eu baixo meus boletos?" className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Resposta</label>
                  <textarea 
                    className="flex min-h-[150px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary"
                    placeholder="Escreva a resposta. Dica: Para boletos, direcione o morador para o App Oficial."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={() => saveFAQ.mutate()} disabled={saveFAQ.isPending} className="rounded-xl px-8">
                  {saveFAQ.isPending ? "Salvando..." : "Publicar FAQ"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-[28px] border-none bg-white shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eficiência de Resolução</p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoadingKpis ? (
                    <Skeleton className="h-8 w-20 rounded-xl" />
                  ) : (
                    <span className="text-3xl font-black text-slate-900">
                      {typeof (kpis as any)?.efficiency_pct === 'number' ? `${(kpis as any).efficiency_pct}%` : '—'}
                    </span>
                  )}
                  {!isLoadingKpis && (
                    <span className="text-xs font-bold text-slate-400">
                      ({(kpis as any)?.feedback_yes ?? 0}/{(kpis as any)?.feedback_total ?? 0} feedbacks)
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
              Mede quantas dúvidas foram resolvidas automaticamente pelo FAQ.
            </p>
          </Card>

          <Card className="rounded-[28px] border-none bg-white shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Visualizações</p>
                <div className="mt-2">
                  {isLoadingKpis ? (
                    <Skeleton className="h-8 w-20 rounded-xl" />
                  ) : (
                    <span className="text-3xl font-black text-slate-900">{(kpis as any)?.views_month ?? 0}</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
                <Eye className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
              Indica engajamento dos moradores usando o portal como primeira consulta.
            </p>
          </Card>

          <Card className="rounded-[28px] border-none bg-white shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tópico mais Crítico</p>
                <div className="mt-2">
                  {isLoadingKpis ? (
                    <Skeleton className="h-8 w-40 rounded-xl" />
                  ) : (kpis as any)?.top_pergunta ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-slate-900 truncate">{(kpis as any).top_pergunta}</span>
                      <span className="text-xs font-bold text-slate-400 truncate">
                        {(kpis as any).top_categoria ? `${(kpis as any).top_categoria} â€¢ ` : ''}{(kpis as any).top_views_week ?? 0} views
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-500">Sem dados</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed">
              Ajuda a identificar as maiores dores dos moradores para ação preventiva.
            </p>
          </Card>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-start gap-4 mb-2">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600 shrink-0">
            <Info className="w-6 h-6" />
         </div>
         <div>
            <h4 className="text-blue-900 font-black text-sm uppercase tracking-tight mb-1">Dica Importante</h4>
            <p className="text-blue-700 text-sm font-medium leading-relaxed">
               Este portal é focado em <strong>Comunicação e Informação</strong>. Para questões operacionais como segunda via de boletos, reservas de espaços e prestação de contas detalhada, utilize sempre o aplicativo oficial do condomínio.
            </p>
         </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[24px]" />
          ))
        ) : faqs?.length === 0 ? (
          <div className="text-center p-16 bg-white border border-dashed rounded-[40px]">
            <CircleHelp className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Sua FAQ está vazia</h3>
            <p className="text-slate-500 font-medium mt-2">Adicione perguntas para ajudar seus moradores a tirarem dúvidas rapidamente.</p>
          </div>
        ) : (
          faqs?.map((faq) => (
            <Card key={faq.id} className={`overflow-hidden border-none transition-all duration-300 rounded-[24px] ${expandedId === faq.id ? 'shadow-lg bg-white ring-1 ring-primary/10' : 'bg-white shadow-sm hover:shadow-md'}`}>
               <div className="flex items-center justify-between p-5 md:p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
                  <div className="flex items-center gap-4 flex-1">
                     <div className={`p-2.5 rounded-xl transition-colors ${expandedId === faq.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <CircleHelp className="w-5 h-5" />
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase text-primary/70 tracking-widest leading-none">{faq.categoria}</span>
                        <h4 className={`text-base font-bold mt-1 transition-colors ${expandedId === faq.id ? 'text-slate-900' : 'text-slate-700'}`}>{faq.pergunta}</h4>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     {canAdmin && (
                        <div className="flex gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                           <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEdit(faq)}>
                              <Edit2 className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => {
                              if(confirm("Deseja apagar esta FAQ?")) deleteFAQ.mutate(faq.id)
                           }}>
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     )}
                     <div className={`p-2 rounded-full transition-transform duration-300 ${expandedId === faq.id ? 'rotate-180 bg-primary/5' : ''}`}>
                        <ChevronDown className={`w-5 h-5 ${expandedId === faq.id ? 'text-primary' : 'text-slate-300'}`} />
                     </div>
                  </div>
               </div>
               {expandedId === faq.id && (
                  <div className="px-6 md:px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                     <div className="ml-14 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                           {faq.resposta}
                        </p>
                     </div>
                  </div>
               )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
