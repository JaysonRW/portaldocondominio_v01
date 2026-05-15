import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  MessageSquareText, 
  Search, 
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronRight,
  Reply,
  UserCircle
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { Textarea } from "../../../components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog"

export default function CanalMoradorGestao() {
  const { tenant } = useTenantStore()
  const { user, perfil } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("todas")
  
  // Modal State
  const [selectedMsg, setSelectedMsg] = useState<any>(null)
  const [resposta, setResposta] = useState("")
  const [novoStatus, setNovoStatus] = useState("")

  const { data: mensagens, isLoading } = useQuery({
    queryKey: ['mensagens_morador_admin', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens_morador')
        .select(`
          *,
          morador:morador_id (nome, unidade)
        `)
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const updateMensagem = useMutation({
    mutationFn: async ({ id, status, resposta_admin }: { id: string, status: string, resposta_admin: string }) => {
      const { data, error } = await supabase
        .from('mensagens_morador')
        .update({
          status,
          resposta_admin,
          respondido_por: perfil?.id,
          respondido_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success("Mensagem atualizada e morador notificado!")
      queryClient.invalidateQueries({ queryKey: ['mensagens_morador_admin'] })
      setSelectedMsg(null)
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message)
    }
  })

  // Dashboard Stats
  const stats = {
    totalMes: mensagens?.filter(m => new Date(m.criado_em).getMonth() === new Date().getMonth()).length || 0,
    novas: mensagens?.filter(m => m.status === 'nova').length || 0,
    pendentes: mensagens?.filter(m => m.status === 'em análise').length || 0,
    resolvidas: mensagens?.filter(m => m.status === 'resolvida' || m.status === 'respondida').length || 0,
  }

  // Filtragem
  const filteredMensagens = mensagens?.filter(m => {
    const matchesSearch = 
      m.assunto.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.morador?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.morador?.unidade?.toLowerCase().includes(searchTerm.toLowerCase())
      
    if (!matchesSearch) return false
    
    if (activeFilter === "todas") return true
    if (activeFilter === "novas") return m.status === "nova"
    if (activeFilter === "analise") return m.status === "em análise"
    if (activeFilter === "resolvidas") return m.status === "resolvida" || m.status === "respondida"
    return true
  })

  const openRespondModal = (msg: any) => {
    setSelectedMsg(msg)
    setResposta(msg.resposta_admin || "")
    setNovoStatus(msg.status)
  }

  const handleSave = () => {
    if (!selectedMsg) return
    updateMensagem.mutate({
      id: selectedMsg.id,
      status: novoStatus,
      resposta_admin: resposta
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <MessageSquareText className="w-8 h-8 text-primary" />
            Canal do Morador
          </h1>
          <p className="text-slate-500 font-medium">
            Gerencie as dúvidas, sugestões e ocorrências enviadas pelos moradores.
          </p>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total no Mês</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.totalMes}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600/70 uppercase tracking-widest">Novas</p>
              <h3 className="text-3xl font-black text-blue-900">{stats.novas}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-600/70 uppercase tracking-widest">Em Análise</p>
              <h3 className="text-3xl font-black text-amber-900">{stats.pendentes}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600/70 uppercase tracking-widest">Resolvidas</p>
              <h3 className="text-3xl font-black text-emerald-900">{stats.resolvidas}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Buscar por assunto, morador ou unidade..." 
            className="pl-12 h-12 rounded-xl bg-slate-50 border-transparent focus-visible:bg-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto custom-scrollbar">
          <Button 
            variant={activeFilter === "todas" ? "default" : "outline"}
            className={cn("rounded-xl font-bold border-slate-200 shrink-0", activeFilter === "todas" && "bg-slate-800 text-white")}
            onClick={() => setActiveFilter("todas")}
          >
            Todas
          </Button>
          <Button 
            variant={activeFilter === "novas" ? "default" : "outline"}
            className={cn("rounded-xl font-bold border-slate-200 shrink-0", activeFilter === "novas" && "bg-blue-600 text-white")}
            onClick={() => setActiveFilter("novas")}
          >
            Novas
          </Button>
          <Button 
            variant={activeFilter === "analise" ? "default" : "outline"}
            className={cn("rounded-xl font-bold border-slate-200 shrink-0", activeFilter === "analise" && "bg-amber-500 text-white")}
            onClick={() => setActiveFilter("analise")}
          >
            Em Análise
          </Button>
          <Button 
            variant={activeFilter === "resolvidas" ? "default" : "outline"}
            className={cn("rounded-xl font-bold border-slate-200 shrink-0", activeFilter === "resolvidas" && "bg-emerald-600 text-white")}
            onClick={() => setActiveFilter("resolvidas")}
          >
            Resolvidas
          </Button>
        </div>
      </div>

      {/* LISTAGEM */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Carregando mensagens...</div>
        ) : filteredMensagens?.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <MessageSquareText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-500">Nenhuma mensagem encontrada.</p>
          </div>
        ) : (
          filteredMensagens?.map((msg) => (
            <Card key={msg.id} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all cursor-pointer group" onClick={() => openRespondModal(msg)}>
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "uppercase font-black tracking-widest text-xs px-3 py-1 border-0",
                      msg.status === 'nova' && "bg-blue-100 text-blue-700",
                      msg.status === 'em análise' && "bg-amber-100 text-amber-700",
                      msg.status === 'respondida' && "bg-emerald-100 text-emerald-700",
                      msg.status === 'resolvida' && "bg-slate-200 text-slate-700"
                    )}>
                      {msg.status}
                    </Badge>
                    <span className="text-xs font-black uppercase text-[#1a2e25] bg-[#C5D932]/20 px-3 py-1 rounded-full tracking-widest">
                      {msg.categoria}
                    </span>
                    <span className="text-sm font-bold text-slate-400 ml-auto sm:ml-2">
                      {new Date(msg.criado_em).toLocaleDateString('pt-BR')} às {new Date(msg.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{msg.assunto}</h3>
                    <p className="text-slate-500 font-medium line-clamp-2 mt-1">{msg.mensagem}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-lg">
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    {msg.morador?.nome || 'Morador'} • Unidade: {msg.morador?.unidade || 'N/A'}
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center justify-end sm:border-l border-slate-100 sm:pl-6">
                   <Button variant="ghost" className="rounded-xl font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Analisar <ChevronRight className="w-4 h-4 ml-2" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* MODAL DE RESPOSTA */}
      <Dialog open={!!selectedMsg} onOpenChange={(open) => !open && setSelectedMsg(null)}>
        <DialogContent className="sm:max-w-2xl bg-slate-50 p-0 overflow-hidden rounded-[2rem] border-none" aria-describedby="dialog-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Análise de Mensagem</DialogTitle>
            <DialogDescription id="dialog-description">Detalhes da mensagem enviada pelo morador e formulário de resposta.</DialogDescription>
          </DialogHeader>

          {selectedMsg && (
            <>
              <div className="p-8 bg-white border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className={cn(
                    "uppercase font-black tracking-widest text-xs px-3 py-1 border-0",
                    selectedMsg.status === 'nova' && "bg-blue-100 text-blue-700",
                    selectedMsg.status === 'em análise' && "bg-amber-100 text-amber-700",
                    selectedMsg.status === 'respondida' && "bg-emerald-100 text-emerald-700",
                    selectedMsg.status === 'resolvida' && "bg-slate-200 text-slate-700"
                  )}>
                    {selectedMsg.status}
                  </Badge>
                  <span className="text-xs font-black uppercase text-[#1a2e25] bg-[#C5D932]/20 px-3 py-1 rounded-full tracking-widest">
                    {selectedMsg.categoria}
                  </span>
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedMsg.assunto}</h2>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
                  <UserCircle className="w-4 h-4" />
                  Enviado por: {selectedMsg.morador?.nome} (Unidade {selectedMsg.morador?.unidade})
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 font-medium whitespace-pre-wrap">{selectedMsg.mensagem}</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Reply className="w-4 h-4 text-primary" /> 
                    Resposta da Administração
                  </label>
                  <Textarea 
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Digite a resposta para o morador..."
                    className="min-h-[120px] rounded-2xl border-slate-200 focus-visible:ring-primary font-medium resize-none bg-white"
                  />
                  <p className="text-xs font-bold text-slate-400 ml-1">O morador verá esta resposta no histórico do portal.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Atualizar Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['nova', 'em análise', 'respondida', 'resolvida'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setNovoStatus(s)}
                        className={cn(
                          "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                          novoStatus === s 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
                <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setSelectedMsg(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="rounded-xl font-black px-8 h-12 shadow-lg"
                  onClick={handleSave}
                  disabled={updateMensagem.isPending}
                >
                  {updateMensagem.isPending ? "Salvando..." : "Salvar e Atualizar"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}