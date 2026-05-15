import { useState } from "react"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "../../../components/ui/card"
import { 
  Calendar as CalendarIcon, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Tag,
  User
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { withTenantPrefix, cn } from "../../../lib/utils"
import { Link } from "react-router"
import { Badge } from "../../../components/ui/badge"

export default function AgendaServicos() {
  const { tenant } = useTenantStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Busca ordens agendadas
  const { data: ordens, isLoading } = useQuery({
    queryKey: ['agenda-servicos', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          responsavel:perfis!ordens_servico_responsavel_id_fkey(nome)
        `)
        .eq('condominio_id', tenant?.id)
        .is('ativo', true)
        .not('data_agendada', 'is', null)

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link to={withTenantPrefix("/painel/servicos", tenant?.slug)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agenda de Serviços</h1>
            <p className="text-slate-500 font-medium text-sm">Visualize e planeje as manutenções agendadas.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-black text-slate-700 px-4 min-w-[140px] text-center uppercase tracking-widest">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
         {/* Placeholder para Calendário real ou Lista Agrupada */}
         <div className="space-y-8">
            {isLoading ? (
              <div className="p-12 text-center animate-pulse text-slate-400">Carregando agenda...</div>
            ) : (ordens || []).length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] text-center flex flex-col items-center gap-4 shadow-sm border border-slate-50">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Sem agendamentos</h3>
                <p className="text-slate-500 font-medium max-w-xs">Não há serviços agendados para este período.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {[...(ordens || [])].sort((a,b) => new Date(a.data_agendada).getTime() - new Date(b.data_agendada).getTime()).map(ordem => (
                  <Link key={ordem.id} to={withTenantPrefix(`/painel/servicos/${ordem.id}`, tenant?.slug)}>
                    <Card className="border-none shadow-sm bg-white rounded-3xl hover:shadow-md transition-all overflow-hidden border-l-4 border-l-primary/20">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl min-w-[100px]">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dia</span>
                            <span className="text-2xl font-black text-slate-800 leading-none">
                              {new Date(ordem.data_agendada).getDate()}
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter mt-1">
                              {new Date(ordem.data_agendada).toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </span>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] uppercase font-black tracking-widest">{ordem.status}</Badge>
                              <Badge className={cn(
                                "border-none text-[10px] uppercase font-black tracking-widest",
                                ordem.prioridade === 'urgente' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500"
                              )}>{ordem.prioridade}</Badge>
                            </div>
                            <h3 className="text-lg font-black text-slate-800">{ordem.titulo}</h3>
                            <div className="flex flex-wrap gap-4 text-slate-500">
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <MapPin className="w-3.5 h-3.5" /> {ordem.local_descricao}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <Tag className="w-3.5 h-3.5" /> {ordem.categoria}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <User className="w-3.5 h-3.5" /> {ordem.responsavel?.nome || "Não atribuído"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-1">
                             <div className="flex items-center gap-2 text-slate-400">
                               <Clock className="w-4 h-4" />
                               <span className="text-sm font-black">Previsão: {ordem.tempo_estimado_minutos || "--"} min</span>
                             </div>
                             <div className="text-xs font-bold text-slate-300">#{ordem.id.substring(0,8)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
         </div>
      </div>
    </div>
  )
}
