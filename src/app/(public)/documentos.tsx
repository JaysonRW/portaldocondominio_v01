import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { Search, FileText, Eye } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { Skeleton } from "../../components/ui/skeleton"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"

export default function PublicDocumentos() {
  const { tenant } = useTenantStore()
  const [search, setSearch] = useState("")
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas as Categorias")

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['documentos_public', tenant?.id],
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

  const downloadFile = async (path: string) => {
    if (!path) return
    if (path.startsWith('http')) {
      window.open(path, "_blank")
      return
    }
    const { data } = supabase.storage.from('documentos_condominio').getPublicUrl(path)
    if (data.publicUrl) {
       window.open(data.publicUrl, "_blank")
    } else {
       toast.error("Erro ao gerar link de download")
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return "Link Externo"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const categoriasUnicas = Array.from(new Set(documentos?.map(d => d.categoria) || []))

  const filteredDocs = documentos?.filter(d => {
    const matchesSearch = d.titulo.toLowerCase().includes(search.toLowerCase()) || 
                          (d.descricao && d.descricao.toLowerCase().includes(search.toLowerCase()))
    const matchesCategoria = categoriaSelecionada === "Todas as Categorias" || d.categoria === categoriaSelecionada
    return matchesSearch && matchesCategoria
  })

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">Central de Documentos</h1>
          <p className="text-slate-500 text-lg font-medium">Acesse atas de reunião, regulamentos, balancetes e outros documentos importantes.</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800 cursor-pointer"
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
          >
            <option value="Todas as Categorias">Todas as Categorias</option>
            {categoriasUnicas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
        ) : filteredDocs?.length === 0 ? (
          <div className="min-h-[400px] flex items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="text-center p-12">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <FileText className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">Nenhum documento encontrado</h3>
              <p className="text-slate-400 font-medium text-lg">Tente buscar por outros termos ou selecionar uma categoria diferente.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs?.map((doc) => (
              <div key={doc.id} className="group overflow-hidden shadow-sm hover:shadow-md transition-all bg-white rounded-3xl flex flex-col border border-slate-100">
                <div className="pb-3 px-6 pt-6">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#1a2e25]/5 text-[#1a2e25] rounded-2xl group-hover:bg-[#1a2e25] group-hover:text-white transition-colors">
                         <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                         <span className="text-[10px] font-black uppercase text-[#1a2e25]/60 tracking-widest mb-1">{doc.categoria}</span>
                         <h3 className="text-base font-black text-slate-800 line-clamp-2 leading-tight">{doc.titulo}</h3>
                         {doc.descricao && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.descricao}</p>}
                      </div>
                   </div>
                </div>
                <div className="mt-auto px-6 pb-6 pt-2 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatFileSize(doc.tamanho_bytes)}</span>
                   <Button variant="ghost" size="sm" className="rounded-xl text-[#1a2e25] font-bold hover:bg-[#1a2e25]/5 gap-2" onClick={() => downloadFile(doc.storage_path)}>
                      <Eye className="w-4 h-4" /> Acessar
                   </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>© {new Date().getFullYear()} Condomínio Smart. Plataforma oficial de transparência para {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.</p>
        </div>
      </footer>
    </div>
  )
}
