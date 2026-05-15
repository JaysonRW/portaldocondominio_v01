import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  PlusCircle, 
  PartyPopper, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar
} from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "../../../components/ui/badge"

export default function EventosSociais() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()

  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataEvento, setDataEvento] = useState("")
  const [horario, setHorario] = useState("")
  const [local, setLocal] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const canAdmin = perfil?.role === 'sindico' || perfil?.role === 'super_admin'

  // 1. Fetch Eventos
  const { data: eventos, isLoading } = useQuery({
    queryKey: ['eventos', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('data_evento', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Mutação: Salvar (Criar ou Editar)
  const saveEvento = useMutation({
    mutationFn: async () => {
      if (!titulo || !dataEvento) throw new Error("Título e Data são obrigatórios!")
      if (!perfil) throw new Error("Perfil não encontrado.")
      
      const payload = {
        condominio_id: tenant?.id,
        autor_id: perfil?.id, // Correção: referenciar o id da tabela perfis, não auth.users
        titulo,
        descricao,
        data_evento: dataEvento,
        horario_inicio: horario || null,
        local,
      }

      if (editingId) {
        const { error } = await supabase.from('eventos').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('eventos').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Evento atualizado!" : "Evento agendado com sucesso!")
      setOpenModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
    },
    onError: (error: any) => {
      toast.error("Falha ao salvar evento: " + error.message)
    }
  })

  // 3. Mutação: Excluir
  const deleteEvento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Evento removido.")
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
    }
  })

  const resetForm = () => {
    setEditingId(null)
    setTitulo(""); setDescricao(""); setDataEvento(""); setHorario(""); setLocal("")
  }

  const handleEdit = (evento: any) => {
    setEditingId(evento.id)
    setTitulo(evento.titulo)
    setDescricao(evento.descricao || "")
    setDataEvento(evento.data_evento)
    setHorario(evento.horario_inicio || "")
    setLocal(evento.local || "")
    setOpenModal(true)
  }

  const filteredEventos = eventos?.filter(e => 
    e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.local?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Visão de Morador (Cards)
  if (!canAdmin) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Eventos Sociais</h1>
          <p className="text-slate-500 font-medium">Participe das atividades e celebrações do {tenant?.nome}.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)
          ) : filteredEventos?.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-white border border-dashed rounded-3xl">
              <PartyPopper className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Ainda não temos eventos agendados.</p>
            </div>
          ) : (
            filteredEventos?.map((evento) => (
              <Card key={evento.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white rounded-3xl">
                <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-primary/10 text-primary p-2 rounded-xl">
                         <CalendarIcon className="h-5 w-5" />
                      </div>
                      <Badge className="bg-slate-50 text-slate-500 border-none font-bold">
                         {format(new Date(evento.data_evento), "dd 'de' MMM", { locale: ptBR })}
                      </Badge>
                   </div>
                   <CardTitle className="text-xl font-black text-slate-800 line-clamp-2">{evento.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm text-slate-500 line-clamp-3 font-medium">{evento.descricao || "Sem descrição detalhada."}</p>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                         <Clock className="h-3.5 w-3.5 text-primary" />
                         <span>{evento.horario_inicio ? evento.horario_inicio.substring(0,5) : "A definir"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                         <MapPin className="h-3.5 w-3.5 text-primary" />
                         <span className="line-clamp-1">{evento.local || "A definir"}</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // Visão de Síndico (Tabela Profissional)
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda de Eventos</h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie celebrações, reuniões e eventos do condomínio.</p>
        </div>

        <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">
                {editingId ? 'Editar Evento' : 'Agendar Novo Evento'}
              </DialogTitle>
              <DialogDescription className="font-medium">
                O evento aparecerá no calendário de todos os moradores.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Título do Evento</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Festa da Primavera" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Data</label>
                  <Input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Horário</label>
                  <Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Localização</label>
                <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Salão de Festas Principal" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Descrição / Detalhes</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary"
                  placeholder="Informações adicionais para os moradores..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => saveEvento.mutate()} disabled={saveEvento.isPending} className="rounded-xl px-8">
                {saveEvento.isPending ? "Salvando..." : editingId ? "Atualizar" : "Agendar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Table Card */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
           <CardTitle className="text-lg font-black text-slate-800">Próximos Eventos</CardTitle>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar por título ou local..." 
                   className="pl-9 h-10 rounded-xl border-slate-100 bg-slate-50 w-64 focus:bg-white transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Local</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-48 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredEventos?.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <CalendarIcon className="w-12 h-12" />
                         <p className="font-bold">Nenhum evento agendado</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredEventos?.map((evento) => (
                  <tr key={evento.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-800">{evento.titulo}</span>
                         <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
                           {evento.descricao || 'Sem descrição'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                             <Calendar className="w-3.5 h-3.5 text-primary" />
                             <span>{format(new Date(evento.data_evento), "dd/MM/yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                             <Clock className="w-3.5 h-3.5" />
                             <span>{evento.horario_inicio ? evento.horario_inicio.substring(0,5) : "A definir"}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{evento.local || "Não informado"}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg"
                            onClick={() => handleEdit(evento)}
                          >
                             <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-destructive rounded-lg"
                            onClick={() => {
                              if(confirm("Deseja apagar este evento?")) deleteEvento.mutate(evento.id)
                            }}
                          >
                             <Trash2 className="w-4 h-4" />
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
  )
}
