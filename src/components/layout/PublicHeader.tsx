import { Link, useLocation, useNavigate } from "react-router"
import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { Button } from "../ui/button"
import { supabase } from "../../lib/supabase"
import { withTenantPrefix } from "../../lib/utils"
import { UserCircle, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { AcessoRestritoModal } from "./AcessoRestritoModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"

export function PublicHeader() {
  const { tenant } = useTenantStore()
  const { user, perfil } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [accessSlug, setAccessSlug] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tenantSlug = tenant?.slug
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    const fullPath = withTenantPrefix(path, tenantSlug)
    return location.pathname === fullPath
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  // Iniciais para o avatar fallback
  const iniciais = perfil?.nome
    ? perfil.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase()

  const navLinks = tenant ? [
    { label: "Início", path: "/" },
    { label: "Comunicados", path: "/portal/comunicados" },
    { label: "Guia", path: "/portal/guia" },
    { label: "Vantagens", path: "/portal/clube", sublabel: tenant?.nome || "" },
    { label: "Eventos", path: "/portal/eventos" },
    { label: "Galeria", path: "/portal/galeria" },
    { label: "Documentos", path: "/portal/arquivos" },
    { label: "FAQ", path: "/portal/faq" },
  ] : [
    { label: "Início", path: "/" },
    { label: "Sobre", path: "/#sobre" },
    { label: "Funcionalidades", path: "/#features" },
    { label: "Contato", path: "/#contato" },
  ]

  const handleAccessCondo = () => {
    const slug = accessSlug.trim().toLowerCase()
    if (!slug) return
    setAccessOpen(false)
    setMobileMenuOpen(false)
    setAccessSlug("")
    navigate(`/${slug}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1a2e25] text-white shadow-lg border-b border-white/5">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Nome do Condomínio */}
        <div className="flex items-center gap-3">
          <Link to={withTenantPrefix("/", tenantSlug)} className="flex items-center gap-2 group">
            {tenant?.logo_url ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C5D932] p-1 shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-xs font-black text-[#1a2e25] uppercase leading-none text-center">
                  {tenant?.nome?.split(' ').map(w => w[0]).join('').substring(0, 2) || "CB"}
                </span>
              </div>
            )}
            <span className="font-bold text-lg hidden sm:block tracking-tight group-hover:text-[#C5D932] transition-colors">
              {tenant?.nome || "Condomínio Smart"}
            </span>
          </Link>
        </div>

        {/* Nav Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={withTenantPrefix(link.path, tenantSlug)}
              className={`px-4 py-2 text-sm font-bold transition-all hover:text-[#C5D932] ${
                isActive(link.path) ? "text-[#C5D932]" : "text-white/90"
              }`}
            >
              <span className="leading-none whitespace-nowrap">{link.label}</span>
              {"sublabel" in link && link.sublabel ? (
                <span className="block text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mt-1 max-w-[120px] truncate">
                  {link.sublabel}
                </span>
              ) : null}
            </Link>
          ))}
          
          <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors pl-1 pr-3 py-1 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#C5D932]/30 bg-white/20 flex items-center justify-center shrink-0">
                      {perfil?.foto_url ? (
                        <img src={perfil.foto_url} alt={perfil.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{iniciais}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-none max-w-[160px]">
                      <span className="text-xs font-black text-white truncate">
                        {perfil?.nome || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">
                        {perfil?.role === 'super_admin' ? 'Master' : perfil?.role === 'sindico' ? 'Síndico' : 'Morador'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-4 border-b border-slate-50">
                        <p className="text-sm font-black text-slate-800 truncate">{perfil?.nome || user.email?.split('@')[0]}</p>
                        <p className="text-xs text-slate-400 font-bold truncate mt-1">{user.email}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-2">
                          {perfil?.role === 'super_admin' ? 'Master' : perfil?.role === 'sindico' ? 'Síndico' : perfil?.role === 'zelador' ? 'Zelador' : 'Morador'}
                        </p>
                      </div>

                      <div className="py-2">
                        {(perfil?.role === 'sindico' || perfil?.role === 'super_admin' || perfil?.role === 'zelador') ? (
                          <Link
                            to={withTenantPrefix("/painel", tenantSlug)}
                            className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" /> Painel Interno
                          </Link>
                        ) : (
                          <Link
                            to={withTenantPrefix("/onboarding", tenantSlug)}
                            className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <UserCircle className="w-4 h-4" /> Meu Cadastro
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors px-3 py-2 border border-white/10 text-xs font-black uppercase tracking-wider text-white/90"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            ) : (
              tenant ? (
                <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug}>
                  <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-6 py-2 rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-lime-900/20">
                    Acesse seu portal
                  </Button>
                </AcessoRestritoModal>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Já é cliente?</span>
                    <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-5 py-2 rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-lime-900/20">
                          Acessar condomínio
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle className="text-base font-black uppercase tracking-widest">
                          Acessar meu condomínio
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="text-sm font-medium text-slate-600">
                          Digite o slug do seu condomínio para abrir o portal.
                        </div>
                        <Input
                          value={accessSlug}
                          onChange={(e) => setAccessSlug(e.target.value)}
                          placeholder="ex: colina-belvedere"
                          autoComplete="off"
                          inputMode="text"
                          aria-label="Slug do condomínio"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAccessCondo()
                          }}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setAccessOpen(false)}
                            type="button"
                          >
                            Cancelar
                          </Button>
                          <Button className="rounded-xl font-black" onClick={handleAccessCondo} type="button">
                            Abrir portal
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>
              )
            )}
          </div>
        </nav>

        {!tenant ? (
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Já é cliente?</span>
              <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
                    Acessar
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle className="text-base font-black uppercase tracking-widest">
                    Acessar meu condomínio
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="text-sm font-medium text-slate-600">
                    Digite o slug do seu condomínio para abrir o portal.
                  </div>
                  <Input
                    value={accessSlug}
                    onChange={(e) => setAccessSlug(e.target.value)}
                    placeholder="ex: colina-belvedere"
                    autoComplete="off"
                    inputMode="text"
                    aria-label="Slug do condomínio"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAccessCondo()
                    }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => setAccessOpen(false)} type="button">
                      Cancelar
                    </Button>
                    <Button className="rounded-xl font-black" onClick={handleAccessCondo} type="button">
                      Abrir portal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            <button className="text-white p-2 rounded-xl hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(true)} type="button" aria-label="Abrir menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* Mobile Menu */}
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogTrigger asChild>
            <button className="md:hidden text-white p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ display: tenant ? undefined : "none" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-5 bg-[#1a2e25] text-white">
              <DialogTitle className="text-base font-black uppercase tracking-widest">
                Menu do Portal
              </DialogTitle>
              <div className="text-xs font-bold text-white/70 mt-1">
                {tenant?.nome || "Condomínio Smart"}
              </div>
            </DialogHeader>

            <div className="px-3 py-4 bg-white">
              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={withTenantPrefix(link.path, tenantSlug)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-2xl px-4 py-4 font-black uppercase tracking-widest text-xs transition-colors ${
                      isActive(link.path)
                        ? "bg-[#C5D932]/20 text-[#1a2e25]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {link.label}
                        {"sublabel" in link && link.sublabel ? (
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {link.sublabel}
                          </div>
                        ) : null}
                      </div>
                      <span className="text-slate-300">›</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 px-3">
                {user ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C5D932]/30 bg-white flex items-center justify-center shrink-0">
                        {perfil?.foto_url ? (
                          <img src={perfil.foto_url} alt={perfil.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-slate-700">{iniciais}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-800 truncate">
                          {perfil?.nome || user.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-slate-500 font-bold truncate">{user.email}</div>
                        <div className="mt-2 inline-flex items-center rounded-full bg-[#C5D932]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#1a2e25]">
                          {perfil?.role === 'super_admin' ? 'Master' : perfil?.role === 'sindico' ? 'Síndico' : 'Morador'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {(perfil?.role === 'sindico' || perfil?.role === 'super_admin' || perfil?.role === 'zelador') ? (
                        <Link
                          to={withTenantPrefix("/painel", tenantSlug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full rounded-2xl bg-slate-900 px-6 py-4 text-center font-black uppercase tracking-widest text-xs text-white"
                        >
                          Acessar Painel
                        </Link>
                      ) : (
                        <Link
                          to={withTenantPrefix("/onboarding", tenantSlug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full rounded-2xl bg-white px-6 py-4 text-center font-black uppercase tracking-widest text-xs text-slate-700 border border-slate-200"
                        >
                          Meu Cadastro
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full rounded-2xl bg-red-50 px-6 py-4 text-center font-black uppercase tracking-widest text-xs text-red-600 border border-red-100"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                ) : (
                  tenant ? (
                    <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug}>
                      <Button
                        className="w-full bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black py-6 rounded-2xl text-xs uppercase tracking-widest"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Acesse seu portal
                      </Button>
                    </AcessoRestritoModal>
                  ) : null
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
