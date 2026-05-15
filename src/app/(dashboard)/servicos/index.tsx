import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "../../../components/ui/card"
import { 
  ClipboardList, 
  PlusCircle, 
  Search, 
  Calendar as CalendarIcon,
  User,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  MapPin,
  Tag,
  BarChart3,
  Users
} from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { withTenantPrefix, cn } from "../../../lib/utils"
import { Link } from "react-router"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"

export default function GestaoServicos() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")

  const isSindico = perfil?.role === 'sindico' || perfil?.role === 'subsindico'

  // 1. Busca estatísticas
  const { data: stats } = useQuery({
    queryKey: ['servicos-stats', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('status, data_agendada')
        .eq('condominio_id', tenant?.id)
        .eq('ativo', true)

      if (error) throw error

      return {
        total: data.length,
        pendentes: data.filter(o => o.status === 'pendente').length,
        em_andamento: data.filter(o => o.status === 'em_andamento').length,
        concluidos: data.filter(o => o.status === 'concluido').length,
        atrasados: data.filter(o => o.status !== 'concluido' && o.data_agendada && new Date(o.data_agendada) < new Date()).length
      }
    },
    enabled: !!tenant?.id,
  })

  // 2. Busca ordens de serviço
  const { data: ordens, isLoading } = useQuery({
    queryKey: ['servicos-list', tenant?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ordens_servico')
        .select(`
          *,
          responsavel:perfis!ordens_servico_responsavel_id_fkey(nome)
        `)
        .eq('condominio_id', tenant?.id)
        .eq('ativo', true)
        .order('criado_em', { ascending: false })

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ ativo: false })
        .eq('id', id)

      if (error) throw error
      toast.success("Ordem de serviço excluída!")
      queryClient.invalidateQueries({ queryKey: ['servicos-list'] })
      queryClient.invalidateQueries({ queryKey: ['servicos-stats'] })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao excluir ordem de serviço")
    }
  }

  const filteredOrdens = ordens?.filter(o => 
    o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.local_descricao.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Gestão de Serviços</h1>
          <p className="text-slate-500 font-medium mt-1">Gestão interna de manutenções e serviços do zelador.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="rounded-xl px-4 gap-2 border-slate-200 text-slate-600 font-bold">
            <Link to={withTenantPrefix("/painel/servicos/agenda", tenant?.slug)}>
              <CalendarIcon className="h-4 w-4" />
              Agenda
            </Link>
          </Button>
          {isSindico && (
            <>
              <Button asChild variant="outline" className="rounded-xl px-4 gap-2 border-slate-200 text-slate-600 font-bold">
                <Link to={withTenantPrefix("/painel/servicos/relatorios", tenant?.slug)}>
                  <BarChart3 className="h-4 w-4" />
                  Relatórios
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl px-4 gap-2 border-slate-200 text-slate-600 font-bold">
                <Link to={withTenantPrefix("/painel/zeladores", tenant?.slug)}>
                  <Users className="h-4 w-4" />
                  Zeladores
                </Link>
              </Button>
              <Button asChild className="bg-primary hover:opacity-90 text-white rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
                <Link to={withTenantPrefix("/painel/servicos/nova", tenant?.slug)}>
                  <PlusCircle className="h-4 w-4" />
                  Nova Ordem
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black text-slate-800">{stats?.pendentes || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendentes</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black text-blue-600">{stats?.em_andamento || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Em Curso</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black text-green-600">{stats?.concluidos || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Concluídos</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black text-red-600">{stats?.atrasados || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atrasados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por título ou local..." 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['todos', 'pendente', 'em_andamento', 'concluido'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "ghost"}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-xl h-10 px-4 text-xs font-black uppercase tracking-widest whitespace-nowrap",
                statusFilter === status ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {status === 'todos' ? 'Todos' : status === 'em_andamento' ? 'Em Curso' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))
        ) : filteredOrdens?.length === 0 ? (
          <Card className="border-none shadow-sm bg-white rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
            <ClipboardList className="w-16 h-16 text-slate-100 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Nenhuma ordem encontrada</h3>
            <p className="text-slate-500 font-medium max-w-xs mt-2">
              Ajuste seus filtros ou crie uma nova ordem de serviço.
            </p>
          </Card>
        ) : (
          filteredOrdens?.map((ordem) => (
            <Link 
              key={ordem.id} 
              to={withTenantPrefix(`/painel/servicos/${ordem.id}`, tenant?.slug)}
              className="block group"
            >
              <Card className={cn(
                "border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300",
                ordem.prioridade === 'urgente' ? "border-l-4 border-l-red-500" : ""
              )}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ordem.status)}
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-black uppercase tracking-tighter h-5 px-2",
                          ordem.prioridade === 'urgente' ? "bg-red-500 text-white border-none" : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          {ordem.prioridade}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">
                        {ordem.titulo}
                      </h3>
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

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Previsão</span>
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {ordem.data_agendada ? new Date(ordem.data_agendada).toLocaleDateString('pt-BR') : "--/--/--"}
                        </div>
                      </div>
                      
                      {isSindico && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                            <DropdownMenuItem className="gap-2 font-bold text-slate-600 focus:text-primary">
                              <Pencil className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 font-bold text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(ordem.id)}
                            >
                              <Trash2 className="w-4 h-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronRight className="w-6 h-6" />
                      </div>
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
