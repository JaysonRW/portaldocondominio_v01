import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { MasterAdminBar } from "./MasterAdminBar"
import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { supabase } from "../../lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { Bell, Search } from "lucide-react"

export default function DashboardLayout() {
  const { perfil, user } = useAuthStore()
  const { tenant } = useTenantStore()

  console.log("Dashboard Info:", { role: perfil?.role, tenant: tenant?.nome, slug: tenant?.slug })

  // Busca notificações não lidas
  const { data: unreadCount } = useQuery({
    queryKey: ['unread_notifications', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user?.id)
        .eq('lida', false)
      
      if (error) return 0
      return count || 0
    },
    enabled: !!user?.id,
    refetchInterval: 1000 * 60 // 1 min
  })

  // Iniciais para o avatar
  const iniciais = perfil?.nome
    ? perfil.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <MasterAdminBar />
        
        {/* Topbar Desktop & Mobile Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
             {/* Mobile Logo/Menu Toggle */}
             <div className="flex md:hidden items-center gap-3">
               {tenant?.logo_url ? (
                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden">
                   <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-cover" />
                 </div>
               ) : (
                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a2e25] p-1 shadow-sm">
                   <span className="text-xs font-black text-[#C5D932] uppercase">
                     {tenant?.nome?.split(' ').map(w => w[0]).join('').substring(0, 2) || "CB"}
                   </span>
                 </div>
               )}
               <span className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{tenant?.nome}</span>
             </div>

             <div className="hidden md:flex items-center gap-2 text-slate-400">
               <Search className="w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="Pesquisar no painel..." 
                 className="bg-transparent border-none outline-none text-sm font-medium w-64 text-slate-600 focus:ring-0"
               />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
              <Bell className="w-5 h-5" />
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:flex flex-col items-end leading-none">
                <span className="text-sm font-black text-slate-800 truncate max-w-[150px]">
                  {perfil?.nome || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                  {perfil?.role === 'super_admin' ? 'Master' : perfil?.role === 'sindico' ? 'Síndico' : perfil?.role === 'zelador' ? 'Zelador' : 'Morador'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {perfil?.foto_url ? (
                  <img src={perfil.foto_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-slate-400">{iniciais}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Navigation (Bottom Nav) */}
        <BottomNav />
      </div>
    </div>
  )
}
