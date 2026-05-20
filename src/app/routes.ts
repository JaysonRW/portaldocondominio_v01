import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
  // Layout raiz que gerencia o Tenant e Auth
  layout("layout.tsx", [
    
    // 1. Rotas Globais Estáticas (Sem Slug)
    route("login", "(auth)/login.tsx", { id: "login-global" }),
    route("auth/callback", "(auth)/callback.tsx", { id: "callback-global" }),
    route("master", "(auth)/master-gateway.tsx", { id: "master-gateway" }),
    route("reset-password", "(auth)/reset-password.tsx", { id: "reset-password-global" }),
    route("set-password", "(auth)/reset-password.tsx", { id: "set-password-global" }),

    // 1.1. Rotas Globais com Slug (Multi-tenant)
    route(":tenantSlug/login", "(auth)/login.tsx", { id: "login-tenant" }),
    route(":tenantSlug/auth/callback", "(auth)/callback.tsx", { id: "callback-tenant" }),
    route(":tenantSlug/reset-password", "(auth)/reset-password.tsx", { id: "reset-password-tenant" }),
    route(":tenantSlug/set-password", "(auth)/reset-password.tsx", { id: "set-password-tenant" }),
    
    // 2. Rotas Administrativas (Com e Sem Slug)
    layout("../components/layout/ProtectedRoute.tsx", [
      // Painel Master — layout próprio (menu enxuto, sem sidebar do síndico)
      layout("../components/layout/MasterLayout.tsx", [
        route("painel-master", "(dashboard)/master-dashboard.tsx", { id: "painel-master" }),
      ]),

      layout("../components/layout/DashboardLayout.tsx", [
        
        // Versão com Slug (Multi-tenant)
        route(":tenantSlug/painel/servicos", "(dashboard)/servicos/index.tsx", { id: "tenant-admin-servicos" }),
        route(":tenantSlug/painel/servicos/nova", "(dashboard)/servicos/nova.tsx", { id: "tenant-admin-servicos-nova" }),
        route(":tenantSlug/painel/servicos/agenda", "(dashboard)/servicos/agenda.tsx", { id: "tenant-admin-servicos-agenda" }),
        route(":tenantSlug/painel/servicos/relatorios", "(dashboard)/servicos/relatorios.tsx", { id: "tenant-admin-servicos-relatorios" }),
        route(":tenantSlug/painel/servicos/:id", "(dashboard)/servicos/[id].tsx", { id: "tenant-admin-servicos-detalhe" }),
        route(":tenantSlug/painel/zeladores", "(dashboard)/zeladores/index.tsx", { id: "tenant-admin-zeladores" }),
        route(":tenantSlug/painel/portarias", "(dashboard)/portaria/index.tsx", { id: "tenant-admin-portaria" }),
        route(":tenantSlug/painel/moradores", "(dashboard)/moradores/index.tsx", { id: "tenant-admin-moradores" }),
        route(":tenantSlug/painel/unidades", "(dashboard)/unidades/index.tsx", { id: "tenant-admin-unidades" }),
        route(":tenantSlug/painel/comunicados", "(dashboard)/avisos/index.tsx", { id: "tenant-admin-comunicados" }),
        route(":tenantSlug/painel/assembleias", "(dashboard)/assembleias/index.tsx", { id: "tenant-admin-assembleias" }),
        route(":tenantSlug/painel/eventos", "(dashboard)/eventos/index.tsx", { id: "tenant-admin-eventos" }),
        route(":tenantSlug/painel/galeria", "(dashboard)/galeria/index.tsx", { id: "tenant-admin-galeria" }),
        route(":tenantSlug/painel/clube", "(dashboard)/clube/index.tsx", { id: "tenant-admin-clube" }),
        route(":tenantSlug/painel/guia", "(dashboard)/guia-morador/index.tsx", { id: "tenant-admin-guia" }),
        route(":tenantSlug/painel/faq", "(dashboard)/faq/index.tsx", { id: "tenant-admin-faq" }),
        route(":tenantSlug/painel/arquivos", "(dashboard)/documentos/index.tsx", { id: "tenant-admin-docs" }),
        route(":tenantSlug/painel/canal-morador", "(dashboard)/canal-morador/index.tsx", { id: "tenant-admin-canal-morador" }),
        route(":tenantSlug/painel/configuracoes", "(dashboard)/configuracoes/index.tsx", { id: "tenant-admin-settings" }),
        route(":tenantSlug/painel", "(dashboard)/home.tsx", { id: "tenant-admin-home" }),
        route(":tenantSlug/zelador", "(zelador)/index.tsx", { id: "tenant-zelador-home" }),
        route(":tenantSlug/portaria", "(portaria)/index.tsx", { id: "tenant-portaria-home" }),

        // Versão sem Slug (Domínios customizados / Localhost sem slug)
        route("painel/servicos", "(dashboard)/servicos/index.tsx", { id: "admin-servicos" }),
        route("painel/servicos/nova", "(dashboard)/servicos/nova.tsx", { id: "admin-servicos-nova" }),
        route("painel/servicos/agenda", "(dashboard)/servicos/agenda.tsx", { id: "admin-servicos-agenda" }),
        route("painel/servicos/relatorios", "(dashboard)/servicos/relatorios.tsx", { id: "admin-servicos-relatorios" }),
        route("painel/servicos/:id", "(dashboard)/servicos/[id].tsx", { id: "admin-servicos-detalhe" }),
        route("painel/zeladores", "(dashboard)/zeladores/index.tsx", { id: "admin-zeladores" }),
        route("painel/portarias", "(dashboard)/portaria/index.tsx", { id: "admin-portaria" }),
        route("painel/moradores", "(dashboard)/moradores/index.tsx", { id: "admin-moradores" }),
        route("painel/unidades", "(dashboard)/unidades/index.tsx", { id: "admin-unidades" }),
        route("painel/comunicados", "(dashboard)/avisos/index.tsx", { id: "admin-comunicados" }),
        route("painel/assembleias", "(dashboard)/assembleias/index.tsx", { id: "admin-assembleias" }),
        route("painel/eventos", "(dashboard)/eventos/index.tsx", { id: "admin-eventos" }),
        route("painel/galeria", "(dashboard)/galeria/index.tsx", { id: "admin-galeria" }),
        route("painel/clube", "(dashboard)/clube/index.tsx", { id: "admin-clube" }),
        route("painel/guia", "(dashboard)/guia-morador/index.tsx", { id: "admin-guia" }),
        route("painel/faq", "(dashboard)/faq/index.tsx", { id: "admin-faq" }),
        route("painel/arquivos", "(dashboard)/documentos/index.tsx", { id: "admin-docs" }),
        route("painel/canal-morador", "(dashboard)/canal-morador/index.tsx", { id: "admin-canal-morador" }),
        route("painel/configuracoes", "(dashboard)/configuracoes/index.tsx", { id: "admin-settings" }),
        route("painel", "(dashboard)/home.tsx", { id: "admin-home" }),
        route("zelador", "(zelador)/index.tsx", { id: "zelador-home" }),
        route("portaria", "(portaria)/index.tsx", { id: "portaria-home" }),
      ]),
      
      // Onboarding
      route(":tenantSlug/onboarding", "(dashboard)/onboarding/index.tsx", { id: "tenant-onboarding" }),
      route("onboarding", "(dashboard)/onboarding/index.tsx", { id: "onboarding" }),

      // 3. Rotas Privadas do Portal (Requer Autenticação)
      route(":tenantSlug/portal/comunicados", "(public)/comunicados.tsx", { id: "tenant-public-comunicados" }),
      route(":tenantSlug/portal/encomendas", "(public)/encomendas.tsx", { id: "tenant-public-encomendas" }),
      route(":tenantSlug/portal/clube", "(public)/clube.tsx", { id: "tenant-public-clube" }),
      route(":tenantSlug/portal/guia", "(public)/guia.tsx", { id: "tenant-public-guia" }),
      route(":tenantSlug/portal/eventos", "(public)/eventos.tsx", { id: "tenant-public-eventos" }),
      route(":tenantSlug/portal/galeria", "(public)/galeria.tsx", { id: "tenant-public-galeria" }),
      route(":tenantSlug/portal/arquivos", "(public)/documentos.tsx", { id: "tenant-public-docs" }),
      route(":tenantSlug/portal/faq", "(public)/faq.tsx", { id: "tenant-public-faq" }),
      
      route("portal/comunicados", "(public)/comunicados.tsx", { id: "public-comunicados" }),
      route("portal/encomendas", "(public)/encomendas.tsx", { id: "public-encomendas" }),
      route("portal/clube", "(public)/clube.tsx", { id: "public-clube" }),
      route("portal/guia", "(public)/guia.tsx", { id: "public-guia" }),
      route("portal/eventos", "(public)/eventos.tsx", { id: "public-eventos" }),
      route("portal/galeria", "(public)/galeria.tsx", { id: "public-galeria" }),
      route("portal/arquivos", "(public)/documentos.tsx", { id: "public-docs" }),
      route("portal/faq", "(public)/faq.tsx", { id: "public-faq" }),
    ]),

    // 4. Landing Pages (Catch-all)
    route(":tenantSlug/login", "(auth)/login.tsx", { id: "tenant-login" }),
    route("join", "(public)/join.tsx", { id: "global-join" }),
    route(":tenantSlug/join", "(public)/join.tsx", { id: "tenant-join" }),
    route(":tenantSlug", "(public)/landing.tsx", { id: "tenant-landing" }),
    
    index("(public)/landing.tsx", { id: "global-landing" }),
  ]),
] satisfies RouteConfig;
