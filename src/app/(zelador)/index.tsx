import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { supabase } from "../../lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "../../components/ui/card"
import { 
  CheckCircle2, 
  ChevronRight,
  MapPin,
  Calendar as CalendarIcon
} from "lucide-react"
import { Skeleton } from "../../components/ui/skeleton"
import { Badge } from "../../components/ui/badge"
import { withTenantPrefix, cn } from "../../lib/utils"
import { Link } from "react-router"

export default function ZeladorDashboard() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  
  // 1. Busca ordens atribuídas ao zelador
  const { data: ordens, isLoading } = useQuery({
    queryKey: ['zelador-ordens', perfil?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('responsavel_id', perfil?.id)
        .eq('ativo', true)
        .order('prioridade', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!perfil?.id,
  })

  const stats = {
    hoje: ordens?.filter(o => {
      if (!o.data_agendada) return false
      const d = new Date(o.data_agendada)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }).length || 0,
    pendentes: ordens?.filter(o => o.status === 'pendente' || o.status === 'agendado').length || 0,
    em_andamento: ordens?.filter(o => o.status === 'em_andamento').length || 0,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
      case 'em_andamento': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Curso</Badge>
      case 'concluido': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>
      case 'agendado': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Agendado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-lg mx-auto pb-24">
      {/* Header Mobile-first */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Olá, {perfil?.nome?.split(' ')[0]}!</h1>
        <p className="text-slate-500 font-medium text-sm">Você tem {stats.pendentes} serviços pendentes hoje.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-slate-800">{stats.hoje}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Hoje</span>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-blue-600">{stats.em_andamento}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Em Curso</span>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-amber-600">{stats.pendentes}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fila</span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Meus Serviços</h2>
        
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))
        ) : ordens?.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-green-200" />
            <p className="text-slate-500 font-bold">Tudo em dia! Nenhuma ordem atribuída.</p>
          </div>
        ) : (
          ordens?.map((ordem) => (
            <Link 
              key={ordem.id} 
              to={withTenantPrefix(`/painel/servicos/${ordem.id}`, tenant?.slug)}
              className="block"
            >
              <Card className={cn(
                "border-none shadow-sm bg-white rounded-3xl overflow-hidden active:scale-95 transition-transform",
                ordem.prioridade === 'urgente' ? "border-l-4 border-l-red-500" : 
                ordem.prioridade === 'alta' ? "border-l-4 border-l-orange-500" : ""
              )}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ordem.status)}
                        {ordem.prioridade === 'urgente' && <Badge className="bg-red-500 text-white text-[10px] h-5">Urgente</Badge>}
                      </div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight mt-1">{ordem.titulo}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 mt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{ordem.local_descricao}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {ordem.data_agendada ? new Date(ordem.data_agendada).toLocaleDateString('pt-BR') : "Hoje"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
