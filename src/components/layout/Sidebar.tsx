import { Link, useLocation } from "react-router"
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  Calendar, 
  Image as ImageIcon, 
  FileText, 
  CircleHelp, 
  LogOut,
  ChevronLeft,
  Building2,
  Gift,
  ShieldAlert,
  Gavel,
  Settings,
  ClipboardList,
  MessageSquareText,
  Package
} from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"
import { supabase } from "../../lib/supabase"
import { useState } from "react"
import { cn } from "../../lib/utils"

export function Sidebar() {
  const location = useLocation()
  const { perfil, user } = useAuthStore()
  const { tenant } = useTenantStore()
  const [collapsed, setCollapsed] = useState(false)

  const tenantSlug = tenant?.slug
  const normalizedPath = tenantSlug ? (location.pathname.replace(new RegExp(`^/${tenantSlug}`), "") || "/") : location.pathname
  const isPainelPath = normalizedPath.startsWith("/painel")
  const isAppPath = normalizedPath.startsWith("/app")

  const isMaster = perfil?.role === 'super_admin' || user?.email === "propagoumkd@gmail.com"
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Definição dos menus baseada na área (App ou Painel)
  const menuItemsPainel = [
    { icon: LayoutDashboard, label: "Gestão", path: "/painel", roles: ["sindico", "subsindico"] },
    { icon: Users, label: "Moradores", path: "/painel/moradores", roles: ["sindico", "subsindico"] },
    { icon: Building2, label: "Unidades", path: "/painel/unidades", roles: ["sindico", "subsindico"] },
    { icon: MessageSquareText, label: "Canal do Morador", path: "/painel/canal-morador", roles: ["sindico", "subsindico"] },
    { icon: Bell, label: "Comunicados", path: "/painel/comunicados", roles: ["sindico", "subsindico"], key: "comunicados" },
    { icon: Gavel, label: "Assembleias", path: "/painel/assembleias", roles: ["sindico", "subsindico"], key: "assembleias" },
    { icon: ClipboardList, label: "Ordens de Serviço", path: "/painel/servicos", roles: ["sindico"], key: "servicos" },
    { icon: Package, label: "Portaria", path: "/painel/portarias", roles: ["sindico"] },
    { icon: Calendar, label: "Agenda", path: "/painel/servicos/agenda", roles: ["zelador"], key: "servicos" },
    { icon: LayoutDashboard, label: "Meu Painel", path: "/painel", roles: ["zelador"], key: "zelador-home" },
    { icon: Calendar, label: "Eventos Sociais", path: "/painel/eventos", roles: ["sindico"], key: "eventos" },
    { icon: ImageIcon, label: "Galeria", path: "/painel/galeria", roles: ["sindico", "subsindico"], key: "galeria" },
    { icon: FileText, label: "Arquivos", path: "/painel/arquivos", roles: ["sindico", "subsindico"], key: "arquivos" },
    { icon: CircleHelp, label: "FAQ", path: "/painel/faq", roles: ["sindico", "subsindico"], key: "faq" },
    { icon: Gift, label: "Clube", path: "/painel/clube", roles: ["sindico", "subsindico"], key: "clube" },
    { icon: FileText, label: "Guia do Morador", path: "/painel/guia", roles: ["sindico", "subsindico"], key: "guia" },
    { icon: Settings, label: "Configurações", path: "/painel/configuracoes", roles: ["sindico"] },
    { icon: ShieldAlert, label: "Painel Master", path: "/painel-master", roles: ["super_admin"] },
  ];

  const menuItemsApp = [
    { icon: LayoutDashboard, label: "Início", path: "/app", roles: ["morador", "sindico", "subsindico"] },
    { icon: Bell, label: "Comunicados", path: "/app/comunicados", roles: ["morador", "sindico", "subsindico"], key: "comunicados" },
    { icon: Gavel, label: "Assembleias", path: "/app/assembleias", roles: ["morador", "sindico", "subsindico"], key: "assembleias" },
    { icon: Calendar, label: "Eventos Sociais", path: "/app/eventos", roles: ["morador", "sindico", "subsindico"], key: "eventos" },
    { icon: ImageIcon, label: "Galeria", path: "/app/galeria", roles: ["morador", "sindico", "subsindico"], key: "galeria" },
    { icon: FileText, label: "Arquivos", path: "/app/arquivos", roles: ["morador", "sindico", "subsindico"], key: "arquivos" },
    { icon: CircleHelp, label: "FAQ", path: "/app/faq", roles: ["morador", "sindico", "subsindico"], key: "faq" },
    { icon: Gift, label: "Clube de Vantagens", path: "/app/clube", roles: ["morador", "sindico", "subsindico"], key: "clube" },
    { icon: FileText, label: "Guia do Morador", path: "/portal/guia", roles: ["morador", "sindico", "subsindico"], key: "guia" },
  ];

  const menuItems = isPainelPath ? menuItemsPainel : menuItemsApp;

  const filteredMenu = menuItems.filter(item => {
    if (isMaster) return true;
    
    // Filtro por Role
    const hasRole = item.roles.includes(perfil?.role);
    if (!hasRole) return false;

    // Filtro por Módulo Ativo (se houver chave de módulo)
    if (item.key && tenant?.modulos_ativos) {
       return tenant.modulos_ativos[item.key] !== false;
    }

    return true;
  })

  const isActive = (path: string) => {
    const fullPath = withTenantPrefix(path, tenantSlug)
    if (path === "/app" || path === "/painel") {
       return location.pathname === fullPath || location.pathname === fullPath + "/"
    }
    return location.pathname.startsWith(fullPath)
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-[#1a2e25] text-white transition-all duration-300 relative border-r border-white/5",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 bg-[#C5D932] text-[#1a2e25] rounded-full p-1 shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      {/* Brand */}
      <div className="px-5 flex items-center gap-3 border-b border-white/5 h-16 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5D932] shrink-0 p-1">
          <span className="text-[10px] font-black text-[#1a2e25] uppercase leading-none">
            {tenant?.nome?.split(' ').map(w => w[0]).join('').substring(0, 2) || "CB"}
          </span>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="font-bold text-sm text-white truncate">{tenant?.nome || "Condomínio Smart"}</span>
            <span className="text-[9px] text-[#C5D932] font-black uppercase tracking-widest mt-1">
              {isPainelPath ? "Painel Adm" : "Portal Morador"}
            </span>
          </div>
        )}
      </div>

      {/* User Profile Summary */}
      {!collapsed && (
        <div className="p-3 mx-4 my-3 rounded-xl bg-white/5 border border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5D932]/20 flex items-center justify-center text-[#C5D932] font-black text-xs border border-[#C5D932]/10 shrink-0">
              {perfil?.nome?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col leading-none overflow-hidden">
              <span className="text-sm font-bold truncate">{perfil?.nome || user?.email?.split('@')[0]}</span>
              <span className="text-[9px] text-[#C5D932] font-black uppercase tracking-widest mt-1">
                {perfil?.role === 'super_admin' ? 'Master' : perfil?.role === 'sindico' ? 'Síndico' : perfil?.role === 'zelador' ? 'Zelador' : perfil?.role === 'portaria' ? 'Portaria' : 'Morador'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pt-1">
        {filteredMenu.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={withTenantPrefix(item.path, tenantSlug)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                active 
                  ? "bg-[#C5D932] text-[#1a2e25] font-bold shadow-lg shadow-lime-900/10" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : ""}
            >
              <item.icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform", !active && "group-hover:scale-110")} />
              {!collapsed && <span className="text-sm tracking-tight font-medium">{item.label}</span>}
              {!collapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a2e25]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5 space-y-0.5 shrink-0">
        {!collapsed && isAppPath && (perfil?.role === 'sindico' || perfil?.role === 'subsindico' || isMaster) && (
          <Link 
            to={withTenantPrefix("/painel", tenantSlug)} 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#C5D932] hover:bg-white/5 transition-all text-sm font-bold"
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            Painel Administrativo
          </Link>
        )}
        {!collapsed && isPainelPath && (
          <Link 
            to={withTenantPrefix("/", tenantSlug)} 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
          >
            <Building2 className="w-4.5 h-4.5" />
            Ver Área do Morador
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sair" : ""}
        >
          <LogOut className="w-4.5 h-4.5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
