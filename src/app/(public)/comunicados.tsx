import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { Search, ExternalLink, Bell, ArrowRight } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { withTenantPrefix } from "../../lib/utils"

export default function PublicComunicados() {
  const { tenant } = useTenantStore()
  const { user, perfil } = useAuthStore()
  const [search, setSearch] = useState("")

  const { data: comunicados, isLoading } = useQuery({
    queryKey: ['avisos_publicos_lista', tenant?.id],
    queryFn: async () => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .or(`publicar_em.is.null,publicar_em.lte.${nowIso}`)
        .order('criado_em', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // Busca encomendas pendentes do morador logado
  const { data: encomendasPendentes } = useQuery({
    queryKey: ['morador-encomendas-pendentes', tenant?.id, user?.id, perfil?.unidade, perfil?.bloco],
    queryFn: async () => {
      if (!tenant?.id || !user?.id) return []

      let query = supabase
        .from('encomendas')
        .select('id')
        .eq('condominio_id', tenant.id)
        .eq('status', 'pendente')

      if (perfil?.unidade) {
        if (perfil.bloco) {
          query = query.or(`morador_id.eq.${user?.id},and(unidade.eq.${perfil.unidade},bloco.eq.${perfil.bloco})`)
        } else {
          query = query.or(`morador_id.eq.${user?.id},and(unidade.eq.${perfil.unidade},bloco.is.null)`)
        }
      } else {
        query = query.eq('morador_id', user?.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id && !!user?.id,
  })

  const filtered = comunicados?.filter(c => 
    c.titulo.toLowerCase().includes(search.toLowerCase()) || 
    c.conteudo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-5xl">
        
        {/* Widget de Encomendas Pendentes */}
        {encomendasPendentes && encomendasPendentes.length > 0 && (
          <div className="mb-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[2rem] p-6 sm:p-8 shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight leading-tight">Você tem encomenda(s) na Portaria!</h4>
                <p className="text-white/80 text-sm font-semibold mt-0.5">Há {encomendasPendentes.length} pacote(s) disponível(is) para retirada na guarita.</p>
              </div>
            </div>
            <Link 
              to={withTenantPrefix("/portal/encomendas", tenant?.slug)}
              className="bg-white hover:bg-slate-50 text-orange-600 rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-wider shadow-md gap-2 flex items-center transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              Ver Encomendas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">Mural de Comunicados</h1>
          <p className="text-slate-500 text-lg font-medium">Avisos, eventos e informações importantes do condomínio.</p>
          <div className="mt-6 inline-flex items-center px-6 py-2 rounded-full bg-[#C5D932]/20 text-[#1a2e25] text-xs font-black uppercase tracking-widest">
            {filtered?.length || 0} comunicados publicados
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título ou conteúdo..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800 cursor-pointer">
            <option>Todas as Categorias</option>
          </select>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-[#C5D932] border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Carregando...</p>
            </div>
          ) : filtered?.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center shadow-sm">
              <p className="text-slate-400 font-black text-2xl uppercase tracking-tight mb-2">Nenhum comunicado encontrado</p>
              <p className="text-slate-400 font-medium">Tente ajustar seus filtros de busca.</p>
            </div>
          ) : (
            filtered?.map((comunicado) => (
              <div key={comunicado.id} className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-sm hover:shadow-xl transition-all border-l-8 border-l-[#C5D932]">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 rounded-full bg-[#C5D932]/20 text-[#1a2e25] text-[10px] font-black uppercase tracking-[0.2em]">
                    {comunicado.tag || 'Aviso'}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    {new Date(comunicado.publicar_em || comunicado.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 leading-tight">{comunicado.titulo}</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-lg whitespace-pre-wrap">{comunicado.conteudo}</p>
                {comunicado.link_documento && (
                  <a
                    href={comunicado.link_documento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#1a2e25] hover:text-primary bg-slate-50 px-6 py-3 rounded-xl transition-colors"
                  >
                    Abrir documento anexo <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>© {new Date().getFullYear()} Condomínio Smart. Plataforma oficial de transparência para {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.</p>
        </div>
      </footer>
    </div>
  )
}
