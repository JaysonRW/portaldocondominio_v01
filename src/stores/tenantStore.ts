import { create } from "zustand"

interface Tenant {
  id: string
  slug: string
  nome: string
  logo_url?: string
  capa_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  plano?: string
  endereco?: string
  descricao_curta?: string
  app_oficial_nome?: string
  app_oficial_url?: string
  whatsapp_contato?: string
  modulos_ativos?: any
  ativo?: boolean
  criado_em?: string
}

interface TenantState {
  tenant: Tenant | null
  isMasterMode: boolean
  isLoading: boolean
  setTenant: (tenant: Tenant | null) => void
  setIsMasterMode: (isMasterMode: boolean) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  isMasterMode: false,
  isLoading: true,
  setTenant: (tenant) => set({ tenant }),
  setIsMasterMode: (isMasterMode) => set({ isMasterMode }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
