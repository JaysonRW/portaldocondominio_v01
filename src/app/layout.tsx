import { Outlet, useLocation, useParams, Link } from "react-router"
import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { queryClient } from "../lib/queryClient"
import { supabase } from "../lib/supabase"
import { useTenantStore } from "../stores/tenantStore"
import { useAuthStore } from "../stores/authStore"
import { BottomNav } from "../components/layout/BottomNav"
import { Toaster } from "../components/ui/sonner"

function Footer() {
  return (
    <footer className="w-full py-8 border-t border-slate-100 bg-white">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          SaaS Condomínio Smart &copy; 2026
        </p>
        
        <div className="flex items-center gap-6">
          <a 
            href="https://wa.me/5541995343245?text=novo%20pedido%20de%20suporte%20para%20portal" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            Falar com suporte
          </a>
          <Link 
            to="/master" 
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
          >
            Acesso Master aqui
          </Link>
        </div>
      </div>
    </footer>
  )
}

function clamp(number: number, min: number, max: number) {
  return Math.min(Math.max(number, min), max)
}

function hexToHslTriplet(hex: string): string | null {
  const normalized = hex.trim()
  const match = /^#?([0-9a-fA-F]{6})$/.exec(normalized)
  if (!match) return null

  const intValue = parseInt(match[1], 16)
  const red = (intValue >> 16) & 255
  const green = (intValue >> 8) & 255
  const blue = intValue & 255

  const r = red / 255
  const g = green / 255
  const b = blue / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  const hue = Math.round(clamp(h, 0, 360))
  const sat = Math.round(clamp(s * 100, 0, 100))
  const light = Math.round(clamp(l * 100, 0, 100))

  // Matches src/index.css: "--primary: 153 18% 30%;"
  return `${hue} ${sat}% ${light}%`
}

