import { useState, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "react-router"
import { Card, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Search, 
  File, 
  Calendar,
  Eye,
  Edit2
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

export default function DocumentosVault() {
  const { user, perfil } = useAuthStore()
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
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("Atas de Assembleia")
  const [link, setLink] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const canAdmin = perfil?.role === 'sindico' || perfil?.role === 'subsindico' || perfil?.role === 'super_admin'

  const resetForm = () => {
    setTitulo("")
    setDescricao("")
    setCategoria("Atas de Assembleia")
    setLink("")
    setEditingDoc(null)
  }

  const openEdit = (doc: any) => {
    setEditingDoc(doc)
    setTitulo(doc.titulo)
    setDescricao(doc.descricao || "")
    setCategoria(doc.categoria)
    setLink(doc.storage_path || "")
    setOpenModal(true)
  }

  // 1. Fetch Documentos
  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Mutação: Salvar (Criar ou Editar)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!titulo) throw new Error("Dê um título ao documento!")
      if (!perfil) throw new Error("Perfil não encontrado.")
      if (!link) throw new Error("Informe o link do Google Drive (ou outro link de arquivo)!")
      if (!tenant?.id) throw new Error("Condomínio não identificado.")
      if (!user?.id) throw new Error("Usuário não identificado.")

      let storagePath = link
      let fileSize = editingDoc?.tamanho_bytes || null

      const payload: any = {
        titulo,
        categoria,
        storage_path: storagePath,
      }
      
      if (descricao) payload.descricao = descricao
      if (fileSize !== null) payload.tamanho_bytes = fileSize

      if (editingDoc) {
        // Update
        const { error } = await supabase
          .from('documentos')
          .update(payload)
          .eq('id', editingDoc.id)
        
        if (error) throw error
      } else {
        // Insert
        payload.condominio_id = tenant.id
        payload.autor_id = user.id
        
        const { error } = await supabase
          .from('documentos')
          .insert(payload)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editingDoc ? "Documento atualizado!" : "Documento publicado com sucesso!")
      setOpenModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message)
    }
  })

  // 3. Mutação: Excluir
  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      // Se não for link externo (http), apaga do storage legado
      if (doc.storage_path && !doc.storage_path.startsWith('http')) {
        await supabase.storage.from('documentos_condominio').remove([doc.storage_path])
      }
      const { error } = await supabase.from('documentos').delete().eq('id', doc.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Documento removido.")
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
    }
  })

  const downloadFile = async (path: string) => {
    if (!path) return
    if (path.startsWith('http')) {
      window.open(path, "_blank")
      return
    }
    // Lógica legada para arquivos que ainda estão no Storage do Supabase
    const { data } = supabase.storage.from('documentos_condominio').getPublicUrl(path)
    if (data.publicUrl) {
       window.open(data.publicUrl, "_blank")
    } else {
       toast.error("Erro ao gerar link de download")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "Link Externo"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const filteredDocs = documentos?.filter(d => 
    d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Visão de Morador (Cards)
  if (!canAdmin) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Arquivos Informativos</h1>
          <p className="text-slate-500 font-medium">Acesse atas, editais, circulares e comunicados oficiais do {tenant?.nome}.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
          ) : filteredDocs?.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-white border border-dashed rounded-3xl">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Nenhum documento disponível no momento.</p>
            </div>
          ) : (
            filteredDocs?.map((doc) => (
              <Card key={doc.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white rounded-3xl flex flex-col">
                <CardHeader className="pb-3 px-6 pt-6">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                         <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                         <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">{doc.categoria}</span>
                         <CardTitle className="text-base font-black text-slate-800 line-clamp-2 leading-tight">{doc.titulo}</CardTitle>
                      </div>
                   </div>
                </CardHeader>
                <CardFooter className="mt-auto px-6 pb-6 pt-2 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatFileSize(doc.tamanho_bytes)}</span>
                   <Button variant="ghost" size="sm" className="rounded-xl text-primary font-bold hover:bg-primary/5 gap-2" onClick={() => downloadFile(doc.storage_path)}>
                      <Eye className="w-4 h-4" /> Acessar
                   </Button>
                </CardFooter>
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Arquivos Informativos</h1>
          <p className="text-slate-500 font-medium mt-1">Publique atas, editais e circulares para manter os moradores informados.</p>
        </div>

        <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
              <UploadCloud className="w-4 h-4" /> Novo Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">
                {editingDoc ? "Editar Documento" : "Novo Documento"}
              </DialogTitle>
              <DialogDescription className="font-medium">Adicione o link do Google Drive para disponibilizar aos moradores.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Título do Arquivo</label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Ata de Assembleia Outubro 2024" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Descrição (Opcional)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Breve descrição do conteúdo do arquivo..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Categoria</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary"
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="Atas de Assembleia">Atas de Assembleia</option>
                  <option value="Editais de Convocação">Editais de Convocação</option>
                  <option value="Circulares e Avisos">Circulares e Avisos</option>
                  <option value="Regimento e Convenção">Regimento e Convenção</option>
                  <option value="Financeiro / Balancetes">Financeiro / Balancetes</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Link do Documento (Google Drive)</label>
                <Input 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="https://drive.google.com/file/d/..." 
                  className="rounded-xl" 
                />
                <p className="text-xs text-slate-400">Cole o link de compartilhamento do arquivo (certifique-se que está acessível).</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (!link && !editingDoc)} className="rounded-xl px-8">
                {saveMutation.isPending ? "Salvando..." : (editingDoc ? "Salvar Alterações" : "Publicar Arquivo")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Table Card */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
           <CardTitle className="text-lg font-black text-slate-800">Arquivos do Condomínio</CardTitle>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar por título ou categoria..." 
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
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tamanho</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Upload</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-48 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredDocs?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <FileText className="w-12 h-12" />
                         <p className="font-bold">Nenhum documento encontrado</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredDocs?.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <File className="w-5 h-5" />
                         </div>
                         <span className="text-sm font-bold text-slate-800 line-clamp-1">{doc.titulo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest">
                          {doc.categoria}
                       </Badge>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-slate-400 uppercase">{formatFileSize(doc.tamanho_bytes)}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg"
                            onClick={() => downloadFile(doc.storage_path)}
                            title="Visualizar"
                          >
                             <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-amber-500 rounded-lg"
                            onClick={() => openEdit(doc)}
                            title="Editar"
                          >
                             <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-destructive rounded-lg"
                            onClick={() => {
                              if(confirm("Deseja apagar este documento permanentemente?")) deleteMutation.mutate(doc)
                            }}
                            title="Excluir"
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
