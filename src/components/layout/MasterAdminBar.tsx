import { useTenantStore } from "../../stores/tenantStore"
import { useNavigate } from "react-router"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"
import { supabase } from "../../lib/supabase"
import { useQuery } from "@tanstack/react-query"

export function MasterAdminBar() {
  const { isMasterMode, setIsMasterMode, setTenant, tenant } = useTenantStore()
  const navigate = useNavigate()

  const { data: sindico } = useQuery({
    queryKey: ["master_support_sindico", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("nome")
        .eq("condominio_id", tenant!.id)
        .eq("role", "sindico")
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: isMasterMode && !!tenant?.id,
  })

  if (!isMasterMode || !tenant) return null

  const handleExit = () => {
    setIsMasterMode(false)
    setTenant(null)
    navigate("/painel-master")
  }

  const sindicoLabel = sindico?.nome || "administrador do condomínio"

  return (
    <div className="bg-amber-500 text-amber-950 py-2.5 px-4 flex items-center justify-between sticky top-0 z-[100] border-b border-amber-600/30 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-amber-950 p-1.5 rounded-lg text-amber-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/80 leading-none">
            Modo Suporte
          </span>
          <span className="text-xs font-bold truncate">
            Acessando <strong>{tenant.nome}</strong>
            {sindicoLabel ? (
              <>
                {" "}
                (como referência: <strong>{sindicoLabel}</strong>)
              </>
            ) : null}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="text-amber-950 hover:bg-amber-600/20 h-8 gap-2 font-bold text-xs rounded-xl shrink-0 border border-amber-800/20"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar ao Painel Master
      </Button>
    </div>
  )
}
