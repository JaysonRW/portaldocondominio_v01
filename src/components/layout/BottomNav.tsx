import { Link, useLocation } from "react-router"
import { Home, Bell, Gift, FileText, Gavel, CircleHelp } from "lucide-react"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"

export function BottomNav() {
  const location = useLocation()
  const { tenant } = useTenantStore()
  const tenantSlug = tenant?.slug
  
  const normalizedPath = tenantSlug ? (location.pathname.replace(new RegExp(`^/${tenantSlug}`), "") || "/") : location.pathname
  const isPainelPath = normalizedPath.startsWith("/painel")

  const navItems = isPainelPath ? [
    { icon: Home, label: "Gestão", path: "/painel" },
    { icon: Bell, label: "Avisos", path: "/painel/comunicados", key: "comunicados" },
    { icon: Gavel, label: "Assembleias", path: "/painel/assembleias", key: "assembleias" },
    { icon: FileText, label: "Arquivos", path: "/painel/arquivos", key: "arquivos" },
  ] : [
    { icon: Home, label: "Início", path: "/" },
    { icon: Bell, label: "Avisos", path: "/portal/comunicados", key: "comunicados" },
    { icon: CircleHelp, label: "FAQ", path: "/portal/faq", key: "faq" },
    { icon: Gift, label: "Clube", path: "/portal/clube", key: "clube" },
  ]

  const filteredNav = navItems.filter(item => {
    if (!item.key) return true;
    if (tenant?.modulos_ativos) {
      return tenant.modulos_ativos[item.key] !== false;
    }
    return true;
  })

  // Se for morador, não mostramos o menu administrativo no bottom nav por enquanto
  // ou mostramos apenas se ele estiver na área administrativa

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-around border-t border-slate-200 bg-white px-4 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
      {filteredNav.map((item) => {
        const target = withTenantPrefix(item.path, tenantSlug)
        const isActive = location.pathname === target
        return (
          <Link 
            key={item.path}
            to={target}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${isActive ? "text-[#1a2e25]" : "text-slate-400"}`}
          >
            <div className={`p-2 rounded-2xl transition-all ${isActive ? "bg-[#C5D932] shadow-lg shadow-lime-900/10 scale-110" : ""}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
