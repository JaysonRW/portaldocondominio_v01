import { useTenantStore } from "../../stores/tenantStore"
import { useNavigate } from "react-router"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"

export function MasterAdminBar() {
  const { isMasterMode, setIsMasterMode, setTenant } = useTenantStore()
  const navigate = useNavigate()

  if (!isMasterMode) return null

  const handleExit = () => {
    setIsMasterMode(false)
    setTenant(null)
    navigate("/master")
  }

  return (
    <div className="bg-[#1a2e25] text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[100] border-b border-[#C5D932]/20 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="bg-[#C5D932] p-1.5 rounded-lg text-[#1a2e25]">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C5D932] leading-none">Modo Suporte Master</span>
          <span className="text-xs font-bold">Você está visualizando este painel como administrador global.</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExit}
          className="text-white hover:bg-white/10 h-8 gap-2 font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-3 h-3" /> Sair do Modo Suporte
        </Button>
      </div>
    </div>
  )
}
