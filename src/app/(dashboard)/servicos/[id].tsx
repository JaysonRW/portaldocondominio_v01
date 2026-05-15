import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  ArrowLeft,
  Calendar,
  User,
  MapPin, 
  Tag, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  Plus, 
  Play, 
  Pause, 
  Package,
  Camera,
  Image as ImageIcon,
  Pencil
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Badge } from "../../../components/ui/badge"
import { withTenantPrefix } from "../../../lib/utils"
import { useParams, Link } from "react-router"
import { Skeleton } from "../../../components/ui/skeleton"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../../../components/ui/dialog"

export default function DetalheOrdemServico() {
  const { id } = useParams()
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()

  const [comentario, setComentario] = useState("")
  const [materialName, setMaterialName] = useState("")
  const [materialQty, setMaterialQty] = useState("1")
  const [materialValue, setMaterialValue] = useState("")
  const [openMaterial, setOpenMaterial] = useState(false)
  const [isEditingOS, setIsEditingOS] = useState(false)
  
  // Estados para edição da OS
  const [editTitulo, setEditTitulo] = useState("")
  const [editDescricao, setEditDescricao] = useState("")
  const [editCategoria, setEditCategoria] = useState("")
  const [editPrioridade, setEditPrioridade] = useState("")
  const [editLocal, setEditLocal] = useState("")
  const [editResponsavelId, setEditResponsavelId] = useState("")
  const [editDataAgendada, setEditDataAgendada] = useState("")
  const [editTempoEstimado, setEditTempoEstimado] = useState("")
  const [editCustoEstimado, setEditCustoEstimado] = useState("")

  // Busca zeladores para o select de responsáveis
  const { data: zeladores } = useQuery({
    queryKey: ['zeladores', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome')
        .eq('condominio_id', tenant?.id)
        .eq('role', 'zelador')
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id && isEditingOS,
  })

  // 1. Busca dados da OS
  const { data: ordem, isLoading, isError, error: ordemError } = useQuery({
    queryKey: ['ordem-servico', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          atualizacoes:ordem_servico_atualizacoes(*),
          materiais:ordem_servico_materiais(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: perfisRelacionados } = useQuery({
    queryKey: ['ordem-servico-perfis', id, ordem?.atualizacoes?.length, ordem?.responsavel_id, ordem?.criado_por],
    queryFn: async () => {
      const ids = Array.from(new Set([
        ...(ordem?.atualizacoes || []).map((a: any) => a.autor_id).filter(Boolean),
        ordem?.responsavel_id,
        ordem?.criado_por,
      ].filter(Boolean)))

      if (ids.length === 0) return []

      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome')
        .in('id', ids)

      if (error) throw error
      return data || []
    },
    enabled: !!id && !!ordem && Array.isArray(ordem.atualizacoes),
  })

  const nomeByPerfilId = new Map((perfisRelacionados || []).map((p: any) => [p.id, p.nome]))

  // 2. Mutações
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ 
          status: newStatus,
          data_inicio: newStatus === 'em_andamento' && !ordem?.data_inicio ? new Date().toISOString() : ordem?.data_inicio,
          data_conclusao: newStatus === 'concluido' ? new Date().toISOString() : ordem?.data_conclusao
        })
        .eq('id', id)

      if (error) throw error

      // Adiciona histórico
      await supabase.from('ordem_servico_atualizacoes').insert([{
        ordem_id: id,
        condominio_id: tenant?.id,
        autor_id: perfil?.id,
        tipo: 'mudanca_status',
        mensagem: `Alterou status para: ${newStatus}`,
        status_anterior: ordem?.status,
        status_novo: newStatus
      }])
    },
    onSuccess: () => {
      toast.success("Status atualizado!")
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] })
    }
  })

  const addComment = useMutation({
    mutationFn: async () => {
      if (!comentario) return
      const { error } = await supabase
        .from('ordem_servico_atualizacoes')
        .insert([{
          ordem_id: id,
          condominio_id: tenant?.id,
          autor_id: perfil?.id,
          tipo: 'comentario',
          mensagem: comentario
        }])
      if (error) throw error
    },
    onSuccess: () => {
      setComentario("")
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] })
    }
  })

  const addMaterial = useMutation({
    mutationFn: async () => {
      const valorTotal = parseFloat(materialQty) * parseFloat(materialValue.replace(',', '.'))
      const { error } = await supabase
        .from('ordem_servico_materiais')
        .insert([{
          ordem_id: id,
          condominio_id: tenant?.id,
          nome_material: materialName,
          quantidade: parseFloat(materialQty),
          valor_unitario: parseFloat(materialValue.replace(',', '.')),
          valor_total: valorTotal,
          criado_por: user?.id
        }])
      if (error) throw error

      // Atualiza custo real na OS
      const novoCustoReal = (ordem?.custo_real || 0) + valorTotal
      const { error: updateError } = await supabase.from('ordens_servico').update({ custo_real: novoCustoReal }).eq('id', id)
      if (updateError) throw updateError
    },
    onSuccess: () => {
      setOpenMaterial(false)
      setMaterialName("")
      setMaterialValue("")
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] })
      toast.success("Material adicionado com sucesso!")
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar material: " + err.message)
    }
  })

  const saveEditOS = useMutation({
    mutationFn: async () => {
      if (!editTitulo || !editLocal) throw new Error("Título e Local são obrigatórios!")

      const payload = {
        titulo: editTitulo,
        descricao: editDescricao,
        categoria: editCategoria,
        prioridade: editPrioridade,
        local_descricao: editLocal,
        responsavel_id: editResponsavelId || null,
        data_agendada: editDataAgendada ? new Date(editDataAgendada).toISOString() : null,
        tempo_estimado_minutos: editTempoEstimado ? parseInt(editTempoEstimado) : null,
        custo_estimado: editCustoEstimado ? parseFloat(editCustoEstimado.replace(',', '.')) : null,
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(payload)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Ordem de serviço atualizada com sucesso!")
      setIsEditingOS(false)
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', id] })
    },
    onError: (error: any) => {
      toast.error("Falha ao atualizar OS: " + error.message)
    }
  })

  const handleOpenEdit = () => {
    if (!ordem) return
    setEditTitulo(ordem.titulo)
    setEditDescricao(ordem.descricao || "")
    setEditCategoria(ordem.categoria || "")
    setEditPrioridade(ordem.prioridade || "media")
    setEditLocal(ordem.local_descricao || "")
    setEditResponsavelId(ordem.responsavel_id || "")
    setEditDataAgendada(ordem.data_agendada ? new Date(ordem.data_agendada).toISOString().slice(0, 16) : "")
    setEditTempoEstimado(ordem.tempo_estimado_minutos ? String(ordem.tempo_estimado_minutos) : "")
    setEditCustoEstimado(ordem.custo_estimado ? String(ordem.custo_estimado) : "")
    setIsEditingOS(true)
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-3xl" /></div>
  if (isError) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-8">
            <div className="text-sm font-black text-red-600 uppercase tracking-widest">Erro ao carregar a ordem</div>
            <div className="mt-3 text-slate-700 font-bold break-words">
              {(ordemError as any)?.message || "Falha desconhecida"}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium break-words">
              {(ordemError as any)?.details || (ordemError as any)?.hint || ""}
            </div>
            <div className="mt-6">
              <Button variant="outline" asChild className="rounded-xl">
                <Link to={withTenantPrefix("/painel/servicos", tenant?.slug)}>Voltar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!ordem) return <div className="p-8 text-center">Ordem não encontrada.</div>

  const atualizacoesOrdenadas = Array.isArray((ordem as any).atualizacoes)
    ? [...(ordem as any).atualizacoes].sort(
        (a: any, b: any) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      )
    : []

  const materiaisLista = Array.isArray((ordem as any).materiais) ? (ordem as any).materiais : []

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link to={withTenantPrefix("/painel/servicos", tenant?.slug)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">#{ordem.id.substring(0, 8)}</Badge>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Criada em {new Date(ordem.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800">{ordem.titulo}</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {(perfil?.role === 'sindico' || perfil?.role === 'subsindico') && (
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={handleOpenEdit}>
              <Pencil className="w-4 h-4 mr-2" /> Editar O.S.
            </Button>
          )}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {['pendente', 'em_andamento', 'concluido'].map(s => (
              <button
                key={s}
                onClick={() => updateStatus.mutate(s)}
                disabled={ordem.status === s}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  ordem.status === s 
                    ? "bg-white shadow-sm text-slate-800" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {s === 'em_andamento' ? 'Em Curso' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardContent className="p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Descrição do Problema / Serviço</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{ordem.descricao || "Nenhuma descrição fornecida."}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-50">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</span>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <MapPin className="w-4 h-4 text-primary" /> {ordem.local_descricao}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</span>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Tag className="w-4 h-4 text-primary" /> {ordem.categoria || "Geral"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</span>
                  <div className="flex items-center gap-2">
                    {ordem.prioridade === 'urgente' && <Badge className="bg-red-500 text-white border-none">Urgente</Badge>}
                    {ordem.prioridade === 'alta' && <Badge className="bg-orange-500 text-white border-none">Alta</Badge>}
                    {ordem.prioridade === 'media' && <Badge className="bg-blue-500 text-white border-none">Média</Badge>}
                    {ordem.prioridade === 'baixa' && <Badge className="bg-slate-400 text-white border-none">Baixa</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico e Comentários */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input 
                  placeholder="Adicionar um comentário ou observação..." 
                  className="rounded-2xl h-12 bg-slate-50 border-none focus:ring-primary/20"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <Button 
                  onClick={() => addComment.mutate()} 
                  disabled={!comentario || addComment.isPending}
                  className="rounded-2xl h-12 px-6 bg-primary text-white"
                >
                  Enviar
                </Button>
              </div>

              <div className="space-y-4">
                {atualizacoesOrdenadas.map((at: any) => (
                  <div key={at.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-50">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-primary border shadow-sm shrink-0">
                      {(nomeByPerfilId.get(at.autor_id)?.[0] || "?")}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700">{nomeByPerfilId.get(at.autor_id) || "Sistema"}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(at.criado_em).toLocaleString('pt-BR')}</span>
                        {at.tipo === 'mudanca_status' && <Badge className="text-[9px] h-4 bg-blue-50 text-blue-600 border-none uppercase">Status</Badge>}
                      </div>
                      <p className="text-sm text-slate-600">{at.mensagem}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Informações de Execução</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Responsável</span>
                  <span className="text-sm font-black text-slate-700">{nomeByPerfilId.get(ordem.responsavel_id) || "Aguardando designação"}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data Agendada</span>
                  <span className="text-sm font-black text-slate-700">
                    {ordem.data_agendada ? new Date(ordem.data_agendada).toLocaleDateString('pt-BR') : "Não agendado"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tempo Gasto</span>
                  <span className="text-sm font-black text-slate-700">{ordem.tempo_real_minutos || 0} minutos</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Real Total</span>
                  <span className="text-lg font-black text-slate-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.custo_real || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materiais Utilizados */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Package className="w-4 h-4" /> Materiais
              </CardTitle>
              <Dialog open={openMaterial} onOpenChange={setOpenMaterial}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary bg-primary/5 hover:bg-primary/10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[32px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">Adicionar Material</DialogTitle>
                    <DialogDescription className="font-medium">Informe os detalhes do material utilizado neste serviço.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-bold">Nome do Material</label>
                      <Input placeholder="Ex: Lâmpada LED 12W" value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-bold">Quantidade</label>
                        <Input type="number" value={materialQty} onChange={(e) => setMaterialQty(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-bold">Valor Unitário (R$)</label>
                        <Input placeholder="0,00" value={materialValue} onChange={(e) => setMaterialValue(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpenMaterial(false)}>Cancelar</Button>
                    <Button 
                      onClick={() => addMaterial.mutate()} 
                      disabled={!materialName || !materialValue || addMaterial.isPending}
                      className="bg-primary text-white rounded-xl px-6"
                    >
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {materiaisLista.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-4 italic">Nenhum material registrado.</p>
              ) : (
                materiaisLista.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700">{m.nome_material}</span>
                      <span className="text-[10px] font-bold text-slate-400">{m.quantidade} unidade(s)</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.valor_total)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Fotos do Serviço */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Camera className="w-4 h-4" /> Fotos
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary bg-primary/5 hover:bg-primary/10">
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {/* Placeholder para fotos */}
                <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-1">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Sem fotos</span>
                </div>
                <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-1">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Sem fotos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditingOS} onOpenChange={setIsEditingOS}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Título</label>
              <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Local</label>
              <Input value={editLocal} onChange={(e) => setEditLocal(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Categoria</label>
                <select
                  value={editCategoria}
                  onChange={(e) => setEditCategoria(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="Manutenção Elétrica">Manutenção Elétrica</option>
                  <option value="Manutenção Hidráulica">Manutenção Hidráulica</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Jardinagem">Jardinagem</option>
                  <option value="Pintura">Pintura</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Prioridade</label>
                <select
                  value={editPrioridade}
                  onChange={(e) => setEditPrioridade(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Responsável</label>
              <select
                value={editResponsavelId}
                onChange={(e) => setEditResponsavelId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <option value="">Sem responsável definido</option>
                {zeladores?.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Data Agendada</label>
              <Input type="datetime-local" value={editDataAgendada} onChange={(e) => setEditDataAgendada(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Descrição Detalhada</label>
              <Textarea value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} className="min-h-[100px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditingOS(false)}>Cancelar</Button>
            <Button onClick={() => saveEditOS.mutate()} disabled={saveEditOS.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saveEditOS.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
