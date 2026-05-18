import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"
import { Link } from "react-router"
import { 
  FileText, 
  Link as LinkIcon, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2,
  ChevronRight,
  Info
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"

const categoriasOptions = [
  { value: "contatos", label: "Contatos e Administração", color: "bg-blue-50 text-blue-700" },
  { value: "servicos_essenciais", label: "Serviços Essenciais", color: "bg-emerald-50 text-emerald-700" },
  { value: "mudanca", label: "Regras de Mudança", color: "bg-amber-50 text-amber-700" },
  { value: "acessos", label: "Acessos e Portaria", color: "bg-purple-50 text-purple-700" },
  { value: "coleta_descarte", label: "Coleta e Descarte de Lixo", color: "bg-green-50 text-green-700" },
  { value: "seguranca", label: "Segurança", color: "bg-red-50 text-red-700" },
  { value: "app_oficial", label: "Aplicativo Oficial", color: "bg-indigo-50 text-indigo-700" },
  { value: "administradora", label: "Administradora", color: "bg-slate-100 text-slate-700" },
  { value: "regras_rapidas", label: "Regras Rápidas", color: "bg-orange-50 text-orange-700" },
  { value: "links_uteis", label: "Links Úteis", color: "bg-teal-50 text-teal-700" },
  { value: "outros", label: "Outros Assuntos", color: "bg-gray-100 text-gray-700" },
]

export default function PublicGuiaMorador() {
  const { tenant } = useTenantStore()
  const tenantSlug = tenant?.slug

  const { data: itens, isLoading } = useQuery({
    queryKey: ['guia_morador_itens_public', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guia_morador_itens')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // Agrupar itens por categoria
  const groupedItens = itens?.reduce((acc: any, item: any) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = []
    }
    acc[item.categoria].push(item)
    return acc
  }, {})

  // Ordernar categorias com base na ordem de `categoriasOptions`
  const sortedCategorias = Object.keys(groupedItens || {}).sort((a, b) => {
    const indexA = categoriasOptions.findIndex(c => c.value === a)
    const indexB = categoriasOptions.findIndex(c => c.value === b)
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
  })

  const getAcaoIcon = (tipo: string) => {
    switch(tipo) {
      case 'link': return <LinkIcon className="w-4 h-4" />
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />
      case 'telefone': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'endereco': return <MapPin className="w-4 h-4" />
      default: return null
    }
  }

  const handleAction = (item: any) => {
    if (item.tipo_acao === 'link' && item.url) window.open(item.url, '_blank')
    if (item.tipo_acao === 'whatsapp' && item.whatsapp) {
      const wpp = item.whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/${wpp}`, '_blank')
    }
    if (item.tipo_acao === 'telefone' && item.telefone) window.location.href = `tel:${item.telefone}`
    if (item.tipo_acao === 'email' && item.email) window.location.href = `mailto:${item.email}`
    if (item.tipo_acao === 'endereco' && item.endereco) window.open(`https://maps.google.com/?q=${encodeURIComponent(item.endereco)}`, '_blank')
  }

  const getCategoriaLabel = (val: string) => categoriasOptions.find(c => c.value === val)?.label || val

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-[#C5D932]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
            <FileText className="h-10 w-10 text-[#1a2e25]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">
            Guia do Morador
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Contatos, serviços essenciais e orientações rápidas para o seu dia a dia no {tenant?.nome}.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#C5D932]" />
          </div>
        ) : !itens || itens.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium text-lg">Nenhum item adicionado ao guia ainda.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedCategorias.map(categoria => (
              <section key={categoria} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <h2 className="text-2xl font-black text-[#1a2e25] uppercase tracking-tight">
                    {getCategoriaLabel(categoria)}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1 ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedItens[categoria].map((item: any) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group relative overflow-hidden"
                    >
                      {item.destaque && (
                        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-[2rem]">
                          <div className="bg-[#C5D932] text-[#1a2e25] text-[10px] font-black uppercase tracking-widest py-1 px-8 shadow-sm transform rotate-45 translate-x-[18px] translate-y-[10px] text-center">
                            Destaque
                          </div>
                        </div>
                      )}

                      <h3 className="text-xl font-black text-[#1a2e25] mb-4 pr-6 leading-tight">
                        {item.titulo}
                      </h3>
                      
                      {item.descricao && (
                        <p className="text-slate-500 text-sm font-medium mb-6 flex-1 whitespace-pre-wrap leading-relaxed">
                          {item.descricao}
                        </p>
                      )}

                      <div className="mt-auto space-y-4">
                        {item.tipo_acao !== 'nenhum' && (
                          <Button 
                            className="w-full bg-[#1a2e25] text-white hover:bg-[#1a2e25]/90 rounded-2xl font-bold py-6 group-hover:shadow-lg transition-all"
                            onClick={() => handleAction(item)}
                          >
                            {getAcaoIcon(item.tipo_acao)}
                            <span className="ml-2">{item.texto_botao || "Acessar"}</span>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                          </Button>
                        )}

                        {item.observacao && (
                          <div className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800 leading-tight">
                              {item.observacao}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-24 text-center">
          <p className="text-sm font-medium text-slate-500 mb-4">
            Não encontrou o que procurava?
          </p>
          <Button variant="outline" className="border-slate-200 text-[#1a2e25] hover:bg-slate-50 rounded-2xl font-black uppercase tracking-widest px-8" asChild>
            <Link to={withTenantPrefix("/portal/faq", tenantSlug)}>
              Consulte nosso FAQ
            </Link>
          </Button>
        </div>
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-12 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>
            © {new Date().getFullYear()} Condomínio Smart. Portal de informações para moradores do {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}