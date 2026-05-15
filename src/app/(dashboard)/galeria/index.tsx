import { useState, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "react-router"
import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { 
  Image as ImageIcon, 
  UploadCloud, 
  ChevronLeft, 
  Trash2, 
  Camera,
  FolderPlus
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

export default function GaleriaCondominio() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const location = useLocation()
  
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [openAlbumModal, setOpenAlbumModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('new') === 'true') {
      setOpenAlbumModal(true)
    }
  }, [location])
  const [openPhotoModal, setOpenPhotoModal] = useState(false)
  
  const [novoAlbumTitulo, setNovoAlbumTitulo] = useState("")
  const [novoAlbumDesc, setNovoAlbumDesc] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  const canAdmin = perfil?.role === 'sindico' || perfil?.role === 'subsindico' || perfil?.role === 'super_admin'

  // 1. Fetch Álbuns
  const { data: albuns, isLoading: loadingAlbuns } = useQuery({
    queryKey: ['galeria_albuns', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeria_albuns')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Fetch Fotos
  const { data: fotos, isLoading: loadingFotos } = useQuery({
    queryKey: ['galeria_fotos', selectedAlbum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeria_fotos')
        .select('*')
        .eq('album_id', selectedAlbum)
        .order('criado_em', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!selectedAlbum,
  })

  // Mutação: Criar Álbum
  const createAlbum = useMutation({
    mutationFn: async () => {
      if (!novoAlbumTitulo) throw new Error("Título é obrigatório!")
      const { error } = await supabase
        .from('galeria_albuns')
        .insert({
          condominio_id: tenant?.id,
          titulo: novoAlbumTitulo,
          descricao: novoAlbumDesc,
        })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Álbum criado com sucesso!")
      setOpenAlbumModal(false)
      setNovoAlbumTitulo(""); setNovoAlbumDesc("")
      queryClient.invalidateQueries({ queryKey: ['galeria_albuns'] })
    }
  })

  // Mutação: Upload de Fotos (Múltiplas)
  const uploadPhotos = useMutation({
    mutationFn: async () => {
      if (!selectedFiles || !selectedAlbum) throw new Error("Selecione os arquivos!")
      
      const filesArray = Array.from(selectedFiles)
      const uploadPromises = filesArray.map(async (file) => {
        // Formata o nome do arquivo para remover espaços e caracteres que quebram URLs
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${tenant?.id}/${selectedAlbum}/${crypto.randomUUID()}-${safeName}`
        
        const { error: uploadError } = await supabase.storage
          .from('galeria_condominio')
          .upload(filePath, file, {
             cacheControl: '3600',
             upsert: false
          })

        if (uploadError) {
           console.error("Storage Upload Error:", uploadError)
           throw new Error(`Erro ao enviar foto pro storage: ${uploadError.message}`)
        }

        // Extrai apenas o caminho sem o URL completo
        // Como você está usando RLS publico no bucket, basta pegar a URL inteira 
        // e salvar no bd.
        const { data: { publicUrl } } = supabase.storage.from('galeria_condominio').getPublicUrl(filePath)

        const { error: dbError } = await supabase
          .from('galeria_fotos')
          .insert({
            album_id: selectedAlbum,
            storage_path: publicUrl, // Mudança: Salva direto a Public URL!
          })
        
        if (dbError) {
           console.error("Database Insert Error:", dbError)
           throw new Error(`Erro ao salvar foto no banco: ${dbError.message}`)
        }
        return publicUrl
      })

      const publicUrls = await Promise.all(uploadPromises)

      // Update cover if album currently has no cover
      const currentAlbum = albuns?.find(a => a.id === selectedAlbum)
      if (!currentAlbum?.capa_url && publicUrls.length > 0) {
         await supabase.from('galeria_albuns').update({ capa_url: publicUrls[0] }).eq('id', selectedAlbum)
         queryClient.invalidateQueries({ queryKey: ['galeria_albuns'] })
      }
    },
    onSuccess: () => {
      toast.success("Fotos adicionadas com sucesso!")
      setOpenPhotoModal(false)
      setSelectedFiles(null)
      queryClient.invalidateQueries({ queryKey: ['galeria_fotos', selectedAlbum] })
    }
  })

  // Mutação: Excluir Álbum
  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { data: albumFotos } = await supabase.from('galeria_fotos').select('storage_path').eq('album_id', id)
      if (albumFotos && albumFotos.length > 0) {
        const paths = albumFotos.map(f => f.storage_path)
        await supabase.storage.from('galeria_condominio').remove(paths)
      }
      const { error } = await supabase.from('galeria_albuns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Álbum removido.")
      queryClient.invalidateQueries({ queryKey: ['galeria_albuns'] })
    }
  })

  const getPublicUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return supabase.storage.from('galeria_condominio').getPublicUrl(path).data.publicUrl
  }

  // Detalhe do Álbum
  if (selectedAlbum) {
    const album = albuns?.find(a => a.id === selectedAlbum)
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedAlbum(null)} className="rounded-xl bg-white shadow-sm border border-slate-100">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">{album?.titulo}</h1>
             <p className="text-slate-500 font-medium text-sm">{album?.descricao || 'Sem descrição'}</p>
          </div>
          <div className="ml-auto">
             {canAdmin && (
                <Dialog open={openPhotoModal} onOpenChange={setOpenPhotoModal}>
                   <DialogTrigger asChild>
                      <Button className="bg-primary hover:opacity-90 rounded-xl gap-2 shadow-lg shadow-primary/20">
                         <UploadCloud className="w-4 h-4" /> Enviar Foto
                      </Button>
                   </DialogTrigger>
                   <DialogContent>
                      <DialogHeader>
                         <DialogTitle className="text-xl font-black text-slate-800">Adicionar Fotos</DialogTitle>
                         <DialogDescription className="font-medium">Selecione uma ou mais imagens para este álbum.</DialogDescription>
                      </DialogHeader>
                      <div className="py-6">
                         <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors cursor-pointer relative">
                            <Input type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Camera className="w-10 h-10 text-slate-300" />
                            <span className="text-sm font-bold text-slate-500 text-center">
                              {selectedFiles ? `${selectedFiles.length} arquivos selecionados` : "Selecione as imagens"}
                            </span>
                         </div>
                      </div>
                      <DialogFooter>
                         <Button onClick={() => uploadPhotos.mutate()} disabled={uploadPhotos.isPending || !selectedFiles} className="rounded-xl px-8">
                            {uploadPhotos.isPending ? "Enviando..." : "Salvar Fotos"}
                         </Button>
                      </DialogFooter>
                   </DialogContent>
                </Dialog>
             )}
          </div>
        </div>

        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
           {loadingFotos ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-3xl" />)
           ) : fotos?.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-white">
                 <Camera className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                 <p className="text-slate-400 font-bold">Nenhuma foto neste álbum ainda.</p>
              </div>
           ) : (
              fotos?.map((foto) => (
                 <div key={foto.id} className="group relative aspect-square overflow-hidden rounded-3xl bg-slate-100 border border-slate-50 shadow-sm">
                    <img src={getPublicUrl(foto.storage_path)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {canAdmin && (
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl shadow-lg"
                            onClick={() => confirm("Excluir esta foto?") && queryClient.invalidateQueries({ queryKey: ['galeria_fotos'] })}
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    )}
                 </div>
              ))
           )}
        </div>
      </div>
    )
  }

  // Lista de Álbuns
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Galeria do Condomínio</h1>
          <p className="text-slate-500 font-medium mt-1">Registros visuais de melhorias, festas e do cotidiano.</p>
        </div>

        {canAdmin && (
          <Dialog open={openAlbumModal} onOpenChange={setOpenAlbumModal}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:opacity-90 rounded-xl gap-2 shadow-lg shadow-primary/20">
                <FolderPlus className="w-4 h-4" /> Novo Álbum
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-800">Criar Álbum</DialogTitle>
                <DialogDescription className="font-medium">Organize suas fotos por temas ou datas.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Nome do Álbum</label>
                  <Input value={novoAlbumTitulo} onChange={(e) => setNovoAlbumTitulo(e.target.value)} placeholder="Ex: Assembleia Geral 2024" className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Descrição Curta</label>
                  <Input value={novoAlbumDesc} onChange={(e) => setNovoAlbumDesc(e.target.value)} placeholder="Ex: Registros das decisões tomadas..." className="rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createAlbum.mutate()} disabled={createAlbum.isPending} className="rounded-xl px-8">
                  {createAlbum.isPending ? "Criando..." : "Criar Álbum"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loadingAlbuns ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
        ) : albuns?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white border-2 border-dashed rounded-[40px]">
            <ImageIcon className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Galeria Vazia</h3>
            <p className="text-slate-400 font-medium mt-1">Crie seu primeiro álbum para começar a guardar memórias.</p>
          </div>
        ) : (
          albuns?.map((album) => (
            <div key={album.id} className="relative group">
              <Card 
                className="cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[32px] h-full flex flex-col"
                onClick={() => setSelectedAlbum(album.id)}
              >
                <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                  {album.capa_url ? (
                    <img src={album.capa_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <ImageIcon className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                     <h3 className="text-white font-black text-lg leading-tight line-clamp-1">{album.titulo}</h3>
                     <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Ver Álbum</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {album.descricao || "Sem descrição disponível para este álbum."}
                  </p>
                </CardContent>
              </Card>
              {canAdmin && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 rounded-2xl shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm("Excluir álbum e todas as fotos dele?")) deleteAlbum.mutate(album.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
