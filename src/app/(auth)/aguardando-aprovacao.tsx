import { Link, useParams } from "react-router"
import { useTenantStore } from "../../stores/tenantStore"
import { withTenantPrefix } from "../../lib/utils"
import { Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"

export default function AguardandoAprovacao() {
  const { tenant } = useTenantStore()
  const params = useParams()
  const tenantSlug = params.tenantSlug

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-xl shadow-slate-200/50 max-w-xl border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Clock className="w-12 h-12 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">
          Sua solicitação está em análise
        </h1>
        
        <div className="space-y-4 text-slate-500 font-medium leading-relaxed mb-10 text-balance">
          <p>
            Recebemos seu pedido de acesso ao portal do condomínio <strong>{tenant?.nome || "selecionado"}</strong>.
          </p>
          <p>
            Assim que a administração aprovar seu cadastro, você terá acesso completo aos comunicados, avisos, assembleias e informações internas.
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-slate-600">
              Esta é uma medida de segurança para garantir que apenas moradores autorizados acessem as informações internas do condomínio.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold gap-2" asChild>
            <Link to={withTenantPrefix("/", tenantSlug)}>
              <ArrowLeft className="w-4 h-4" /> Voltar ao Início
            </Link>
          </Button>
          
          <div className="pt-6 border-t border-slate-100 mt-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Precisa de ajuda?</p>
            <div className="flex justify-center gap-4">
              <a 
                href="https://wa.me/5541995343245" 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-500 hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
