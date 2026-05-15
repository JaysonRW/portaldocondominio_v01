import { create } from "zustand"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  perfil: any | null | undefined // undefined = ainda carregando; null = sem perfil; objeto = carregado
  isLoading: boolean
  isPerfilLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setPerfil: (perfil: any | null) => void
  setIsLoading: (isLoading: boolean) => void
  setIsPerfilLoading: (loading: boolean) => void
  getClaim: (claim: string) => any
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  perfil: undefined, // undefined = ainda não carregado
  isLoading: true,
  isPerfilLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setPerfil: (perfil) => set({ perfil, isPerfilLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsPerfilLoading: (isPerfilLoading) => set({ isPerfilLoading }),
  getClaim: (claim) => {
    const { user } = get()
    return user?.app_metadata?.[claim]
  }
}))
