import { PublicHeader } from "../../components/layout/PublicHeader"
import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { HelpCircle, ChevronDown, Loader2, ThumbsUp, ThumbsDown } from "lucide-react"
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { toast } from "sonner"

export default function PublicFAQ() {
  const { tenant } = useTenantStore()
  const { user } = useAuthStore()
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const canTrack = useMemo(() => !!tenant?.id, [tenant?.id])

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

  const trackInteraction = useMutation({
    mutationFn: async (payload: { faq_id: string; event_type: 'view' | 'feedback'; resolved?: boolean | null }) => {
      if (!tenant?.id) return
      const { error } = await supabase.from('faq_interactions').insert({
        condominio_id: tenant.id,
        faq_id: payload.faq_id,
        user_id: user?.id ?? null,
        event_type: payload.event_type,
        resolved: payload.event_type === 'feedback' ? (payload.resolved ?? null) : null,
      })
      if (error) throw error
    },
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
                  onClick={() => {
                    const next = openIndex === faq.id ? null : faq.id
                    setOpenIndex(next)
                    if (next && canTrack) {
                      trackInteraction.mutate({ faq_id: faq.id, event_type: 'view' })
                    }
                  }}
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

                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                      <div className="text-sm font-black text-slate-700 uppercase tracking-tight">
                        Isso resolveu sua dúvida?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            trackInteraction.mutate(
                              { faq_id: faq.id, event_type: 'feedback', resolved: true },
                              { onSuccess: () => toast.success("Obrigado pelo feedback!") }
                            )
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors"
                          disabled={trackInteraction.isPending}
                        >
                          <ThumbsUp className="w-4 h-4" /> Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            trackInteraction.mutate(
                              { faq_id: faq.id, event_type: 'feedback', resolved: false },
                              { onSuccess: () => toast.success("Obrigado pelo feedback!") }
                            )
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors"
                          disabled={trackInteraction.isPending}
                        >
                          <ThumbsDown className="w-4 h-4" /> Não
                        </button>
                      </div>
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
