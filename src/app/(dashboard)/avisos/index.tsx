import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Pin, 
  Edit2, 
  Trash2, 
  Calendar,
  FileText,
  Megaphone,
  CheckCircle2,
  Clock
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
import { Badge } from "../../../components/ui/badge"
import { cn } from "../../../lib/utils"

export default function AvisosFeed() {
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [tag, setTag] = useState("Aviso Geral")
  const [publicarEm, setPublicarEm] = useState("")
  const [linkDocumento, setLinkDocumento] = useState("")
  const [fixado, setFixado] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const canPublish = perfil?.role === "sindico" || perfil?.role === "super_admin"

  // 1. Fetch Comunicados
  const { data: avisos, isLoading } = useQuery({
    queryKey: ['avisos', tenant?.id, canPublish],
    queryFn: async () => {
      const nowIso = new Date().toISOString()
      let query = supabase
        .from('comunicados')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })

      // Temporariamente removida a ordenação por 'fixado' para evitar erro 400 se a coluna não existir
      // .order('fixado', { ascending: false }) 

      if (!canPublish) {
        query = query.or(`publicar_em.is.null,publicar_em.lte.${nowIso}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Mutação: Salvar (Criar ou Editar)
  const saveAviso = useMutation({
    mutationFn: async () => {
      if (!titulo || !conteudo) throw new Error("Preencha título e conteúdo!")
      if (!canPublish) throw new Error("Apenas a administração pode publicar comunicados.")
      if (!perfil) throw new Error("Seu perfil não foi encontrado. Tente sair e entrar novamente.")
      
      const payload: any = {
        condominio_id: tenant?.id,
        autor_id: user?.id,
        titulo,
        conteudo,
        tag,
      }

      // Adiciona colunas novas apenas se necessário (evita erro 400 se o SQL não foi rodado)
      if (publicarEm) payload.publicar_em = new Date(publicarEm).toISOString()
      if (linkDocumento) payload.link_documento = linkDocumento
      if (fixado) payload.fixado = fixado

      console.log("Tentando salvar comunicado:", payload)

      if (editingId) {
        const { error } = await supabase.from('comunicados').update(payload).eq('id', editingId)
        if (error) {
          console.error("Erro no Update:", error)
          throw error
        }
      } else {
        const { error } = await supabase.from('comunicados').insert(payload)
        if (error) {
          console.error("Erro no Insert:", error)
          throw error
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Comunicado atualizado!" : "Comunicado publicado com sucesso!")
      setOpenModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['avisos'] })
      queryClient.invalidateQueries({ queryKey: ['avisos_publicos'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message)
    }
  })

  // 3. Mutação: Excluir
  const deleteAviso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comunicados').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Comunicado removido.")
      queryClient.invalidateQueries({ queryKey: ['avisos'] })
    }
  })

  const resetForm = () => {
    setEditingId(null)
    setTitulo("")
    setConteudo("")
    setTag("Aviso Geral")
    setPublicarEm("")
    setLinkDocumento("")
    setFixado(false)
  }

  const handleEdit = (aviso: any) => {
    setEditingId(aviso.id)
    setTitulo(aviso.titulo)
    setConteudo(aviso.conteudo)
    setTag(aviso.tag || "Aviso Geral")
    setPublicarEm(aviso.publicar_em ? new Date(aviso.publicar_em).toISOString().slice(0, 16) : "")
    setLinkDocumento(aviso.link_documento || "")
    setFixado(aviso.fixado || false)
    setOpenModal(true)
  }

  const filteredAvisos = avisos?.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tag?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Visão de Morador (Cards)
  if (!canPublish) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Comunicados</h1>
          <p className="text-slate-500 font-medium">Mural oficial de avisos do {tenant?.nome}.</p>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
          ) : filteredAvisos?.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed rounded-3xl">
              <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Nenhum comunicado no momento.</p>
            </div>
          ) : (
            filteredAvisos?.map((aviso) => (
              <Card key={aviso.id} className={cn(
                "relative overflow-hidden border-none shadow-sm transition-all hover:shadow-md",
                aviso.fixado ? "ring-2 ring-primary/20 bg-primary/5" : "bg-white"
              )}>
                {aviso.fixado && (
                  <div className="absolute top-0 right-0 p-3">
                    <Pin className="w-4 h-4 text-primary fill-primary" />
                  </div>
                )}
                <CardHeader className="pb-2">
                   <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                        {aviso.tag || 'Aviso'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(aviso.publicar_em || aviso.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                   </div>
                   <CardTitle className="text-xl font-black text-slate-800">{aviso.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                    {aviso.conteudo}
                  </p>
                  {aviso.link_documento && (
                    <div className="mt-6 flex items-center gap-3">
                      <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 gap-2" asChild>
                        <a href={aviso.link_documento} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4" /> Ver Documento Anexo
                        </a>
                      </Button>
                    </div>
                  )}
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gerenciar Comunicados</h1>
          <p className="text-slate-500 font-medium mt-1">Publique avisos, agende postagens e fixe mensagens importantes.</p>
        </div>

        <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4" /> Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">
                {editingId ? 'Editar Comunicado' : 'Publicar Novo Comunicado'}
              </DialogTitle>
              <DialogDescription className="font-medium">
                Este aviso será visível para todos os moradores aprovados.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Título</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Manutenção Preventiva dos Elevadores" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Categoria (Tag)</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary"
                    value={tag} 
                    onChange={(e) => setTag(e.target.value)}
                  >
                    <option value="Aviso Geral">Aviso Geral</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Assembleia">Assembleia</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Lazer">Lazer / Áreas Comuns</option>
                    <option value="Urgente">🚨 Urgente</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Data de Publicação</label>
                  <Input type="datetime-local" value={publicarEm} onChange={(e) => setPublicarEm(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Link de Documento (Opcional)</label>
                <Input value={linkDocumento} onChange={(e) => setLinkDocumento(e.target.value)} placeholder="Link do Google Drive, Dropbox, etc." className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Conteúdo da Mensagem</label>
                <textarea 
                  className="flex min-h-[150px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary"
                  placeholder="Escreva aqui o detalhamento do comunicado..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="fixar" 
                  checked={fixado} 
                  onChange={(e) => setFixado(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="fixar" className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                  <Pin className="w-3.5 h-3.5" /> Fixar no topo do mural
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
              <Button 
                onClick={() => saveAviso.mutate()} 
                disabled={saveAviso.isPending}
                className="rounded-xl px-8"
              >
                {saveAviso.isPending ? "Salvando..." : editingId ? "Atualizar" : "Publicar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Table Card */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
           <CardTitle className="text-lg font-black text-slate-800">Mural de Comunicados</CardTitle>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar por título ou tag..." 
                   className="pl-9 h-10 rounded-xl border-slate-100 bg-slate-50 w-64 focus:bg-white transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 text-slate-400">
                 <Filter className="w-4 h-4" />
              </Button>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Título / Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Publicação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fixado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-48 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-8 rounded-lg" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAvisos?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <Megaphone className="w-12 h-12" />
                         <p className="font-bold">Nenhum comunicado encontrado</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredAvisos?.map((aviso) => {
                  const isScheduled = aviso.publicar_em && new Date(aviso.publicar_em) > new Date();
                  return (
                    <tr key={aviso.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800 line-clamp-1">{aviso.titulo}</span>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              {isScheduled ? (
                                <Badge className="bg-amber-50 text-amber-600 border-none text-[9px] font-black uppercase tracking-tight h-4">
                                  <Clock className="w-2.5 h-2.5 mr-1" /> Agendado
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase tracking-tight h-4">
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Ativo
                                </Badge>
                              )}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest">
                            {aviso.tag || 'Geral'}
                         </Badge>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(aviso.publicar_em || aviso.criado_em).toLocaleDateString('pt-BR')}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         {aviso.fixado ? (
                           <Pin className="w-4 h-4 text-primary fill-primary" />
                         ) : (
                           <span className="text-slate-200">-</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg"
                              onClick={() => handleEdit(aviso)}
                            >
                               <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-destructive rounded-lg"
                              onClick={() => {
                                if(confirm("Deseja apagar este comunicado permanentemente?")) deleteAviso.mutate(aviso.id)
                              }}
                            >
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
