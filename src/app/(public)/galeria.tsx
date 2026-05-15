import { useState } from "react"
import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { Camera, ChevronLeft, Image as ImageIcon } from "lucide-react"
import { Button } from "../../components/ui/button"

export default function PublicGaleria() {
  const { tenant } = useTenantStore()
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)

  // 1. Busca os álbuns do condomínio
  const { data: albuns, isLoading: loadingAlbuns } = useQuery({
    queryKey: ['public_galeria_albuns', tenant?.id],
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

  // 2. Busca as fotos do álbum selecionado
  const { data: fotos, isLoading: loadingFotos } = useQuery({
    queryKey: ['public_galeria_fotos', selectedAlbum],
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

  // Exibição do Álbum Aberto
  if (selectedAlbum) {
    const album = albuns?.find(a => a.id === selectedAlbum)
    return (
      <div className="min-h-screen bg-slate-50/50">
        <PublicHeader />
        
        <main className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedAlbum(null)} 
              className="rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{album?.titulo}</h1>
              <p className="text-slate-500 font-medium text-sm">{album?.descricao || 'Sem descrição'}</p>
            </div>
          </div>

          {loadingFotos ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : fotos?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nenhuma foto neste álbum</h3>
              <p className="text-slate-500 mt-1">O síndico ainda não adicionou imagens aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {fotos?.map((foto) => (
                <div 
                  key={foto.id} 
                  className="aspect-square rounded-2xl bg-slate-100 overflow-hidden relative group border border-slate-200 shadow-sm"
                >
                  <img 
                    src={foto.storage_path} 
                    alt="Foto da Galeria" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Exibição da Lista de Álbuns (Página Principal da Galeria)
  return (
    <div className="min-h-screen bg-slate-50/50">
      <PublicHeader />
      
      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#C5D932]/20 text-[#1a2e25] rounded-2xl">
              <Camera className="w-6 h-6" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">Galeria de Fotos</h1>
          </div>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Acompanhe os registros dos eventos, obras e momentos especiais do condomínio.
          </p>
        </div>

        {loadingAlbuns ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                 <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
           </div>
        ) : albuns?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Galeria Vazia</h3>
            <p className="text-slate-500 mt-2">Nenhum álbum foi criado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albuns?.map((album) => (
              <div 
                key={album.id}
                onClick={() => setSelectedAlbum(album.id)}
                className="group cursor-pointer bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {album.capa_url ? (
                    <img 
                      src={album.capa_url} 
                      alt={album.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-10 h-10 opacity-50" />
                      <span className="text-sm font-bold">Sem capa</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {album.titulo}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2">
                    {album.descricao || "Sem descrição"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
