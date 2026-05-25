import { useState } from "react"
import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { MessageCircle, Globe, ShoppingBag, Gift, Star, Filter, Info, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Skeleton } from "../../components/ui/skeleton"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"

export default function PublicClube() {
  const { tenant } = useTenantStore()
  const [activeFilter, setActiveFilter] = useState("todos")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null)

  const { data: anunciantes, isLoading } = useQuery({
    queryKey: ['parceiros_publicos', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clube_parceiros')
        .select('*')
        .or(`condominio_id.eq.${tenant?.id},condominio_id.is.null`)
        .eq('ativo', true)
        .eq('status', 'aprovado')
        .order('destaque', { ascending: false })
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })])

  const premiumPartners = anunciantes?.filter(p => p.selo === 'premium' && p.banner_premium_url) || []

  const filteredAnunciantes = anunciantes?.filter(item => {
    if (activeFilter === "todos") return true
    if (activeFilter === "parceiros") return item.tipo_anunciante === "parceiro_oficial"
    if (activeFilter === "moradores") return item.tipo_anunciante === "morador"
    if (activeFilter === "servicos") return item.tipo_oferta === "servico"
    if (activeFilter === "produtos") return item.tipo_oferta === "produto"
    return true
  })

  const formatWhatsAppLink = (link: string | null) => {
    if (!link) return "#"
    if (link.includes("wa.me") || link.includes("whatsapp")) return link
    const numbersOnly = link.replace(/\D/g, '')
    if (numbersOnly.length >= 10) return `https://wa.me/${numbersOnly}`
    return link
  }

  const openDetails = (partner: any) => {
    setSelectedPartner(partner)
    setDetailsOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-4 py-1.5 rounded-full mb-4 uppercase tracking-[0.2em]">
            Clube de Vantagens
          </Badge>
          <h1 className="text-5xl font-black text-[#1a2e25] mb-6 uppercase tracking-tight">Vantagens</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Ofertas exclusivas, parceiros selecionados e negócios de moradores do <span className="text-[#1a2e25] font-black">{tenant?.nome || "condomínio"}</span>.
          </p>
        </div>

        {/* Carrossel Premium Público */}
        {premiumPartners.length > 0 && (
          <div className="relative w-full mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100/50" ref={emblaRef}>
              <div className="flex">
                {premiumPartners.map((partner) => (
                  <div key={partner.id} className="flex-[0_0_100%] min-w-0 relative group cursor-pointer" onClick={() => partner.link_site && window.open(partner.link_site, '_blank')}>
                    <div className="aspect-[3/1] md:aspect-[4/1] relative w-full overflow-hidden bg-slate-100">
                      <img 
                        src={partner.banner_premium_url || partner.imagem_banner_url || partner.logo_url} 
                        alt={partner.nome} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e25]/80 via-[#1a2e25]/20 to-transparent pointer-events-none" />
                      
                      <div className="absolute bottom-8 left-10 right-10 z-20 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#C5D932] text-[#1a2e25] border-none font-black text-xs px-4 py-1.5 uppercase tracking-[0.2em] shadow-lg rounded-full">
                            Premium <Star className="w-3 h-3 ml-1.5 inline-block" />
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {premiumPartners.length > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 backdrop-blur hover:bg-white hover:scale-110 transition-all border-none shadow-xl z-10"
                  onClick={() => emblaApi?.scrollPrev()}
                >
                  <ChevronLeft className="w-6 h-6 text-[#1a2e25]" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 backdrop-blur hover:bg-white hover:scale-110 transition-all border-none shadow-xl z-10"
                  onClick={() => emblaApi?.scrollNext()}
                >
                  <ChevronRight className="w-6 h-6 text-[#1a2e25]" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
          {[
            { id: "todos", label: "Todos", icon: Filter },
            { id: "parceiros", label: "Parceiros", icon: ShieldCheck },
            { id: "moradores", label: "Moradores", icon: ShoppingBag },
            { id: "servicos", label: "Serviços", icon: Info },
            { id: "produtos", label: "Produtos", icon: Star },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-6 h-11 font-bold transition-all ${
                activeFilter === filter.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                : "bg-white border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
              }`}
            >
              <filter.icon className={`w-4 h-4 mr-2 ${activeFilter === filter.id ? "text-white" : "text-slate-400"}`} />
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[500px] rounded-[3rem]" />
            ))
          ) : filteredAnunciantes?.length === 0 ? (
            <div className="col-span-full text-center p-20 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
              <Gift className="mx-auto h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-black text-slate-800">Nenhum anúncio encontrado</h3>
              <p className="text-slate-500 font-medium mt-2">Tente mudar o filtro ou volte mais tarde.</p>
            </div>
          ) : (
            filteredAnunciantes?.map((item) => (
              <div key={item.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-2xl transition-all hover:-translate-y-2 group relative">
                <div className="h-64 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {item.imagem_banner_url || item.logo_url ? (
                    <img src={item.imagem_banner_url || item.logo_url} alt={item.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10" />
                  ) : (
                    <span className="text-slate-200 font-black text-4xl uppercase tracking-widest relative z-10">{item.nome.substring(0,2)}</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-10 pointer-events-none" />
                  
                  <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                    <Badge className={`border-none font-black text-[10px] uppercase tracking-widest shadow-xl px-4 py-2 rounded-full ${
                      item.selo === 'morador_empreendedor' ? 'bg-amber-400 text-[#1a2e25]' : 'bg-[#C5D932] text-[#1a2e25]'
                    }`}>
                      {item.selo === 'morador_empreendedor' ? 'MORADOR EMPREENDEDOR' : 'PARCEIRO OFICIAL'}
                    </Badge>
                  </div>

                  {item.destaque && (
                    <div className="absolute bottom-6 right-6 z-20">
                      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-white/20">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                    {item.categoria || item.desconto_info}
                  </span>
                  <h3 className="text-3xl font-black text-[#1a2e25] mb-2 leading-tight group-hover:text-primary transition-colors">
                    {item.nome}
                  </h3>

                  {item.tipo_oferta === 'produto' && item.preco && (
                    <div className="mb-4">
                      <span className="text-2xl font-black text-[#1a2e25]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}
                      </span>
                    </div>
                  )}
                  
                  {item.selo === 'morador_empreendedor' && (
                    <p className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Oferta publicada por morador verificado
                    </p>
                  )}

                  <p className="text-slate-500 font-medium text-base mb-10 flex-1 leading-relaxed line-clamp-3">
                    {item.descricao}
                  </p>

                  {item.descricao && item.descricao.length > 120 && (
                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      className="mb-6 text-left text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                    >
                      Ler todos os detalhes
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <Button className="bg-[#1a2e25] text-white hover:opacity-90 font-black py-7 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-slate-200" asChild>
                      <a href={formatWhatsAppLink(item.whatapp_parceiro)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[9px] uppercase tracking-widest">Enviar Whats</span>
                      </a>
                    </Button>
                    <Button variant="outline" className="border-slate-200 text-[#1a2e25] hover:bg-slate-50 font-black py-7 rounded-2xl flex flex-col items-center justify-center gap-1" asChild>
                      <a href={item.link_site || "#"} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-5 h-5" />
                        <span className="text-[9px] uppercase tracking-widest">Abrir site</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Disclaimer Legal */}
        <div className="mt-20 p-8 rounded-[2rem] bg-slate-100 border border-slate-200/50 max-w-4xl mx-auto">
          <div className="flex flex-col gap-4 text-slate-500 text-xs font-medium leading-relaxed">
            <p className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              As ofertas são divulgadas por parceiros e moradores cadastrados. A contratação, pagamento e execução dos serviços são de responsabilidade direta entre anunciante e interessado.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              Morador verificado significa que o anunciante possui cadastro aprovado no condomínio. Isso não representa garantia comercial, técnica ou financeira sobre o produto ou serviço anunciado.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>
            © {new Date().getFullYear()} Condomínio Smart. Vitrine interna de ofertas para moradores do {tenant?.nome}. Desenvolvido por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.
          </p>
        </div>
      </footer>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open)
          if (!open) setSelectedPartner(null)
        }}
      >
        <DialogContent className="sm:max-w-[620px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase tracking-widest text-slate-800">
              {selectedPartner?.nome || "Detalhes da oferta"}
            </DialogTitle>
          </DialogHeader>

          {selectedPartner && (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                    {selectedPartner.categoria || selectedPartner.desconto_info || "Vantagem"}
                  </div>
                  <div className="mt-1 text-2xl font-black text-[#1a2e25] leading-tight">
                    {selectedPartner.nome}
                  </div>
                  {selectedPartner.tipo_oferta === "produto" && selectedPartner.preco && (
                    <div className="mt-2 text-lg font-black text-[#1a2e25]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPartner.preco)}
                    </div>
                  )}
                </div>

                {selectedPartner.logo_url && (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                    <img src={selectedPartner.logo_url} alt={selectedPartner.nome} className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap max-h-[45vh] overflow-auto">
                {selectedPartner.descricao || "Sem detalhes adicionais."}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button className="rounded-2xl h-12 bg-[#1a2e25] text-white hover:opacity-90 font-black" asChild>
                  <a href={formatWhatsAppLink(selectedPartner.whatapp_parceiro)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Enviar Whats
                  </a>
                </Button>
                <Button variant="outline" className="rounded-2xl h-12 border-slate-200 font-black" asChild>
                  <a href={selectedPartner.link_site || "#"} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" /> Abrir site
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