function AppShellManager({ children }: { children: React.ReactNode }) {
  const { setTenant, setIsLoading } = useTenantStore()
  const { user, setSession, setUser, setIsLoading: setAuthLoading } = useAuthStore()

  // 1. Buscar Perfil da Tabela Public.Perfis
  const { setPerfil } = useAuthStore()
  const { data: profileData, isSuccess: isPerfilSuccess } = useQuery({
    queryKey: ['meu_perfil_shell', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = "No rows found"
      return data || null
    },
    enabled: !!user?.id
  })

  useEffect(() => {
    if (!user) {
      // Usuário deslogou → resetar perfil para null (não undefined)
      setPerfil(null)
      return
    }
    if (isPerfilSuccess) {
      // Query completou → atualizar perfil (pode ser null se não tiver registro)
      setPerfil(profileData ?? null)
    }
    // Enquanto isPerfilSuccess=false e user existe, perfil fica undefined (aguardando)
  }, [user, profileData, isPerfilSuccess, setPerfil])

  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)
  const firstPart = pathParts[0]

  // 1. Lógica do Tenant Baseada em Hostname ou Path (localhost)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
  const hostingDomains = ['vercel.app', 'netlify.app', 'pages.dev']
  const isHostingDomain = hostingDomains.some((domain) => hostname.endsWith(domain))
  const hasSub = hostname.includes('.') && !isLocalhost && !isHostingDomain
  const slugFromHost = hasSub ? hostname.split('.')[0] : null
  
  // Lista de slugs reservados que não devem ser tratados como condomínios
  const reservedSlugs = ['painel', 'painel-master', 'login', 'join', 'register', 'auth', 'master', 'reset-password', 'set-password', 'onboarding', 'portal', 'zelador']
  const portalPages = ['comunicados', 'encomendas', 'clube', 'guia', 'eventos', 'galeria', 'arquivos', 'faq']
  const tenantSecondSegments = ['login', 'join', 'reset-password', 'set-password', 'painel', 'zelador', 'onboarding', 'auth']

  const slugFromPath = (() => {
    if (!isLocalhost && !isHostingDomain) return null
    if (!firstPart || reservedSlugs.includes(firstPart) || firstPart === 'dev') return null

    const secondPart = pathParts[1]
    const thirdPart = pathParts[2]

    if (secondPart === 'portal' && thirdPart && portalPages.includes(thirdPart)) return firstPart
    if (secondPart && tenantSecondSegments.includes(secondPart)) return firstPart
    if (!secondPart) return firstPart

    return null
  })()

  const slug = slugFromHost ?? slugFromPath


  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ["tenant", slug, profileData?.condominio_id],
    queryFn: async () => {
      // 1. Tenta buscar pelo slug da URL se existir
      if (slug) {
        const { data, error } = await supabase
          .from('condominios')
          .select('*')
          .eq('slug', slug)
          .single()
        if (!error && data) return data
      }
      
      // 2. Fallback: Tenta buscar pelo condominio_id do perfil do usuário logado
      if (profileData?.condominio_id) {
        const { data, error } = await supabase
          .from('condominios')
          .select('*')
          .eq('id', profileData.condominio_id)
          .single()
        if (!error && data) return data
      }
      
      return null
    },
    staleTime: 1000 * 60 * 60, // 1 hr
  })

  // 2. Injetar Tenant e CSS Variables
  useEffect(() => {
    if (tenant) {
      setTenant(tenant)
      setIsLoading(false)
      
      // Aplicar dinamicamente cores do tenant
      const primaryHsl = tenant.cor_primaria ? hexToHslTriplet(tenant.cor_primaria) : null
      const secondaryHsl = tenant.cor_secundaria ? hexToHslTriplet(tenant.cor_secundaria) : null

      if (primaryHsl) {
        document.documentElement.style.setProperty("--primary", primaryHsl)
        document.documentElement.style.setProperty("--ring", primaryHsl)
      }
      if (secondaryHsl) {
        document.documentElement.style.setProperty("--secondary", secondaryHsl)
      }
    } else {
      setTenant(null)
      setIsLoading(false)
    }
  }, [tenant, setTenant, setIsLoading])

  // 3. Setup de Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setUser, setAuthLoading])



  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-muted-foreground">Carregando portal...</p>
      </div>
    )
  }

  const isMasterAdmin = user?.email === "propagoumkd@gmail.com" || 
                        profileData?.role === 'super_admin' || 
                        user?.app_metadata?.role === 'super_admin'
  const isSindico = profileData?.role === 'sindico' || user?.app_metadata?.role === 'sindico'
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname
  const isAuthRoute = currentPath.includes('/login') || currentPath.includes('/auth/callback')
  const isInternalPath = currentPath.includes('/painel') || 
                        currentPath.includes('/moradores') ||
                        currentPath.includes('/master')

  // Se não há slug e não é uma rota de auth/master, mostra a Landing Page do SaaS
  if (!slug && !isAuthRoute && !currentPath.includes('/master')) {
    return children // Deixa o React Router renderizar a index (landing.tsx)
  }

  // Se há um slug mas o condomínio não foi encontrado (e não é o admin master)
  if (slug && !tenant && !isMasterAdmin && !isAuthRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white p-12 rounded-[40px] shadow-xl shadow-slate-200/50 max-w-lg border border-slate-100">
           <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Condomínio não encontrado</h1>
           <p className="text-slate-500 font-medium leading-relaxed mb-8">
             A URL <strong>{slug}</strong> não corresponde a nenhum condomínio cadastrado em nossa plataforma.
           </p>
           <Link 
             to="/" 
             className="inline-flex items-center justify-center h-12 px-6 rounded-2xl bg-[#1a2e25] text-white font-bold hover:bg-[#1a2e25]/90 transition-all shadow-lg shadow-emerald-900/20"
           >
             Voltar ao início
           </Link>
        </div>
      </div>
    )
  }

  if (tenant && !tenant.ativo && !isMasterAdmin && !isAuthRoute && !(isSindico && isInternalPath)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white p-12 rounded-[40px] shadow-xl shadow-slate-200/50 max-w-lg border border-slate-100">
           <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Portal Temporariamente Indisponível</h1>
           <p className="text-slate-500 font-medium leading-relaxed mb-8">
             O acesso ao portal do <strong>{tenant.nome}</strong> foi suspenso pela administração. 
             Entre em contato com o síndico para mais informações.
           </p>
           
           <div className="flex flex-col gap-3">
              <a 
                href={slugFromPath ? `/${slugFromPath}/login` : '/login'} 
                className="inline-flex items-center justify-center h-12 px-6 rounded-2xl bg-[#1a2e25] text-white font-bold hover:bg-[#1a2e25]/90 transition-all shadow-lg shadow-emerald-900/20"
              >
                Acesso Master / Administrativo
              </a>
           </div>

           <div className="h-px bg-slate-100 my-8" />
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
             SaaS Condomínio Smart &copy; 2026
           </p>
        </div>
      </div>
    )
  }

  return children
}

export default function AppLayout() {
  const location = useLocation()
  const params = useParams()
  const { user } = useAuthStore()
  const tenantSlug = typeof params.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : null
  const normalizedPath = tenantSlug ? (location.pathname.replace(new RegExp(`^/${tenantSlug}`), "") || "/") : location.pathname
  
  const isPublicRoute = [
    "/",
    "/login",
    "/auth/callback",
    "/register",
    "/join",
    "/comunicados",
    "/clube",
    "/eventos",
    "/galeria",
    "/documentos",
    "/faq",
  ].includes(normalizedPath)

  const isAuthRoute = [
    "/login",
    "/auth/callback",
    "/register",
    "/join",
    "/reset-password",
    "/set-password",
  ].includes(normalizedPath)
  
  return (
    <QueryClientProvider client={queryClient}>
      <AppShellManager>
        <div className="flex min-h-screen w-full flex-col bg-[#f8fafc]">
          <main className="flex-1">
            <Outlet />
          </main>
          
          <Footer />
          
          {/* Bottom Navigation for Mobile (exibido em rotas privadas OU quando o usuário estiver autenticado, exceto telas de login/cadastro) */}
          {!isAuthRoute && (!isPublicRoute || user) && <BottomNav />}
        </div>
        <Toaster />
      </AppShellManager>
    </QueryClientProvider>
  )
}
