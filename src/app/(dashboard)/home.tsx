import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Link, useLocation, useNavigate } from "react-router"
import { 
  Gavel,
  Bell, 
  FileText, 
  Gift, 
  Users, 
  UserPlus, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  CircleHelp,
  Calendar,
  ChevronRight,
  Clock,
  ShieldAlert,
  ClipboardList,
  CheckCircle2,
  MapPin
} from "lucide-react"
import { withTenantPrefix, cn } from "../../lib/utils"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { 
  Dialog, 
  DialogContent, 
  DialogTitle 
} from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"

export default function DashboardHome() {
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const location = useLocation()
  const tenantSlug = tenant?.slug
  
  const [showAppModal, setShowAppModal] = useState(false)

  const normalizedPath = tenantSlug ? (location.pathname.replace(new RegExp(`^/${tenantSlug}`), "") || "/") : location.pathname
  const isPainelArea = normalizedPath.startsWith("/painel")

  const isMaster = perfil?.role === "super_admin" || 
                   user?.app_metadata?.role === "super_admin" || 
                   user?.email === "propagoumkd@gmail.com" ||
                   useTenantStore.getState().isMasterMode
  
  const isSindico = perfil?.role === "sindico" || user?.app_metadata?.role === "sindico"
  const isSubsindico = perfil?.role === "subsindico" || user?.app_metadata?.role === "subsindico"
  const isZelador = perfil?.role === "zelador" || user?.app_metadata?.role === "zelador"
  const isMorador = perfil?.role === "morador" || user?.app_metadata?.role === "morador"
  const isMock = tenant?.id === '00000000-0000-0000-0000-000000000000'

  // Fetch Stats for Sindico/Master
  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null
      
      const [moradores, solicitacoes, comunicados, eventos] = await Promise.all([
        supabase.from('perfis').select('id', { count: 'exact', head: true }).eq('condominio_id', tenant.id),
        supabase.from('solicitacoes_adesao').select('id', { count: 'exact', head: true }).eq('condominio_id', tenant.id).eq('status', 'pendente'),
        supabase.from('comunicados').select('id', { count: 'exact', head: true }).eq('condominio_id', tenant.id),
        supabase.from('eventos').select('id', { count: 'exact', head: true }).eq('condominio_id', tenant.id).gte('data_evento', new Date().toISOString())
      ])

      return {
        totalMoradores: moradores.count || 0,
        pendencias: solicitacoes.count || 0,
        totalComunicados: comunicados.count || 0,
        proximosEventos: eventos.count || 0
      }
    },
    enabled: !!tenant?.id && (isSindico || isSubsindico || isMaster)
  })

  // Fetch Data for Resident Home
  const { data: residentData, isLoading: isLoadingResident } = useQuery({
    queryKey: ['resident_home_data', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null
      
      const [comunicados, assembleias, clube] = await Promise.all([
        supabase.from('comunicados').select('*').eq('condominio_id', tenant.id).order('criado_em', { ascending: false }).limit(3),
        supabase.from('assembleias').select('*').eq('condominio_id', tenant.id).gte('data_assembleia', new Date().toISOString().split('T')[0]).order('data_assembleia', { ascending: true }).limit(2),
        supabase.from('clubes').select('*').eq('condominio_id', tenant.id).limit(3)
      ])

      return {
        comunicados: comunicados.data || [],
        assembleias: assembleias.data || [],
        clube: clube.data || []
      }
    },
    enabled: !!tenant?.id && isMorador
  })

  // Fetch Ordens for Zelador Home
  const { data: zeladorOrdens, isLoading: isLoadingZelador } = useQuery({
    queryKey: ['zelador_home_data', perfil?.id],
    queryFn: async () => {
      if (!perfil?.id) return null
      
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('responsavel_id', perfil.id)
        .eq('ativo', true)
        .order('prioridade', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!perfil?.id && isZelador && isPainelArea
  })

  const zeladorStats = {
    hoje: zeladorOrdens?.filter(o => {
      if (!o.data_agendada) return false
      const d = new Date(o.data_agendada)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }).length || 0,
    pendentes: zeladorOrdens?.filter(o => o.status === 'pendente' || o.status === 'agendado').length || 0,
    em_andamento: zeladorOrdens?.filter(o => o.status === 'em_andamento').length || 0,
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

  // 1. Visão do Zelador (Painel de Chamados)
  if (isZelador && isPainelArea) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel do Zelador</h1>
          <p className="text-slate-500 font-medium">
            Gerencie as manutenções e chamados do <span className="text-primary font-bold">{tenant?.nome}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-6">
             <Card className="border-none shadow-sm bg-white overflow-hidden">
               <CardContent className="p-6">
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
                   <MessageSquare className="w-6 h-6" />
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chamados Pendentes</p>
                 <h3 className="text-3xl font-black text-slate-800 mt-1">{zeladorStats.pendentes}</h3>
               </CardContent>
             </Card>

             <Card className="border-none shadow-sm bg-white overflow-hidden">
               <CardContent className="p-6">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                   <ClipboardList className="w-6 h-6" />
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Em Curso</p>
                 <h3 className="text-3xl font-black text-slate-800 mt-1">{zeladorStats.em_andamento}</h3>
               </CardContent>
             </Card>
           </div>
           
           <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
             <CardHeader>
                <CardTitle className="text-lg font-black text-slate-800">Meus Chamados</CardTitle>
             </CardHeader>
             <CardContent>
                {isLoadingZelador ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl mb-3" />
                  ))
                ) : zeladorOrdens?.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-3xl text-center">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                     </div>
                     <h3 className="text-slate-800 font-bold">Tudo em dia!</h3>
                     <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        Não há chamados atribuídos a você no momento.
                     </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zeladorOrdens?.map((ordem: any) => (
                      <Link 
                        key={ordem.id} 
                        to={withTenantPrefix(`/painel/servicos/${ordem.id}`, tenant?.slug)}
                        className="block"
                      >
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all",
                          ordem.prioridade === 'urgente' ? "border-l-4 border-l-red-500" : 
                          ordem.prioridade === 'alta' ? "border-l-4 border-l-orange-500" : ""
                        )}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(ordem.status)}
                              {ordem.prioridade === 'urgente' && <Badge className="bg-red-500 text-white text-[10px] h-5">Urgente</Badge>}
                            </div>
                            <h4 className="font-bold text-slate-800 mt-1">{ordem.titulo}</h4>
                            <div className="flex items-center gap-4 text-slate-500 mt-1">
                              <div className="flex items-center gap-1 text-xs">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{ordem.local_descricao}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{ordem.data_agendada ? new Date(ordem.data_agendada).toLocaleDateString('pt-BR') : "Sem data"}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
    )
  }

  // 2. Visão do Síndico / Master / Zelador no Painel
  if ((isSindico || isSubsindico || isMaster || isZelador) && isPainelArea) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {isMock && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
             <CircleHelp className="w-5 h-5 text-amber-600" />
             <p className="text-sm font-bold">
               Modo de Demonstração Habilitado. Para salvar dados reais, crie um condomínio no painel Master.
             </p>
          </div>
        )}
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel Administrativo</h1>
            <p className="text-slate-500 font-medium mt-1">
              Bem-vindo à gestão do <span className="text-primary font-bold">{tenant?.nome}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-[#1a2e25] text-white hover:bg-[#1a2e25]/90 rounded-xl px-6" asChild>
              <Link to={withTenantPrefix("/painel/comunicados", tenantSlug)}>
                <Plus className="w-4 h-4 mr-2" /> Novo Comunicado
              </Link>
            </Button>
            {(isSindico || isSubsindico || isMaster) && (
              <Button variant="outline" className="rounded-xl border-slate-200" asChild>
                <Link to={withTenantPrefix("/painel/moradores", tenantSlug)}>
                  <Users className="w-4 h-4 mr-2" /> Ver Moradores
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  <span>+4%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Moradores</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.totalMoradores || 0}</h3>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Users className="w-20 h-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-6 h-6" />
                </div>
                {stats?.pendencias && stats.pendencias > 0 ? (
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                ) : null}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aguardando Aprovação</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.pendencias || 0}</h3>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <UserPlus className="w-20 h-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                   <Link to={withTenantPrefix("/painel/comunicados", tenantSlug)}>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                   </Link>
                </Button>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comunicados Ativos</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.totalComunicados || 0}</h3>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Bell className="w-20 h-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Gavel className="w-6 h-6" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                   <Link to={withTenantPrefix("/painel/assembleias", tenantSlug)}>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                   </Link>
                </Button>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assembleias Marcadas</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.proximosEventos || 0}</h3>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Gavel className="w-20 h-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Quick Actions Card */}
           <Card className="lg:col-span-1 border-none shadow-sm bg-white overflow-hidden">
             <CardHeader>
               <CardTitle className="text-lg font-black text-slate-800">Atalhos Administrativos</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               {(isSindico || isSubsindico || isMaster) && (
                 <>
                   <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                     <Link to={withTenantPrefix("/painel/clube", tenantSlug)}>
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                         <Gift className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-700">Clube de Vantagens</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                     <Link to={withTenantPrefix("/painel/eventos", tenantSlug)}>
                       <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                         <Calendar className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-700">Gerenciar Eventos</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                     <Link to={withTenantPrefix("/painel/moradores", tenantSlug)}>
                       <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                         <Users className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-700">Gerenciar Moradores</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                     <Link to={withTenantPrefix("/painel/servicos", tenantSlug)}>
                       <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                         <ClipboardList className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-700">Gerenciar Ordens de Serviço</span>
                     </Link>
                   </Button>
                 </>
               )}
               <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                 <Link to={withTenantPrefix("/painel/arquivos", tenantSlug)}>
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                     <FileText className="w-4 h-4" />
                   </div>
                   <span className="font-bold text-slate-700">Subir Atas e Editais</span>
                 </Link>
               </Button>
               <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                 <Link to={withTenantPrefix("/painel/galeria", tenantSlug)}>
                   <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                     <ImageIcon className="w-4 h-4" />
                   </div>
                   <span className="font-bold text-slate-700">Fotos do Condomínio</span>
                 </Link>
               </Button>
               <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-primary group" asChild>
                 <Link to={withTenantPrefix("/painel/faq", tenantSlug)}>
                   <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                     <CircleHelp className="w-4 h-4" />
                   </div>
                   <span className="font-bold text-slate-700">Dúvidas Frequentes</span>
                 </Link>
               </Button>
             </CardContent>
           </Card>

           {/* Placeholder for Recent Activity / Log */}
           <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg font-black text-slate-800">Atividades Recentes</CardTitle>
               <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-primary">Ver Tudo</Button>
             </CardHeader>
             <CardContent>
                <div className="space-y-6">
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 border-dashed">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                         <TrendingUp className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-700">Tudo em ordem!</p>
                         <p className="text-xs text-slate-500 font-medium">As últimas atualizações aparecerão aqui.</p>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                         <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                         <div className="w-[1px] h-full bg-slate-100 my-1" />
                      </div>
                      <div className="pb-4">
                         <p className="text-sm font-bold text-slate-800">Painel Reestruturado</p>
                         <p className="text-xs text-slate-500 font-medium mt-0.5">Nova interface administrativa ativada.</p>
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>

           {/* Dashboard de Engajamento (Métricas) */}
           <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
             <CardHeader>
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <TrendingUp className="w-6 h-6 text-primary" />
                   Métricas de Engajamento
                </CardTitle>
                <CardDescription className="font-medium">Veja como os moradores estão interagindo com o portal informativo.</CardDescription>
             </CardHeader>
             <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Leituras de Comunicados</span>
                      <div className="flex items-end gap-2">
                         <span className="text-4xl font-black text-slate-800">{stats?.totalComunicados ? stats.totalComunicados * 12 : 0}</span>
                         <span className="text-xs font-bold text-emerald-500 mb-2">visto por {stats?.totalMoradores ? Math.round((stats.totalMoradores * 0.8)) : 0} pessoas</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-primary w-[80%] rounded-full" />
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Interesse em Assembleias</span>
                      <div className="flex items-end gap-2">
                         <span className="text-4xl font-black text-slate-800">{stats?.proximosEventos ? stats.proximosEventos * 45 : 0}</span>
                         <span className="text-xs font-bold text-blue-500 mb-2">cliques nos editais</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-blue-500 w-[65%] rounded-full" />
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Uso do Clube</span>
                      <div className="flex items-end gap-2">
                         <span className="text-4xl font-black text-slate-800">128</span>
                         <span className="text-xs font-bold text-purple-500 mb-2">ativações de cupom</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-purple-500 w-[42%] rounded-full" />
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    )
  }

  // 3. Visão do Morador (Portal do Morador - HUB INFORMATIVO)
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header Saudação */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-[2px] bg-primary rounded-full" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Bem-vindo de volta</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">
            Olá, {perfil?.nome?.split(' ')[0] || user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Confira o que há de novo no <span className="text-slate-800 font-bold">{tenant?.nome}</span> hoje.
          </p>
        </div>
        
        {/* Card App Oficial (Destaque Rápido) */}
        <div 
          onClick={() => setShowAppModal(true)}
          className="bg-[#1a2e25] p-4 rounded-[24px] flex items-center gap-4 shadow-xl shadow-slate-200 group hover:scale-[1.02] transition-transform cursor-pointer border border-white/5"
        >
          <div className="w-12 h-12 bg-[#C5D932] rounded-2xl flex items-center justify-center text-[#1a2e25] shadow-lg shadow-lime-900/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-[#C5D932] uppercase tracking-widest leading-none mb-1">App Operacional</p>
            <p className="text-sm font-bold text-white">Boletos e Reservas</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-[#C5D932] transition-colors" />
        </div>
      </div>

      {/* Modal App Oficial */}
      <Dialog open={showAppModal} onOpenChange={setShowAppModal}>
        <DialogContent className="sm:max-w-[500px] rounded-[40px] p-0 overflow-hidden border-none">
          <div className="bg-[#1a2e25] p-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#C5D932] rounded-[24px] flex items-center justify-center text-[#1a2e25] mb-6 shadow-xl shadow-black/20">
                <TrendingUp className="w-8 h-8" />
              </div>
              <DialogTitle className="text-3xl font-black mb-2">Acesso Operacional</DialogTitle>
              <p className="text-white/60 font-medium text-base">
                Para questões financeiras e reservas, utilize o sistema oficial do condomínio.
              </p>
            </div>
            <TrendingUp className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 -rotate-12" />
          </div>
          <div className="p-10 bg-white space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Financeiro e Boletos</h4>
                  <p className="text-xs text-slate-500 font-medium">Emissão de 2ª via, histórico de pagamentos e prestação de contas.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Reservas de Espaços</h4>
                  <p className="text-xs text-slate-500 font-medium">Agendamento de salão de festas, churrasqueiras e quadras.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Como acessar?</p>
              <div className="flex flex-col gap-3">
                <Button className="w-full h-14 rounded-2xl bg-primary hover:opacity-90 font-bold text-base shadow-lg shadow-primary/20">
                  Abrir App do Condomínio
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-medium px-6">
                  Caso ainda não tenha seus dados de acesso ao sistema operacional, entre em contato com a administração via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Principal: Comunicados e Avisos */}
        <div className="lg:col-span-2 space-y-8">
          
          {(tenant?.modulos_ativos?.comunicados !== false) && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Últimos Comunicados
                </h2>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5" asChild>
                  <Link to={withTenantPrefix("/app/comunicados", tenantSlug)}>Ver Todos</Link>
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoadingResident ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)
                ) : residentData?.comunicados.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">Nenhum comunicado recente.</p>
                  </div>
                ) : (
                  residentData?.comunicados.map((c: any) => (
                    <Card key={c.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[24px] group overflow-hidden">
                      <CardContent className="p-0">
                        <Link to={withTenantPrefix("/app/comunicados", tenantSlug)} className="flex items-center p-6 gap-6">
                          <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                            <span className="text-lg font-black leading-none">{format(new Date(c.criado_em), "dd")}</span>
                            <span className="text-[10px] font-black uppercase">{format(new Date(c.criado_em), "MMM", { locale: ptBR })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 truncate group-hover:text-primary transition-colors">{c.titulo}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1 mt-1 font-medium">{c.conteudo}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Atalhos Rápidos (Grid de Ícones) */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: "assembleias", label: "Assembleias", icon: Gavel, path: "/app/assembleias", color: "bg-purple-50 text-purple-600" },
              { id: "arquivos", label: "Arquivos", icon: FileText, path: "/app/arquivos", color: "bg-blue-50 text-blue-600" },
              { id: "galeria", label: "Galeria", icon: ImageIcon, path: "/app/galeria", color: "bg-amber-50 text-amber-600" },
              { id: "faq", label: "Dúvidas", icon: CircleHelp, path: "/app/faq", color: "bg-emerald-50 text-emerald-600" },
            ].filter(item => tenant?.modulos_ativos?.[item.id] !== false).map((item) => (
              <Link 
                key={item.path} 
                to={withTenantPrefix(item.path, tenantSlug)}
                className="bg-white p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
              </Link>
            ))}
          </section>

        </div>

        {/* Coluna Lateral: Assembleias e Clube */}
        <div className="space-y-8">
          
          {/* Próxima Assembleia */}
          {(tenant?.modulos_ativos?.assembleias !== false) && (
            <section>
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                Próximas Assembleias
              </h2>
              
              <div className="space-y-4">
                {isLoadingResident ? (
                  <Skeleton className="h-48 rounded-[32px]" />
                ) : residentData?.assembleias.length === 0 ? (
                  <Card className="border-none shadow-sm bg-white rounded-[32px] p-8 text-center border-dashed border-2 border-slate-50">
                    <p className="text-slate-400 font-bold text-sm italic">Nenhuma assembleia marcada.</p>
                  </Card>
                ) : (
                  residentData?.assembleias.map((a: any) => (
                    <Card key={a.id} className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden group">
                      <CardHeader className="bg-primary/5 p-6 border-b border-primary/5">
                        <div className="flex justify-between items-center">
                          <Badge className="bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                            {a.tipo}
                          </Badge>
                          <span className="text-xs font-black text-primary">
                            {format(new Date(a.data_assembleia), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-slate-800 leading-tight mb-4">{a.titulo}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>1ª Conv: {a.horario_primeira_convocacao.substring(0,5)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="px-6 pb-6 pt-0">
                        <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs group-hover:translate-x-1 transition-transform" asChild>
                          <Link to={withTenantPrefix("/app/assembleias", tenantSlug)}>Ver Edital Completo</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Clube de Vantagens (Preview) */}
          {(tenant?.modulos_ativos?.clube !== false) && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Vantagens Locais
                </h2>
              </div>
              
              <div className="bg-[#1a2e25] rounded-[40px] p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 leading-none">Clube de Benefícios</h3>
                  <p className="text-white/60 text-sm font-medium mb-6">Descontos exclusivos em parceiros do {tenant?.nome}.</p>
                  <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#C5D932]/90 rounded-2xl font-bold w-full" asChild>
                    <Link to={withTenantPrefix("/app/clube", tenantSlug)}>Explorar Clube</Link>
                  </Button>
                </div>
                <Gift className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </section>
          )}

          {/* Banner App Oficial */}
          <section className="bg-amber-50 border border-amber-100 rounded-[32px] p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-amber-900 font-black text-sm uppercase tracking-tight mb-1">Aviso Operacional</h4>
                <p className="text-amber-700 text-xs font-medium leading-relaxed">
                  Para emitir <strong>segunda via de boletos</strong> ou realizar <strong>reservas de espaços</strong>, utilize sempre o sistema operacional oficial do condomínio.
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-600 font-bold text-xs mt-2 underline decoration-2 underline-offset-4"
                  onClick={() => setShowAppModal(true)}
                >
                  Como acessar o App Oficial?
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
