import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react"
import { useState } from "react"
import { Button } from "../../components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { Skeleton } from "../../components/ui/skeleton"
import { format, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "../../components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card"

export default function PublicEventos() {
  const { tenant } = useTenantStore()
  const [tab, setTab] = useState<"proximos" | "anteriores">("proximos")

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['eventos_public', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('data_evento', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const today = startOfDay(new Date())
  
  const proximosEventos = eventos?.filter(e => !isBefore(new Date(e.data_evento), today)) || []
  const eventosAnteriores = eventos?.filter(e => isBefore(new Date(e.data_evento), today))?.reverse() || []

  const eventosExibidos = tab === "proximos" ? proximosEventos : eventosAnteriores

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">Calendário de Eventos</h1>
          <p className="text-slate-500 text-lg font-medium">Fique por dentro das atividades e confraternizações do {tenant?.nome}.</p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <Button 
            variant={tab === "proximos" ? "default" : "secondary"}
            onClick={() => setTab("proximos")}
            className={tab === "proximos" ? "bg-[#1a2e25] text-white font-black py-8 px-10 rounded-2xl text-lg" : "py-8 px-10 font-black rounded-2xl text-lg text-slate-400 bg-white border border-slate-100"}
          >
            Próximos Eventos
          </Button>
          <Button 
            variant={tab === "anteriores" ? "default" : "secondary"}
            onClick={() => setTab("anteriores")}
            className={tab === "anteriores" ? "bg-[#1a2e25] text-white font-black py-8 px-10 rounded-2xl text-lg" : "py-8 px-10 font-black rounded-2xl text-lg text-slate-400 bg-white border border-slate-100"}
          >
            Eventos Anteriores
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
          </div>
        ) : eventosExibidos.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <CalendarIcon className="h-12 w-12 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black text-2xl uppercase tracking-tight">Nenhum evento encontrado</p>
            <p className="text-slate-400 font-medium text-lg mt-2">
              {tab === "proximos" ? "Fique atento aos novos avisos e agendamentos." : "Nenhum evento passado registrado."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {eventosExibidos.map((evento) => (
              <Card key={evento.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white rounded-3xl">
                <div className="h-2 w-full bg-[#C5D932] group-hover:bg-[#b3c62d] transition-colors" />
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-[#1a2e25]/5 text-[#1a2e25] p-2 rounded-xl group-hover:bg-[#1a2e25] group-hover:text-white transition-colors">
                         <CalendarIcon className="h-5 w-5" />
                      </div>
                      <Badge className="bg-slate-50 text-slate-500 border-none font-bold">
                         {format(new Date(evento.data_evento), "dd 'de' MMM", { locale: ptBR })}
                      </Badge>
                   </div>
                   <CardTitle className="text-xl font-black text-slate-800 line-clamp-2">{evento.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm text-slate-500 line-clamp-3 font-medium">{evento.descricao || "Sem descrição detalhada."}</p>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                         <Clock className="h-3.5 w-3.5 text-[#C5D932]" />
                         <span>{evento.horario_inicio ? evento.horario_inicio.substring(0,5) : "A definir"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                         <MapPin className="h-3.5 w-3.5 text-[#C5D932]" />
                         <span className="line-clamp-1">{evento.local || "A definir"}</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>© {new Date().getFullYear()} Condomínio Smart. Plataforma oficial de transparência para {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.</p>
        </div>
      </footer>
    </div>
  )
}
