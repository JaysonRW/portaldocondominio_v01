import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { HelpCircle, ChevronDown, Loader2 } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"

export default function PublicFAQ() {
  const { tenant } = useTenantStore()
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs_publicas', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-20">
          <div className="w-24 h-24 bg-[#C5D932]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <HelpCircle className="h-10 w-10 text-[#1a2e25]" />
          </div>
          <h1 className="text-5xl font-black text-[#1a2e25] mb-4 uppercase tracking-tight">Dúvidas Frequentes</h1>
          <p className="text-slate-500 text-lg font-medium">Respostas para as perguntas mais comuns dos moradores.</p>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#C5D932]" />
            </div>
          ) : faqs?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-slate-500 font-medium text-lg">Nenhuma dúvida frequente publicada ainda.</p>
            </div>
          ) : (
            faqs?.map((faq) => (
              <div key={faq.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <button 
                  className="w-full px-10 py-8 text-left flex justify-between items-center hover:bg-slate-50 transition-colors group"
                  onClick={() => setOpenIndex(openIndex === faq.id ? null : faq.id)}
                >
                  <span className="text-xl font-black text-slate-800 group-hover:text-[#1a2e25]">{faq.pergunta}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openIndex === faq.id ? 'bg-[#1a2e25] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#C5D932] group-hover:text-[#1a2e25]'}`}>
                    <ChevronDown className={`w-6 h-6 transition-transform ${openIndex === faq.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {openIndex === faq.id && (
                  <div className="px-10 pb-10 pt-0 text-slate-500 font-medium text-lg leading-relaxed animate-in slide-in-from-top-2 duration-300">
                    <div className="pt-6 border-t border-slate-50 whitespace-pre-wrap">
                      {faq.resposta}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <p>© {new Date().getFullYear()} Condomínio Smart. Plataforma oficial de transparência para {tenant?.nome}. Criado por <a href="https://www.propagounaweb.com.br" target="_blank" rel="noopener noreferrer" className="text-[#C5D932] hover:underline font-bold">propagounaweb</a>.</p>
        </div>
      </footer>
    </div>
  )
}
