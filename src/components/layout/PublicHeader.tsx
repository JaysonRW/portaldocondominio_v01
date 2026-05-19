import { Link, useLocation, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { Button } from "../ui/button"
import { supabase } from "../../lib/supabase"
import { withTenantPrefix } from "../../lib/utils"
import { UserCircle, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { AcessoRestritoModal } from "./AcessoRestritoModal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"


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

  const { data: condominiosList, isLoading: isLoadingCondominios } = useQuery({
    queryKey: ['condominios_lista_publica'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('condominios')
        .select('id, nome, slug')
        .eq('ativo', true)
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

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

  const userRole = perfil?.role || user?.app_metadata?.role || user?.user_metadata?.role || 'morador'

  // Iniciais para o avatar fallback
  const iniciais = perfil?.nome
    ? perfil.nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase()

  const navLinks = tenant ? [
    { label: "Início", path: "/" },
    { label: "Comunicados", path: "/portal/comunicados" },
    ...(user ? [{ label: "Encomendas", path: "/portal/encomendas" }] : []),
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
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 flex justify-center transition-all duration-300">
      <div className="w-full max-w-7xl flex h-[72px] items-center justify-between px-4 sm:px-6 rounded-2xl bg-[#1a2e25]/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        {/* Logo / Nome do Condomínio */}
        <div className="flex items-center gap-3">
          <Link to={withTenantPrefix("/", tenantSlug)} className="flex items-center gap-3 group">
            {tenant?.logo_url ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5D932] to-[#a3b526] p-1 shadow-md group-hover:scale-105 transition-transform group-hover:shadow-[#C5D932]/20">
                <span className="text-xs font-black text-[#1a2e25] uppercase leading-none text-center">
                  {tenant?.nome?.split(' ').map(w => w[0]).join('').substring(0, 2) || "CB"}
                </span>
              </div>
            )}
            <span className="font-black text-lg hidden sm:block tracking-tight text-white group-hover:text-[#C5D932] transition-colors">
              {tenant?.nome || "Condomínio Smart"}
            </span>
          </Link>
        </div>

        {/* Nav Desktop */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={withTenantPrefix(link.path, tenantSlug)}
                className={`relative px-4 py-2 text-sm font-bold transition-all rounded-full group ${
                  isActive(link.path) 
                    ? "text-[#1a2e25] bg-[#C5D932] shadow-sm" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="leading-none whitespace-nowrap relative z-10">{link.label}</span>
                {"sublabel" in link && link.sublabel ? (
                  <span className={`block text-[10px] font-bold uppercase tracking-widest leading-none mt-1 max-w-[120px] truncate relative z-10 ${isActive(link.path) ? 'text-[#1a2e25]/60' : 'text-white/40'}`}>
                    {link.sublabel}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          
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
                        {userRole === 'super_admin' ? 'Master' : userRole === 'sindico' ? 'Síndico' : userRole === 'subsindico' ? 'Subsíndico' : userRole === 'zelador' ? 'Zelador' : userRole === 'portaria' ? 'Portaria' : 'Morador'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-black text-slate-800 truncate">{perfil?.nome || user.email?.split('@')[0]}</p>
                        <p className="text-xs text-slate-500 font-bold truncate mt-1">{user.email}</p>
                        <p className="text-[10px] text-[#8ea31f] uppercase tracking-widest font-black mt-2 bg-[#C5D932]/10 inline-block px-2 py-0.5 rounded-md">
                          {userRole === 'super_admin' ? 'Master' : userRole === 'sindico' ? 'Síndico' : userRole === 'zelador' ? 'Zelador' : userRole === 'portaria' ? 'Portaria' : 'Morador'}
                        </p>
                      </div>

                      <div className="py-2">
                        {userRole === 'portaria' ? (
                          <Link
                            to={withTenantPrefix("/portaria", tenantSlug)}
                            className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" /> Painel da Portaria
                          </Link>
                        ) : (userRole === 'sindico' || userRole === 'super_admin' || userRole === 'zelador') ? (
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
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors px-3 py-2 border border-white/10 text-xs font-black uppercase tracking-wider text-white/90"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            ) : (
              tenant ? (
                <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug}>
                  <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-6 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#C5D932]/20 hover:scale-105 transition-all">
                    Acesse seu portal
                  </Button>
                </AcessoRestritoModal>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Já é cliente?</span>
                    <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#C5D932]/20 hover:scale-105 transition-all">
                          Acessar condomínio
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] bg-white/95 backdrop-blur-xl border-white/20">
                      <DialogHeader>
                        <DialogTitle className="text-base font-black uppercase tracking-widest text-slate-800">
                          Acessar meu condomínio
                        </DialogTitle>
                        <DialogDescription className="sr-only">Digite o slug para acessar seu condomínio</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="text-sm font-medium text-slate-500">
                          Selecione o seu condomínio para abrir o portal.
                        </div>
                        {isLoadingCondominios ? (
                          <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-slate-50 text-sm text-slate-500">
                            Carregando condomínios...
                          </div>
                        ) : (
                          <select
                            value={accessSlug}
                            onChange={(e) => setAccessSlug(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                            aria-label="Selecione o condomínio"
                          >
                            <option value="">Selecione o seu condomínio...</option>
                            {condominiosList?.map((c) => (
                              <option key={c.id} value={c.slug}>
                                {c.nome}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl font-bold"
                            onClick={() => setAccessOpen(false)}
                            type="button"
                          >
                            Cancelar
                          </Button>
                          <Button className="rounded-xl font-black bg-[#1a2e25] text-white hover:bg-[#2a4237]" onClick={handleAccessCondo} type="button">
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

        {/* Mobile Nav Elements */}
        {!tenant ? (
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Já é cliente?</span>
              <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#C5D932]/20">
                    Acessar
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] w-[90vw] mx-auto rounded-3xl bg-white/95 backdrop-blur-xl border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-base font-black uppercase tracking-widest text-slate-800">
                    Acessar meu condomínio
                  </DialogTitle>
                  <DialogDescription className="sr-only">Digite o slug para acessar seu condomínio</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="text-sm font-medium text-slate-500">
                    Selecione o seu condomínio para abrir o portal.
                  </div>
                  {isLoadingCondominios ? (
                    <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-slate-50 text-sm text-slate-500">
                      Carregando condomínios...
                    </div>
                  ) : (
                    <select
                      value={accessSlug}
                      onChange={(e) => setAccessSlug(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                      aria-label="Selecione o condomínio"
                    >
                      <option value="">Selecione o seu condomínio...</option>
                      {condominiosList?.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setAccessOpen(false)} type="button">
                      Cancelar
                    </Button>
                    <Button className="rounded-xl font-black bg-[#1a2e25] text-white hover:bg-[#2a4237]" onClick={handleAccessCondo} type="button">
                      Abrir portal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            <button className="text-white p-2 rounded-xl hover:bg-white/10 transition-colors bg-white/5 border border-white/10" onClick={() => setMobileMenuOpen(true)} type="button" aria-label="Abrir menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* Mobile Menu Trigger for Tenant */}
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogTrigger asChild>
            <button className="md:hidden text-white p-2 rounded-xl hover:bg-white/10 transition-colors bg-white/5 border border-white/10" style={{ display: tenant ? undefined : "none" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] p-0 w-[90vw] mx-auto rounded-3xl border-0 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="px-6 py-6 bg-[#1a2e25] text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e25] to-[#0a1410] opacity-90" />
              <div className="relative z-10 flex items-center gap-4">
                {tenant?.logo_url ? (
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm overflow-hidden shrink-0">
                    <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C5D932] to-[#a3b526] p-1 shadow-md flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-[#1a2e25] uppercase leading-none text-center">
                      {tenant?.nome?.split(' ').map(w => w[0]).join('').substring(0, 2) || "CB"}
                    </span>
                  </div>
                )}
                <div>
                  <DialogTitle className="text-base font-black uppercase tracking-widest text-white leading-tight">
                    Menu do Portal
                  </DialogTitle>
                  <DialogDescription className="sr-only">Navegação principal do portal</DialogDescription>
                  <div className="text-[11px] font-bold text-[#C5D932] mt-1 tracking-widest uppercase">
                    {tenant?.nome || "Condomínio Smart"}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="px-4 py-5 bg-slate-50/90 backdrop-blur-md">
              <div className="grid gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={withTenantPrefix(link.path, tenantSlug)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-2xl px-5 py-4 font-black uppercase tracking-widest text-xs transition-all shadow-sm ${
                      isActive(link.path)
                        ? "bg-[#C5D932] text-[#1a2e25] shadow-[#C5D932]/20"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {link.label}
                        {"sublabel" in link && link.sublabel ? (
                          <div className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${isActive(link.path) ? 'text-[#1a2e25]/60' : 'text-slate-400'}`}>
                            {link.sublabel}
                          </div>
                        ) : null}
                      </div>
                      <span className={isActive(link.path) ? "text-[#1a2e25]/30" : "text-slate-300"}>›</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                {user ? (
                  <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C5D932]/50 bg-slate-100 flex items-center justify-center shrink-0">
                        {perfil?.foto_url ? (
                          <img src={perfil.foto_url} alt={perfil.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-slate-700">{iniciais}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-800 truncate">
                          {perfil?.nome || user.email?.split('@')[0]}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold truncate mt-0.5">{user.email}</div>
                        <div className="mt-2 inline-flex items-center rounded-md bg-[#C5D932]/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#8ea31f]">
                          {userRole === 'super_admin' ? 'Master' : userRole === 'sindico' ? 'Síndico' : userRole === 'subsindico' ? 'Subsíndico' : userRole === 'zelador' ? 'Zelador' : userRole === 'portaria' ? 'Portaria' : 'Morador'}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {userRole === 'portaria' ? (
                        <Link
                          to={withTenantPrefix("/portaria", tenantSlug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#1a2e25] px-6 py-4 font-black uppercase tracking-widest text-xs text-white hover:bg-[#0a1410] transition-colors shadow-lg shadow-emerald-900/10"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Painel da Portaria
                        </Link>
                      ) : (userRole === 'sindico' || userRole === 'super_admin' || userRole === 'zelador') ? (
                        <Link
                          to={withTenantPrefix("/painel", tenantSlug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#1a2e25] px-6 py-4 font-black uppercase tracking-widest text-xs text-white hover:bg-[#0a1410] transition-colors shadow-lg shadow-emerald-900/10"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Acessar Painel
                        </Link>
                      ) : (
                        <Link
                          to={withTenantPrefix("/onboarding", tenantSlug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-100 px-6 py-4 font-black uppercase tracking-widest text-xs text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" /> Meu Cadastro
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-red-50/50 px-6 py-4 font-black uppercase tracking-widest text-xs text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  </div>
                ) : (
                  tenant ? (
                    <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug}>
                      <Button
                        className="w-full bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black py-6 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-[#C5D932]/20"
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
