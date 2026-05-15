import { useState, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { CheckCircle2, UserCircle, Phone, Home as HomeIcon, MessageSquareText, ArrowLeft, CheckCircle } from "lucide-react"
import { withTenantPrefix, cn } from "../../../lib/utils"
import { Badge } from "../../../components/ui/badge"
import { PublicHeader } from "../../../components/layout/PublicHeader"

export default function OnboardingPage() {
  const { user, perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const navigate = useNavigate()
  
  const [nome, setNome] = useState(perfil?.nome || "")
  const [unidade, setUnidade] = useState(perfil?.unidade || "")
  const [telefone, setTelefone] = useState(perfil?.telefone || "")
  const [aceitouTermos, setAceitouTermos] = useState(false)

  // Busca histórico de mensagens do morador
  const { data: mensagens, isLoading: loadingMensagens } = useQuery({
    queryKey: ['minhas_mensagens', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens_morador')
        .select('*')
        .eq('morador_id', user?.id)
        .order('criado_em', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  const [activeTab, setActiveTab] = useState("cadastro")

  // Se o perfil está incompleto, forçamos a aba de cadastro e escondemos o menu de mensagens até ele preencher
  const isProfileComplete = !!(perfil?.unidade && perfil?.nome)

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!nome || !unidade) {
        throw new Error("Nome e Unidade são obrigatórios.")
      }

      if (!isProfileComplete && !aceitouTermos) {
        throw new Error("Você precisa aceitar os termos da LGPD para continuar.")
      }

      const { error } = await supabase
        .from('perfis')
        .update({
          nome,
          unidade,
          telefone,
          termos_aceitos_em: new Date().toISOString(),
          condominio_id: tenant?.id // Garante que o morador está vinculado ao tenant atual
        })
        .eq('id', user?.id)

      if (error) throw error
      
      // Busca o perfil atualizado para atualizar a store
      const { data: updatedPerfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user?.id)
        .single()
        
      if (updatedPerfil) {
        useAuthStore.getState().setPerfil(updatedPerfil)
      }
    },
    onSuccess: () => {
      toast.success(isProfileComplete ? "Perfil atualizado!" : "Cadastro ativado com sucesso!")
      // Se for a primeira vez que ativou o cadastro, recarrega a página ou redireciona
      if (!isProfileComplete) {
        navigate(withTenantPrefix("/portal/comunicados", tenant?.slug))
      }
    },
    onError: (error: any) => {
      toast.error(error.message)
    }
  })

  // Check if we have the necessary dependencies
  if (!user || !perfil) {
    return <div className="p-8 text-center">Carregando dados do usuário...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Cadastro do Morador
          </h1>
        </div>

        <div className="w-full">
          <div className="flex bg-white border border-slate-200 p-1 mb-8 rounded-2xl w-full sm:w-auto h-auto">
            <button 
              onClick={() => setActiveTab("cadastro")}
              className={cn(
                "flex-1 sm:flex-none rounded-xl px-6 py-3 font-bold flex items-center justify-center transition-all",
                activeTab === "cadastro" ? "bg-[#C5D932] text-[#1a2e25]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserCircle className="w-4 h-4 mr-2" /> Meu Cadastro
            </button>
            <button 
              onClick={() => setActiveTab("mensagens")}
              className={cn(
                "flex-1 sm:flex-none rounded-xl px-6 py-3 font-bold flex items-center justify-center transition-all",
                activeTab === "mensagens" ? "bg-[#C5D932] text-[#1a2e25]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <MessageSquareText className="w-4 h-4 mr-2" /> Canal do Morador
            </button>
          </div>

          {activeTab === "cadastro" && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-slate-800 mb-2">Dados do Perfil</h2>
                <p className="text-slate-500 font-medium mb-8">
                  {isProfileComplete 
                    ? "Mantenha suas informações atualizadas para a administração." 
                    : "Para liberar todas as funcionalidades do portal, preencha seus dados básicos."}
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-widest ml-1">Nome Completo</label>
                    <Input 
                      value={nome} 
                      onChange={(e) => setNome(e.target.value)} 
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-[#C5D932]/20 font-bold"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-widest ml-1">Unidade / Apartamento</label>
                      <Input 
                        value={unidade} 
                        onChange={(e) => setUnidade(e.target.value)} 
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-[#C5D932]/20 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-widest ml-1">Telefone (WhatsApp)</label>
                      <Input 
                        value={telefone} 
                        onChange={(e) => setTelefone(e.target.value)} 
                        placeholder="(00) 00000-0000"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-[#C5D932]/20 font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    {!isProfileComplete && (
                      <div className="mb-6 flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center h-5">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={aceitouTermos}
                            onChange={(e) => setAceitouTermos(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-[#1a2e25] focus:ring-[#C5D932]"
                          />
                        </div>
                        <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed font-medium">
                          Estou ciente que meus dados de Nome e Unidade ficarão visíveis para a administração do condomínio conforme a Lei Geral de Proteção de Dados (LGPD).
                        </label>
                      </div>
                    )}
                    
                    <Button 
                      className="bg-[#1a2e25] text-white hover:bg-[#1a2e25]/90 font-black h-14 px-10 rounded-2xl text-lg shadow-xl" 
                      onClick={() => saveProfile.mutate()}
                      disabled={saveProfile.isPending}
                    >
                      {saveProfile.isPending ? "Salvando..." : isProfileComplete ? "Salvar Alterações" : "Ativar Meu Cadastro"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mensagens" && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-black text-slate-800 mb-2">Minhas Mensagens</h2>
                <p className="text-slate-500 font-medium mb-8">Acompanhe o status das suas dúvidas, sugestões e ocorrências enviadas pelo portal.</p>
                
                {loadingMensagens ? (
                  <div className="py-20 text-center text-slate-400">Carregando histórico...</div>
                ) : !mensagens || mensagens.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <MessageSquareText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-500">Você ainda não enviou nenhuma mensagem.</p>
                    <p className="text-sm text-slate-400 font-medium mt-2">Utilize o formulário na página inicial do portal para falar com a administração.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {mensagens.map((msg) => (
                      <div key={msg.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase text-[#1a2e25] bg-[#C5D932]/20 px-3 py-1 rounded-full w-fit tracking-widest">
                              {msg.categoria}
                            </span>
                            <span className="text-sm font-bold text-slate-400">
                              {new Date(msg.criado_em).toLocaleDateString('pt-BR')} às {new Date(msg.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          <Badge variant="outline" className={cn(
                            "uppercase font-black tracking-widest text-xs px-3 py-1 border-0",
                            msg.status === 'nova' && "bg-blue-100 text-blue-700",
                            msg.status === 'em análise' && "bg-amber-100 text-amber-700",
                            msg.status === 'respondida' && "bg-emerald-100 text-emerald-700",
                            msg.status === 'resolvida' && "bg-slate-200 text-slate-700"
                          )}>
                            {msg.status}
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 mb-2">{msg.assunto}</h3>
                        <p className="text-slate-600 font-medium whitespace-pre-wrap">{msg.mensagem}</p>
                        
                        {msg.resposta_admin && (
                          <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 relative">
                            <div className="absolute -top-3 left-6 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Resposta da Administração
                            </div>
                            <p className="text-emerald-900 font-medium whitespace-pre-wrap mt-2">{msg.resposta_admin}</p>
                            {msg.respondido_em && (
                              <span className="text-xs font-bold text-emerald-600/70 block mt-3">
                                Respondido em {new Date(msg.respondido_em).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    )
}
