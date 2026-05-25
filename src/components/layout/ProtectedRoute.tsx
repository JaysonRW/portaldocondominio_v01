import { Navigate, Outlet, useLocation, useParams } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { withTenantPrefix } from "../../lib/utils"

export default function ProtectedRoute() {
  const { user, perfil, isLoading } = useAuthStore()
  const location = useLocation()
  const params = useParams()
  const tenantSlug = typeof params.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : null

  // 1. Aguarda auth E perfil carregarem antes de decidir o redirect
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-muted-foreground">Verificando sessão...</p>
      </div>
    )
  }

  // 2. Não logado -> Login
  if (!user) {
    return <Navigate to={withTenantPrefix("/login", tenantSlug)} replace />
  }

  // 3. Usuário logado mas perfil ainda não carregado -> Aguarda
  if (perfil === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  const MASTER_EMAIL = "propagoumkd@gmail.com"
  const userRole = perfil?.role || user?.app_metadata?.role || user?.user_metadata?.role || 'morador'
  const isMasterAdmin = userRole === 'super_admin' || user?.email === MASTER_EMAIL
  const isSindico = userRole === "sindico"
  const isSubsindico = userRole === "subsindico"
  const isZelador = userRole === "zelador"
  const isMorador = userRole === "morador"
  const isFornecedor = userRole === "fornecedor"
  const isPortaria = userRole === "portaria"
  const isPrimeiroAcesso = perfil?.primeiro_acesso === true
  
  const normalizedPath = tenantSlug ? (location.pathname.replace(new RegExp(`^/${tenantSlug}`), "") || "/") : location.pathname
  const isOnboardingPage = normalizedPath === "/onboarding"
  const isSetPasswordPage = normalizedPath === "/set-password" || normalizedPath === "/reset-password"
  const isAppPath = normalizedPath.startsWith("/app")
  const isPainelPath = normalizedPath.startsWith("/painel")
  const isPainelMasterPath = normalizedPath.startsWith("/painel-master")

  // 1. Caso Primeiro Acesso: Forçar definição de senha
  if (isPrimeiroAcesso && !isSetPasswordPage && !isMasterAdmin) {
    return <Navigate to={withTenantPrefix("/set-password", tenantSlug)} replace />
  }

  // 4. Caso MASTER: Sempre entra — nunca vai para onboarding ou aprovação
  if (isMasterAdmin) {
    // Evita cair em painéis do tenant (ex.: /painel) ao acessar URLs com slug.
    // MASTER sempre navega pelo painel master.
    if (!normalizedPath.startsWith("/painel-master")) {
      return <Navigate to="/painel-master" replace />
    }
    return <Outlet />
  }

  // 5. Perfil nulo (não tem registro em perfis ainda) — vai para onboarding
  if (!perfil) {
    if (userRole !== 'morador') {
      if (userRole === 'portaria') return <Navigate to={withTenantPrefix("/portaria", tenantSlug)} replace />
      if (userRole === 'zelador') return <Navigate to={withTenantPrefix("/zelador", tenantSlug)} replace />
      return <Navigate to={withTenantPrefix("/painel", tenantSlug)} replace />
    }
    if (!isOnboardingPage) return <Navigate to={withTenantPrefix("/onboarding", tenantSlug)} replace />
    return <Outlet />
  }

  // 6. Cadastro Incompleto (sem unidade) -> Onboarding (Apenas para moradores)
  const isProfileIncomplete = isMorador && !perfil?.unidade
  if (isProfileIncomplete && !isOnboardingPage) {
    return <Navigate to={withTenantPrefix("/onboarding", tenantSlug)} replace />
  }

  // 7. Restrições de Acesso por Role
  if (isMorador && (isPainelPath || isPainelMasterPath || isAppPath)) {
    return <Navigate to={withTenantPrefix("/portal/comunicados", tenantSlug)} replace />
  }

  if (isPortaria && (isPainelPath || isAppPath || isPainelMasterPath || normalizedPath.startsWith("/painel-fornecedor"))) {
    return <Navigate to={withTenantPrefix("/portaria", tenantSlug)} replace />
  }

  if ((isSindico || isSubsindico || isZelador) && (isAppPath || isPainelMasterPath)) {
    if (normalizedPath === "/") {
      if (isZelador) return <Navigate to={withTenantPrefix("/zelador", tenantSlug)} replace />
      return <Navigate to={withTenantPrefix("/painel", tenantSlug)} replace />
    }
    // Opcional: Permitir síndico ver a área do morador
    return <Outlet />
  }

  if (isFornecedor && !normalizedPath.startsWith("/painel-fornecedor")) {
    return <Navigate to="/painel-fornecedor" replace />
  }

  // Redirecionamento de "/" baseado na role
  if (normalizedPath === "/") {
    if (isMorador) return <Navigate to={withTenantPrefix("/portal/comunicados", tenantSlug)} replace />
    if (isZelador) return <Navigate to={withTenantPrefix("/zelador", tenantSlug)} replace />
    if (isPortaria) return <Navigate to={withTenantPrefix("/portaria", tenantSlug)} replace />
    if (isSindico || isSubsindico) return <Navigate to={withTenantPrefix("/painel", tenantSlug)} replace />
  }

  return <Outlet />
}
