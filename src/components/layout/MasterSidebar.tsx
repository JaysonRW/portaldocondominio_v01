import {
  LayoutDashboard,
  Building2,
  Handshake,
  Mail,
  Settings,
  LogOut,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { supabase } from "../../lib/supabase"
import { cn } from "../../lib/utils"
import { useState } from "react"

export type MasterSection = "dashboard" | "condos" | "partners" | "invites" | "settings"

const NAV_ITEMS: { id: MasterSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard Master", icon: LayoutDashboard },
  { id: "condos", label: "Condomínios (Tenants)", icon: Building2 },
  { id: "partners", label: "Parceiros Globais", icon: Handshake },
  { id: "invites", label: "Convites & Adesões", icon: Mail },
  { id: "settings", label: "Configurações do Sistema", icon: Settings },
]

type MasterSidebarProps = {
  activeSection: MasterSection
  onSectionChange: (section: MasterSection) => void
  pendingApprovals?: number
}

export function MasterSidebar({
  activeSection,
  onSectionChange,
  pendingApprovals = 0,
}: MasterSidebarProps) {
  const { perfil, user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-[#1a2e25] text-white transition-all duration-300 relative border-r border-white/5 shrink-0 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 bg-[#C5D932] text-[#1a2e25] rounded-full p-1 shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      <div className="px-5 flex items-center gap-3 border-b border-white/5 h-16 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5D932] shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#1a2e25]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="font-bold text-sm text-white truncate">SaaS Condomínio</span>
            <span className="text-[9px] text-[#C5D932] font-black uppercase tracking-widest mt-1">
              Painel Master
            </span>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="p-3 mx-4 my-3 rounded-xl bg-white/5 border border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5D932]/20 flex items-center justify-center text-[#C5D932] font-black text-xs border border-[#C5D932]/10 shrink-0">
              {perfil?.nome?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col leading-none overflow-hidden">
              <span className="text-sm font-bold truncate">{perfil?.nome || user?.email?.split("@")[0]}</span>
              <span className="text-[9px] text-[#C5D932] font-black uppercase tracking-widest mt-1">Master</span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id
          const showBadge = item.id === "invites" && pendingApprovals > 0
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-left relative",
                active
                  ? "bg-[#C5D932] text-[#1a2e25] font-bold shadow-lg shadow-lime-900/10"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="text-sm tracking-tight font-medium">{item.label}</span>}
              {showBadge && !collapsed && (
                <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-[10px] font-black rounded-full flex items-center justify-center">
                  {pendingApprovals > 9 ? "9+" : pendingApprovals}
                </span>
              )}
              {showBadge && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5 shrink-0">
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-4.5 h-4.5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
