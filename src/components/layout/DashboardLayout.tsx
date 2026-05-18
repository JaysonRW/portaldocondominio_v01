import { Outlet, useNavigate } from "react-router"
import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { MasterAdminBar } from "./MasterAdminBar"
import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { supabase } from "../../lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
import { withTenantPrefix } from "../../lib/utils"
import { 
  Bell, 
  Search,
  LayoutDashboard, 
  Users, 
  Building2, 
  MessageSquareText, 
  Gavel, 
  ClipboardList, 
  Calendar, 
  Image as ImageIcon, 
  FileText, 
  CircleHelp, 
  Gift, 
  Settings,
  Sparkles,
  Command
} from "lucide-react"

export default function DashboardLayout() {
  const { perfil, user } = useAuthStore()
  const { tenant } = useTenantStore()
  const navigate = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const tenantSlug = tenant?.slug
  const isMaster = perfil?.role === 'super_admin' || user?.email === "propagoumkd@gmail.com"

  // Atalho de teclado (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-foco ao abrir a busca
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [searchOpen])

  // Reset do índice quando muda a query
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

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

  // Lista de itens pesquisáveis baseados no Sidebar
  const searchableItems = [
    { icon: LayoutDashboard, label: "Gestão / Início", category: "Administração", path: "/painel", roles: ["sindico", "subsindico"] },
    { icon: Users, label: "Moradores / Cadastros", category: "Administração", path: "/painel/moradores", roles: ["sindico", "subsindico"] },
    { icon: Building2, label: "Unidades / Blocos / Apartamentos", category: "Administração", path: "/painel/unidades", roles: ["sindico", "subsindico"] },
    { icon: MessageSquareText, label: "Canal do Morador / Chamados", category: "Atendimento", path: "/painel/canal-morador", roles: ["sindico", "subsindico"] },
    { icon: Bell, label: "Comunicados / Avisos / Notificações", category: "Comunicação", path: "/painel/comunicados", roles: ["sindico", "subsindico"], key: "comunicados" },
    { icon: Gavel, label: "Assembleias / Editais / Votações", category: "Comunicação", path: "/painel/assembleias", roles: ["sindico", "subsindico"], key: "assembleias" },
    { icon: ClipboardList, label: "Ordens de Serviço / Manutenção", category: "Operacional", path: "/painel/servicos", roles: ["sindico"], key: "servicos" },
    { icon: Calendar, label: "Agenda do Zelador", category: "Operacional", path: "/painel/servicos/agenda", roles: ["zelador"], key: "servicos" },
    { icon: LayoutDashboard, label: "Meu Painel (Zelador)", category: "Operacional", path: "/painel", roles: ["zelador"], key: "zelador-home" },
    { icon: Calendar, label: "Eventos Sociais / Reservas", category: "Comunicação", path: "/painel/eventos", roles: ["sindico"], key: "eventos" },
    { icon: ImageIcon, label: "Galeria de Fotos", category: "Comunicação", path: "/painel/galeria", roles: ["sindico", "subsindico"], key: "galeria" },
    { icon: FileText, label: "Arquivos / Documentos / Regimentos", category: "Administração", path: "/painel/arquivos", roles: ["sindico", "subsindico"], key: "arquivos" },
    { icon: CircleHelp, label: "FAQ / Dúvidas Frequentes", category: "Administração", path: "/painel/faq", roles: ["sindico", "subsindico"], key: "faq" },
    { icon: Gift, label: "Clube de Descontos / Clube do Morador", category: "Vantagens", path: "/painel/clube", roles: ["sindico", "subsindico"], key: "clube" },
    { icon: FileText, label: "Guia do Morador / Regras", category: "Administração", path: "/painel/guia", roles: ["sindico", "subsindico"], key: "guia" },
    { icon: Settings, label: "Configurações do Condomínio", category: "Administração", path: "/painel/configuracoes", roles: ["sindico"] },
  ];

  const filteredSearchItems = searchableItems.filter(item => {
    if (isMaster) return true;
    
    // Filtro por Role
    const hasRole = item.roles.includes(perfil?.role);
    if (!hasRole) return false;

    // Filtro por Módulo Ativo
    if (item.key && tenant?.modulos_ativos) {
       return tenant.modulos_ativos[item.key] !== false;
    }

    return true;
  })

  const matches = filteredSearchItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (path: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    navigate(withTenantPrefix(path, tenantSlug))
  }

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(idx => (matches.length > 0 ? (idx + 1) % matches.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(idx => (matches.length > 0 ? (idx - 1 + matches.length) % matches.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (matches[selectedIndex]) {
        handleNavigate(matches[selectedIndex].path)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setSearchOpen(false)
    }
  }

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

             <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-2 hover:bg-slate-100/50 hover:border-slate-200 transition-all cursor-pointer group shrink-0" onClick={() => setSearchOpen(true)}>
               <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Pesquisar no painel... (Ctrl+K)" 
                 className="bg-transparent border-none outline-none text-xs font-semibold w-64 text-slate-600 focus:ring-0 cursor-pointer pointer-events-none placeholder-slate-400"
                 readOnly
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

      {/* Command Palette Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 transition-all duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
            onKeyDown={handleModalKeyDown}
          >
            {/* Input bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="O que você está procurando no painel?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-base font-medium w-full text-slate-700 placeholder-slate-400 focus:ring-0"
              />
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-black text-slate-400 shadow-sm leading-none">ESC</kbd>
              </div>
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Command className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm">Nenhum resultado encontrado para "{searchQuery}"</p>
                  <p className="text-slate-400 text-xs mt-1">Experimente pesquisar "moradores", "unidades", "comunicados" ou "agenda".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="px-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resultados ({matches.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matches.map((item, index) => {
                      const active = index === selectedIndex
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
                            active 
                              ? "bg-[#1a2e25] text-white shadow-md shadow-emerald-950/10" 
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${active ? "bg-white/10 text-[#C5D932]" : "bg-slate-100 text-slate-400 group-hover:text-slate-600"}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{item.label}</p>
                            <p className={`text-[10px] font-medium truncate ${active ? "text-white/60" : "text-slate-400"}`}>{item.category}</p>
                          </div>
                          {active && (
                            <span className="text-[10px] font-black uppercase text-[#C5D932] tracking-wider px-2 py-1 bg-white/10 rounded-md shrink-0">IR</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm">↑↓</kbd> Navegar</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm">Enter</kbd> Selecionar</span>
              </div>
              <div className="flex items-center gap-1 text-[#1a2e25]">
                <Sparkles className="w-3 h-3 text-[#C5D932]" />
                <span>Atalho Rápido</span>
              </div>
            </div>
          </div>
          {/* Backdrop click close */}
          <div className="absolute inset-0 -z-10" onClick={() => setSearchOpen(false)} />
        </div>
      )}
    </div>
  )
}
