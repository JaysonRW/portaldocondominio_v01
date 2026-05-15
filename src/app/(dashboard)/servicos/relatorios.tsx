import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  BarChart3, 
  ArrowLeft,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { withTenantPrefix } from "../../../lib/utils"
import { Link } from "react-router"

export default function RelatoriosServicos() {
  const { tenant } = useTenantStore()

  // Busca dados para relatórios
  const { data: ordens } = useQuery({
    queryKey: ['relatorios-servicos', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .eq('ativo', true)

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const stats = {
    total: ordens?.length || 0,
    concluidas: ordens?.filter(o => o.status === 'concluido').length || 0,
    custoTotal: ordens?.reduce((acc, o) => acc + (o.custo_real || 0), 0) || 0,
    tempoMedio: ordens?.filter(o => o.tempo_real_minutos).reduce((acc, o) => acc + o.tempo_real_minutos, 0) / (ordens?.filter(o => o.tempo_real_minutos).length || 1)
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Relatórios e Indicadores</h1>
            <p className="text-slate-500 font-medium text-sm">Análise de desempenho e custos de manutenção.</p>
          </div>
        </div>

        <Button variant="outline" className="rounded-xl gap-2 border-slate-200 text-slate-600 font-bold">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 leading-none">{stats.total}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Serviços Totais</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 leading-none">{stats.concluidas}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Concluídos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-800 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.custoTotal)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Investimento Total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[32px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 leading-none">{Math.round(stats.tempoMedio)}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Média Minutos / OS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos / Tabelas Adicionais */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[40px]">
          <CardHeader>
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-t border-slate-50 italic text-slate-400 font-medium">
             Gráfico de categorias (Elétrica, Hidráulica, etc)
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[40px]">
          <CardHeader>
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Serviços por Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-t border-slate-50 italic text-slate-400 font-medium">
             Evolução mensal de manutenções
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
