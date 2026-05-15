import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { PlusCircle, Trash2, Gift, Pencil, Star, Info, ShieldCheck, ShoppingBag, Camera, MessageCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"
import { Badge } from "../../../components/ui/badge"
import { ParceiroFormModal } from "./ParceiroFormModal"

export default function ClubeVantagens() {
  const { user, perfil } = useAuthStore()
  const { tenant, isMasterMode } = useTenantStore()
  const queryClient = useQueryClient()

  const [activeFilter, setActiveFilter] = useState("todos")
  const [openModal, setOpenModal] = useState(false)
  const [parceiroToEdit, setParceiroToEdit] = useState<any | null>(null)

  // Permissão para exibir o botão (Síndico, MasterMode ou Dono)
  const isSuperAdmin = perfil?.role === 'super_admin' || 
                       user?.app_metadata?.role === 'super_admin' ||
                       isMasterMode || 
                       user?.email === 'propagoumkd@gmail.com'

  const canAddPartner = isSuperAdmin || 
                        perfil?.role === 'sindico' || 
                        user?.app_metadata?.role === 'sindico' ||
                        perfil?.role === 'subsindico' ||
                        user?.app_metadata?.role === 'subsindico' ||
                        perfil?.role === 'morador' // Permitir morador cadastrar? Doc diz que o sindico aprova.

  const { data: parceiros, isLoading } = useQuery({
    queryKey: ['parceiros', tenant?.id, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('clube_parceiros')
        .select('*')
        .or(`condominio_id.eq.${tenant?.id},condominio_id.is.null`)
        .eq('ativo', true)
        
      if (!isSuperAdmin) {
        query = query.eq('status', 'aprovado')
      }
      
      const { data, error } = await query
        .order('destaque', { ascending: false })
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })])

  const premiumPartners = parceiros?.filter(p => p.selo === 'premium' && p.banner_premium_url) || []

  const filteredParceiros = parceiros?.filter(item => {
    if (activeFilter === "todos") return true
    if (activeFilter === "parceiros") return item.tipo_anunciante === "parceiro_oficial"
    if (activeFilter === "moradores") return item.tipo_anunciante === "morador"
    if (activeFilter === "servicos") return item.tipo_oferta === "servico"
    if (activeFilter === "produtos") return item.tipo_oferta === "produto"
    return true
  })

  const handleEditClick = (parceiro: any) => {
    setParceiroToEdit(parceiro)
    setOpenModal(true)
  }

  const deleteParceiro = useMutation({
    mutationFn: async (id: string) => {
      // Opcional: Deletar a imagem do storage se for uma URL do nosso bucket
      const { error } = await supabase.from('clube_parceiros').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Parceiro removido.")
      queryClient.invalidateQueries({ queryKey: ['parceiros'] })
    }
  })

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Clube de Vantagens</h1>
          <p className="text-slate-500 font-medium mt-1">Benefícios e descontos exclusivos para moradores do {tenant?.nome}.</p>
        </div>

        {canAddPartner && (
          <>
            <Button 
              onClick={() => {
                setParceiroToEdit(null)
                setOpenModal(true)
              }} 
              className="bg-primary hover:opacity-90 text-white rounded-xl px-6 gap-2 shadow-lg shadow-primary/20"
            >
              <PlusCircle className="h-4 w-4" />
              Cadastrar Parceiro
            </Button>
            <ParceiroFormModal
              open={openModal}
              onOpenChange={setOpenModal}
              parceiroToEdit={parceiroToEdit}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['parceiros'] })}
            />
          </>
        )}
      </div>

      {/* Carrossel Premium */}
      {premiumPartners.length > 0 && (
        <div className="relative w-full mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="overflow-hidden rounded-[32px] shadow-xl border border-slate-100/50" ref={emblaRef}>
            <div className="flex">
              {premiumPartners.map((partner) => (
                <div key={partner.id} className="flex-[0_0_100%] min-w-0 relative group cursor-pointer" onClick={() => partner.link_site && window.open(partner.link_site, '_blank')}>
                  <div className="aspect-[3/1] md:aspect-[4/1] relative w-full overflow-hidden bg-slate-100">
                    <img 
                      src={partner.banner_premium_url || partner.imagem_banner_url || partner.logo_url} 
                      alt={partner.nome} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute bottom-6 left-8 right-8 z-20 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-400 text-amber-950 border-none font-black text-xs px-3 py-1 uppercase tracking-widest shadow-sm">
                          Premium <Star className="w-3 h-3 ml-1 inline-block" />
                        </Badge>
                      </div>
                    </div>

                    {(canAddPartner && (partner.condominio_id === tenant?.id || isSuperAdmin)) && (
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-30 flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl shadow-lg bg-white/90 hover:bg-white"
                            onClick={(e) => {
                               e.stopPropagation()
                               handleEditClick(partner)
                            }}
                          >
                             <Pencil className="h-4 w-4 text-slate-700" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl shadow-lg"
                            onClick={(e) => {
                               e.stopPropagation()
                               if(confirm("Remover este anúncio?")) deleteParceiro.mutate(partner.id)
                            }}
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    )}
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
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur hover:bg-white border-none shadow-lg z-10"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur hover:bg-white border-none shadow-lg z-10"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Filtros Administrativos */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
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
            className={`rounded-full px-4 h-9 text-xs font-bold transition-all ${
              activeFilter === filter.id 
              ? "bg-primary text-white shadow-md shadow-primary/10" 
              : "bg-white border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
            }`}
          >
            <filter.icon className={`w-3.5 h-3.4 mr-1.5 ${activeFilter === filter.id ? "text-white" : "text-slate-400"}`} />
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[450px] rounded-[40px]" />
          ))
        ) : filteredParceiros?.length === 0 ? (
          <div className="col-span-full text-center p-20 bg-white border-2 border-dashed border-slate-100 rounded-[40px]">
            <Gift className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Nenhum anúncio encontrado</h3>
            <p className="text-slate-500 font-medium mt-2">Tente mudar o filtro ou cadastre um novo parceiro.</p>
          </div>
        ) : (
          filteredParceiros?.map((parceiro) => (
            <Card key={parceiro.id} className="relative flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 group rounded-[40px] border-none shadow-sm bg-white">
              <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                {parceiro.imagem_banner_url || parceiro.logo_url ? (
                   <img src={parceiro.imagem_banner_url || parceiro.logo_url} alt={parceiro.nome} className="w-full h-full object-cover relative z-10" />
                ) : (
                   <span className="text-slate-200 font-black text-4xl uppercase tracking-widest relative z-10">{parceiro.nome.substring(0,2)}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-10 pointer-events-none" />
                
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                  <Badge className={`border-none font-black text-[10px] uppercase tracking-widest shadow-sm ${
                    parceiro.selo === 'morador_empreendedor' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {parceiro.selo === 'morador_empreendedor' ? 'Morador Empreendedor' : 'Parceiro Oficial'}
                  </Badge>
                  {parceiro.condominio_id === null && (
                    <Badge className="bg-purple-100 text-purple-700 border-none font-black text-[10px] uppercase tracking-widest shadow-sm w-fit">
                      Global
                    </Badge>
                  )}
                </div>

                {parceiro.destaque && (
                  <div className="absolute bottom-4 right-4 z-20">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                )}
                
                {(canAddPartner && (parceiro.condominio_id === tenant?.id || isSuperAdmin)) && (
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl shadow-lg bg-white/90 hover:bg-white"
                        onClick={(e) => {
                           e.stopPropagation()
                           handleEditClick(parceiro)
                        }}
                      >
                         <Pencil className="h-4 w-4 text-slate-700" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl shadow-lg"
                        onClick={(e) => {
                           e.stopPropagation()
                           if(confirm("Remover este anúncio?")) deleteParceiro.mutate(parceiro.id)
                        }}
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                )}
              </div>

              <CardHeader className="pt-6 pb-2 px-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    {parceiro.categoria || parceiro.desconto_info}
                  </span>
                  <CardTitle className="text-2xl font-black text-slate-800 leading-tight">
                    {parceiro.nome}
                  </CardTitle>
                  {parceiro.selo === 'morador_empreendedor' && (
                    <p className="text-[11px] font-bold text-slate-400 italic">
                      Oferta publicada por morador verificado
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 py-4 px-8 text-sm text-slate-500 font-medium">
                <p className="line-clamp-2 leading-relaxed">{parceiro.descricao}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {parceiro.whatapp_parceiro && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <MessageCircle className="w-3 h-3" /> WhatsApp Ativo
                    </div>
                  )}
                  {parceiro.instagram_url && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-lg">
                      <Camera className="w-3 h-3" /> Instagram
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-8 px-8 flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50" asChild>
                  <a href={parceiro.link_site || "#"} target="_blank" rel="noopener noreferrer">
                    Ver Oferta
                  </a>
                </Button>
                {parceiro.whatapp_parceiro && (
                  <Button className="h-12 w-12 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex items-center justify-center p-0 shadow-lg shadow-green-200" asChild title="Falar no WhatsApp">
                    <a href={`https://wa.me/${parceiro.whatapp_parceiro.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
