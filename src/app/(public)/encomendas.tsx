import { useState } from "react"
import { PublicHeader } from "../../components/layout/PublicHeader"
import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  AlertCircle,
  HelpCircle,
  Building
} from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent } from "../../components/ui/dialog"
import { Skeleton } from "../../components/ui/skeleton"

export default function ResidentEncomendas() {
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const [activeTab, setActiveTab] = useState<'pendentes' | 'historico'>('pendentes')
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  // Busca as encomendas associadas a esta unidade/morador
  const { data: encomendas, isLoading } = useQuery({
    queryKey: ['morador-encomendas', tenant?.id, user?.id, perfil?.unidade, perfil?.bloco],
    queryFn: async () => {
      if (!tenant?.id) return []

      // Montamos a query básica
      let query = supabase
        .from('encomendas')
        .select('*')
        .eq('condominio_id', tenant.id)

      // Se tiver perfil com unidade definida, busca por morador_id OR (unidade AND bloco)
      if (perfil?.unidade) {
        if (perfil.bloco) {
          query = query.or(`morador_id.eq.${user?.id},and(unidade.eq.${perfil.unidade},bloco.eq.${perfil.bloco})`)
        } else {
          query = query.or(`morador_id.eq.${user?.id},and(unidade.eq.${perfil.unidade},bloco.is.null)`)
        }
      } else {
        // Fallback caso não tenha unidade configurada (improvável para aprovados)
        query = query.eq('morador_id', user?.id)
      }

      const { data, error } = await query.order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id && !!user?.id,
  })

  // Separação em abas
  const activePackages = encomendas?.filter(e => e.status === 'pendente') || []
  const historyPackages = encomendas?.filter(e => e.status === 'entregue') || []
  
  const currentList = activeTab === 'pendentes' ? activePackages : historyPackages

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 antialiased">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl">
        
        {/* Banner do Cabeçalho */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-[#C5D932]/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Package className="h-10 w-10 text-[#1a2e25]" />
          </div>
          <h1 className="text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">Suas Encomendas</h1>
          <p className="text-slate-500 text-lg font-medium">Acompanhe as encomendas recebidas pela portaria do condomínio.</p>
          
          {perfil?.unidade && (
            <div className="inline-flex items-center gap-1.5 bg-[#1a2e25]/5 border border-[#1a2e25]/10 px-4 py-1.5 rounded-full text-xs font-black text-[#1a2e25] mt-4">
              <Building className="w-3.5 h-3.5" />
              Unidade {perfil.unidade} {perfil.bloco ? `• Bloco ${perfil.bloco}` : ''}
            </div>
          )}
        </div>

        {/* Tab Selector & Conteúdo */}
        <div className="space-y-6">
          
          {/* Alternador de Abas de Alta Performance */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'pendentes' 
                  ? 'bg-[#1a2e25] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              A retirar ({activePackages.length})
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === 'historico' 
                  ? 'bg-[#1a2e25] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Histórico ({historyPackages.length})
            </button>
          </div>

          {/* Lista de Encomendas do Morador */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-slate-200/50" />
              ))
            ) : currentList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center">
                <Package className="w-12 h-12 text-slate-200 mb-3" />
                <h3 className="text-lg font-black text-slate-700">Tudo limpo por aqui!</h3>
                <p className="text-slate-400 font-medium text-sm max-w-xs mt-1">
                  {activeTab === 'pendentes' 
                    ? "Você não tem nenhuma encomenda pendente de retirada na portaria neste momento." 
                    : "Você não possui histórico de encomendas registradas no sistema."}
                </p>
              </div>
            ) : (
              currentList.map((enc) => (
                <Card 
                  key={enc.id} 
                  className={`border-none rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white ${
                    enc.status === 'pendente' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500'
                  }`}
                >
                  <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="flex items-start gap-6">
                      
                      {/* Thumbnail da Foto anexada pelo porteiro */}
                      {enc.foto_url ? (
                        <div 
                          onClick={() => setZoomPhoto(enc.foto_url)}
                          className="w-20 h-20 rounded-[1.25rem] bg-slate-100 border border-slate-100 overflow-hidden cursor-pointer hover:opacity-90 relative group shadow-sm shrink-0"
                        >
                          <img src={enc.foto_url} alt="Foto do Pacote" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner shrink-0">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      {/* Informações detalhadas */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {enc.status === 'pendente' ? (
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-none rounded-lg text-[9px] uppercase tracking-wider font-extrabold px-2 h-5">
                              Aguardando Retirada
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white border-none rounded-lg text-[9px] uppercase tracking-wider font-extrabold px-2 h-5">
                              Entregue
                            </Badge>
                          )}
                          {enc.codigo_rastreio && (
                            <Badge variant="outline" className="text-slate-400 border-slate-200 rounded-lg text-[10px] font-bold px-2 h-5">
                              Rastreio: {enc.codigo_rastreio}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 leading-tight mt-1">
                          {enc.descricao || "Encomenda Registrada"}
                        </h3>
                        
                        {/* Status detalhado de Entrada / Saída */}
                        <div className="flex flex-col gap-1 text-slate-400 font-bold text-xs mt-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>Recebido na portaria em {new Date(enc.data_recebimento).toLocaleDateString('pt-BR')} às {new Date(enc.data_recebimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          {enc.status === 'entregue' && enc.data_retirada && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50/50 p-2 rounded-xl mt-2 self-start border border-green-100/50">
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              <span>Retirado por {enc.retirado_por_nome} em {new Date(enc.data_retirada).toLocaleDateString('pt-BR')} às {new Date(enc.data_retirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Alerta de Retirada Pendente no Lado Direito */}
                    {enc.status === 'pendente' && (
                      <div className="bg-amber-50 border border-amber-200/50 px-4 py-3 rounded-2xl flex items-center gap-3 max-w-[240px] self-start md:self-center">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
                        <span className="text-[11px] font-bold text-amber-800 leading-snug">
                          Disponível para retirada na Guarita de Portaria do condomínio.
                        </span>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Dicas e FAQs de Retirada */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#C5D932]/10 rounded-xl flex items-center justify-center text-[#1a2e25]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Instruções para Retirada</h3>
            </div>
            
            <ul className="space-y-3 text-slate-500 font-medium text-sm leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#1a2e25] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
                <span>Dirija-se à portaria do condomínio e informe o seu nome ou o número da sua unidade/apartamento.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#1a2e25] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
                <span>O porteiro confirmará o recebimento do pacote em nosso sistema e solicitará a sua confirmação física de recebimento.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[#1a2e25] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
                <span>Assim que o porteiro registrar a baixa, o status desta página mudará automaticamente para "Entregue" em tempo real.</span>
              </li>
            </ul>
          </div>

        </div>
      </main>

      {/* Footer Premium */}
      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>© {new Date().getFullYear()} Condomínio Smart. Plataforma oficial de transparência para {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.</p>
        </div>
      </footer>

      {/* Zoom Dialog para fotos do pacote */}
      <Dialog open={!!zoomPhoto} onOpenChange={(val) => { if (!val) setZoomPhoto(null) }}>
        <DialogContent className="max-w-[480px] rounded-3xl p-2 bg-black border-none overflow-hidden">
          <div className="relative w-full h-[70vh] flex items-center justify-center">
            {zoomPhoto && (
              <img src={zoomPhoto} alt="Zoom Pacote" className="w-full h-full object-contain rounded-2xl" />
            )}
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow z-50 border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
