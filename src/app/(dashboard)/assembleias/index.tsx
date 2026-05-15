import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { 
  Gavel, 
  MapPin, 
  Clock, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  FileText,
  Video,
  Download
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

export default function Assembleias() {
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()

  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [tipo, setTipo] = useState("Ordinária")
  const [status, setStatus] = useState("Agendada")
  const [dataAssembleia, setDataAssembleia] = useState("")
  const [horario1, setHorario1] = useState("")
  const [horario2, setHorario2] = useState("")
  const [local, setLocal] = useState("Salão de Festas / Online")
  const [linkVideo, setLinkVideo] = useState("")
  const [pauta, setPauta] = useState("")

  const canAdmin = perfil?.role === 'sindico' || perfil?.role === 'subsindico' || perfil?.role === 'super_admin'

  // 1. Fetch Assembleias
  const { data: assembleias, isLoading } = useQuery({
    queryKey: ['assembleias', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assembleias')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('data_assembleia', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Mutação: Salvar
  const saveAssembleia = useMutation({
    mutationFn: async () => {
      if (!titulo || !dataAssembleia || !horario1) throw new Error("Título, Data e 1ª Convocação são obrigatórios!")
      
      const payload = {
        condominio_id: tenant?.id,
        autor_id: user?.id,
        titulo,
        descricao,
        tipo,
        status,
        data_assembleia: dataAssembleia,
        horario_primeira_convocacao: horario1,
        horario_segunda_convocacao: horario2 || null,
        local,
        link_videochamada: linkVideo || null,
        pauta,
      }

      if (editingId) {
        const { error } = await supabase.from('assembleias').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('assembleias').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Assembleia atualizada!" : "Assembleia convocada com sucesso!")
      setOpenModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['assembleias'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message)
    }
  })

  const resetForm = () => {
    setEditingId(null)
    setTitulo(""); setDescricao(""); setTipo("Ordinária"); setStatus("Agendada")
    setDataAssembleia(""); setHorario1(""); setHorario2(""); setLocal("Salão de Festas / Online")
    setLinkVideo(""); setPauta("")
  }

  const handleEdit = (a: any) => {
    setEditingId(a.id)
    setTitulo(a.titulo)
    setDescricao(a.descricao || "")
    setTipo(a.tipo)
    setStatus(a.status)
    setDataAssembleia(a.data_assembleia)
    setHorario1(a.horario_primeira_convocacao)
    setHorario2(a.horario_segunda_convocacao || "")
    setLocal(a.local || "")
    setLinkVideo(a.link_videochamada || "")
    setPauta(a.pauta || "")
    setOpenModal(true)
  }

  const [searchTerm] = useState("")

  const filtered = assembleias?.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Finalizada': return 'bg-emerald-100 text-emerald-700'
      case 'Cancelada': return 'bg-red-100 text-red-700'
      case 'Em Andamento': return 'bg-blue-100 text-blue-700 animate-pulse'
      default: return 'bg-amber-100 text-amber-700'
    }
  }

  // Visão de Morador
  if (!canAdmin) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assembleias e Reuniões</h1>
          <p className="text-slate-500 font-medium">Editais de convocação e atas das decisões do {tenant?.nome}.</p>
        </div>

        <div className="grid gap-6 mt-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
          ) : filtered?.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed rounded-3xl">
              <Gavel className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Nenhuma assembleia agendada ou registrada.</p>
            </div>
          ) : (
            filtered?.map((a) => (
              <Card key={a.id} className="overflow-hidden border-none shadow-sm bg-white rounded-3xl">
                <CardHeader className="p-6 md:p-8">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex items-start gap-4">
                         <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl">
                            <Gavel className="h-6 w-6" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest">
                                  {a.tipo}
                               </Badge>
                               <Badge className={`${getStatusColor(a.status)} border-none font-black text-[10px] uppercase tracking-widest`}>
                                  {a.status}
                               </Badge>
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-800">{a.titulo}</CardTitle>
                         </div>
                      </div>
                      <div className="flex flex-col items-end text-right">
                         <span className="text-2xl font-black text-primary">
                            {format(new Date(a.data_assembleia), "dd/MM", { locale: ptBR })}
                         </span>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {format(new Date(a.data_assembleia), "EEEE", { locale: ptBR })}
                         </span>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="px-6 md:px-8 pb-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                      <div className="flex items-center gap-3">
                         <Clock className="w-5 h-5 text-primary" />
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Convocação</p>
                            <p className="text-sm font-bold text-slate-700">1ª: {a.horario_primeira_convocacao.substring(0,5)} | 2ª: {a.horario_segunda_convocacao?.substring(0,5) || "--"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <MapPin className="w-5 h-5 text-primary" />
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Local</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{a.local}</p>
                         </div>
                      </div>
                      {a.link_videochamada && (
                        <div className="flex items-center gap-3">
                           <Video className="w-5 h-5 text-primary" />
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Acesso Online</p>
                              <a href={a.link_videochamada} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline">Entrar na reunião</a>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   {a.pauta && (
                     <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Pauta do Dia</h4>
                        <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                           {a.pauta}
                        </div>
                     </div>
                   )}
                </CardContent>
                {a.ata_storage_path && (
                  <CardFooter className="bg-slate-50 p-6 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-700">Ata da Assembleia disponível</span>
                     </div>
                     <Button className="rounded-xl gap-2 font-bold" variant="outline">
                        <Download className="w-4 h-4" /> Baixar Ata
                     </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // Visão Admin
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Assembleias</h1>
          <p className="text-slate-500 font-medium mt-1">Convoque moradores e registre as atas oficiais.</p>
        </div>

        <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4" /> Convocar Assembleia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">
                {editingId ? 'Editar Convocação' : 'Nova Convocação'}
              </DialogTitle>
              <DialogDescription className="font-medium">Preencha os dados oficiais da assembleia.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Título da Assembleia</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Assembleia Geral Ordinária 2024" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Tipo</label>
                  <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="Ordinária">Ordinária</option>
                    <option value="Extraordinária">Extraordinária</option>
                    <option value="Especial">Especial</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Agendada">Agendada</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Finalizada">Finalizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Data</label>
                  <Input type="date" value={dataAssembleia} onChange={(e) => setDataAssembleia(e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">1ª Conv.</label>
                  <Input type="time" value={horario1} onChange={(e) => setHorario1(e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">2ª Conv.</label>
                  <Input type="time" value={horario2} onChange={(e) => setHorario2(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Local</label>
                <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Salão de Festas / Zoom" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Link Videochamada (Opcional)</label>
                <Input value={linkVideo} onChange={(e) => setLinkVideo(e.target.value)} placeholder="https://zoom.us/j/..." className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Pauta e Descrição</label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary"
                  placeholder="Liste os itens que serão discutidos..."
                  value={pauta}
                  onChange={(e) => setPauta(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => saveAssembleia.mutate()} disabled={saveAssembleia.isPending} className="rounded-xl px-8">
                {saveAssembleia.isPending ? "Salvando..." : editingId ? "Atualizar" : "Convocar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assembleia</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data / Horários</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>
                ))
              ) : filtered?.map((a) => (
                <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 text-slate-500 rounded-lg"><Gavel className="w-4 h-4" /></div>
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{a.titulo}</span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{a.tipo}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs font-bold text-slate-600">
                       <span>{format(new Date(a.data_assembleia), "dd/MM/yyyy")}</span>
                       <span className="text-slate-400">1ª: {a.horario_primeira_convocacao.substring(0,5)} | 2ª: {a.horario_segunda_convocacao?.substring(0,5) || "--"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <Badge className={`${getStatusColor(a.status)} border-none font-black text-[10px] uppercase tracking-widest`}>
                        {a.status}
                     </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(a)}><Edit2 className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400" onClick={async () => {
                         if(confirm("Deseja excluir esta convocação?")) {
                           await supabase.from('assembleias').delete().eq('id', a.id)
                           queryClient.invalidateQueries({ queryKey: ['assembleias'] })
                           toast.success("Assembleia excluída.")
                         }
                       }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
