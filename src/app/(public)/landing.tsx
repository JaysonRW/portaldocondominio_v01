import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { PublicHeader } from "../../components/layout/PublicHeader"
import { Button } from "../../components/ui/button"
import { withTenantPrefix } from "../../lib/utils"
import { 
  MessageSquareText, 
  FileText, 
  Gift, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  ExternalLink,
  MessageCircle,
  Globe,
  Clock,
  ShieldCheck
} from "lucide-react"
import { AcessoRestritoModal } from "../../components/layout/AcessoRestritoModal"
import { useState } from "react"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"

export default function PublicLanding() {
  const { tenant } = useTenantStore()
  const { user, perfil } = useAuthStore()
  const tenantSlug = tenant?.slug
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    categoria: "",
    assunto: "",
    mensagem: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPending = user && perfil && perfil.status_aprovacao === false

  const { data: ultimosComunicados } = useQuery({
    queryKey: ['avisos_publicos', tenant?.id],
    queryFn: async () => {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('comunicados')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .or(`publicar_em.is.null,publicar_em.lte.${nowIso}`)
        .order('criado_em', { ascending: false })
        .limit(3)
      
      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !perfil) {
      navigate(withTenantPrefix("/login", tenantSlug))
      return
    }

    if (!formData.categoria || !formData.assunto || !formData.mensagem) {
      toast.error("Preencha a categoria, o assunto e a mensagem.")
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('mensagens_morador')
        .insert({
          condominio_id: tenant?.id,
          morador_id: perfil.id,
          categoria: formData.categoria,
          assunto: formData.assunto,
          mensagem: formData.mensagem
        })

      if (error) throw error

      toast.success("Mensagem enviada com sucesso! Acompanhe pelo seu painel.")
      setFormData({ categoria: "", assunto: "", mensagem: "" })
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tenant && !tenantSlug) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <PublicHeader />
        
        {/* SaaS Hero */}
        <section className="relative flex min-h-[80vh] w-full items-center justify-center overflow-hidden bg-[#1a2e25]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-lime-500 rounded-full blur-[120px]" />
          </div>
          
          <div className="container relative z-10 px-4 text-center text-white max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">SaaS de Gestão Condominial Smart</span>
            </div>
            <h1 className="mb-6 text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Transforme a Gestão do seu Condomínio.
            </h1>
            <p className="mb-12 max-w-2xl mx-auto text-xl text-white/70 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Uma plataforma completa para síndicos e moradores. Transparência, agilidade e comunicação em um só lugar.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
              <Button size="lg" className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-10 py-8 rounded-2xl text-lg shadow-2xl" asChild>
                <a href="https://wa.me/5541995343245?text=quero%20conhecer%20o%20portal" target="_blank" rel="noreferrer">
                  Começar agora
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-black px-10 py-8 rounded-2xl text-lg" asChild>
                <Link to="/master">Painel Administrativo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SaaS Features */}
        <section className="py-32 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-100">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Segurança</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Dados protegidos e acesso restrito por níveis de permissão para síndicos e moradores.
                </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-100">
                <div className="w-14 h-14 bg-lime-50 text-lime-600 rounded-2xl flex items-center justify-center mb-6">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Multi-instância</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Cada condomínio possui seu próprio portal personalizado com cores e documentos próprios.
                </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-100">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">Comunicação</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Mural de avisos, calendário de eventos e documentos sempre à mão do morador.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const bgHero = tenant?.capa_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />

      {/* SESSÃO 1: HERO */}
      {isPending && (
        <div className="bg-amber-50 border-b border-amber-100 py-3 px-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-center gap-3 text-amber-800">
            <Clock className="w-5 h-5 animate-pulse" />
            <p className="text-sm font-bold">
              Sua solicitação de adesão está em análise. Enquanto isso, você pode navegar pelo portal como visitante.
            </p>
          </div>
        </div>
      )}

      <section 
        className="relative flex min-h-[600px] w-full items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${bgHero}')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="container relative z-10 px-4 py-32 text-center text-white max-w-6xl mx-auto">
          <h1 className="mb-6 text-6xl font-black tracking-tighter sm:text-7xl lg:text-8xl drop-shadow-2xl">
            Portal de<br />
            Transparência
          </h1>
          <p className="mb-10 max-w-2xl mx-auto text-xl text-white/90 font-medium leading-relaxed">
            Bem-vindo ao portal oficial do condomínio <span className="text-[#C5D932] font-bold">{tenant?.nome || 'Smart'}</span>. Encontre aqui todas as informações e novidades.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-10 py-8 rounded-xl text-lg shadow-2xl group" asChild>
              <a href="#comunicados">
                Ver Comunicados <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* SESSÃO 2: EXPLORE O PORTAL */}
      <section id="explore" className="py-32 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-4xl font-black tracking-tight text-[#1a2e25] mb-16 uppercase">Explore o Portal</h2>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            
            <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug} to="/portal/comunicados">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group cursor-pointer h-full">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C5D932]/10 transition-colors">
                  <MessageSquareText className="h-8 w-8 text-blue-600 group-hover:text-[#1a2e25] transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">Comunicados</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Fique por dentro das novidades e informações importantes.</p>
              </div>
            </AcessoRestritoModal>

            <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug} to="/portal/arquivos">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group cursor-pointer h-full">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C5D932]/10 transition-colors">
                  <FileText className="h-8 w-8 text-green-600 group-hover:text-[#1a2e25] transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">Documentos</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Acesse atas, relatórios e regulamentos.</p>
              </div>
            </AcessoRestritoModal>

            <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug} to="/portal/clube">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group cursor-pointer h-full">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C5D932]/10 transition-colors">
                  <Gift className="h-8 w-8 text-purple-600 group-hover:text-[#1a2e25] transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">Clube de Vantagens</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Descontos e benefícios exclusivos para moradores.</p>
              </div>
            </AcessoRestritoModal>

            <AcessoRestritoModal tenantName={tenant?.nome} tenantSlug={tenantSlug} to="/portal/eventos">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 group cursor-pointer h-full">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C5D932]/10 transition-colors">
                  <CalendarIcon className="h-8 w-8 text-amber-600 group-hover:text-[#1a2e25] transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">Eventos</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Calendário de eventos e assembleias.</p>
              </div>
            </AcessoRestritoModal>

          </div>
        </div>
      </section>

      {/* SESSÃO 3: ÚLTIMOS COMUNICADOS */}
      <section id="comunicados" className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-4xl font-black tracking-tight text-[#1a2e25] mb-4 uppercase">Últimos Comunicados</h2>
          <p className="text-slate-500 text-lg font-medium mb-16">Fique por dentro das novidades e avisos importantes.</p>
          
          <div className="grid gap-6 mb-16">
            {ultimosComunicados?.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-20 text-center text-slate-400">
                <p className="font-bold text-xl">Nenhum comunicado publicado recentemente.</p>
              </div>
            ) : (
              ultimosComunicados?.map((comunicado) => (
                <div key={comunicado.id} className="rounded-3xl border border-slate-100 bg-white shadow-sm p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-lg transition-all border-l-8 border-l-[#C5D932]">
                  <div className="flex flex-col gap-2 text-left">
                     <span className="text-xs font-black uppercase text-[#1a2e25] bg-[#C5D932]/20 px-3 py-1 rounded-full w-fit tracking-widest">{comunicado.tag || 'Aviso'}</span>
                     <h3 className="text-2xl font-black text-slate-800 leading-tight">{comunicado.titulo}</h3>
                     <p className="text-slate-500 font-medium line-clamp-2 mt-1">{comunicado.conteudo}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-slate-400">
                      {new Date(comunicado.publicar_em || comunicado.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    <Button variant="ghost" className="font-bold text-[#1a2e25] hover:text-primary p-0 h-auto" asChild>
                      <Link to={`/${tenantSlug}/portal/comunicados`}>
                        Ver Mais <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black px-10 py-8 rounded-xl text-lg shadow-xl" asChild>
             <a href="#explore">Ver Todos os Comunicados</a>
          </Button>
        </div>
      </section>

      {/* SESSÃO 4: ACESSO RÁPIDO */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-4xl font-black tracking-tight text-[#1a2e25] mb-16 uppercase">Acesso Rápido</h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Aplicativo */}
            <div className="bg-white rounded-[2rem] p-12 text-left shadow-sm border border-slate-100 flex flex-col h-full">
              <h3 className="text-3xl font-black text-slate-800 mb-4">Aplicativo do Morador</h3>
              <p className="text-slate-500 font-medium mb-10 flex-1 leading-relaxed">
                Faça reservas de espaços, registre ocorrências e solicite serviços pelo aplicativo oficial.
              </p>
              <Button 
                className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black w-full py-8 rounded-2xl text-xl shadow-lg"
                onClick={() => window.open('https://syndikosgestaoc.superlogica.net/clients/areadocondomino', '_blank')}
              >
                Acessar Aplicativo
              </Button>
            </div>

            {/* Suporte */}
            <div className="bg-white rounded-[2rem] p-12 text-left shadow-sm border border-slate-100 flex flex-col h-full">
              <h3 className="text-3xl font-black text-slate-800 mb-4">Suporte e Dúvidas</h3>
              <p className="text-slate-500 font-medium mb-10 flex-1 leading-relaxed">
                Entre em contato conosco através do WhatsApp durante o horário comercial.
              </p>
              <Button 
                className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black w-full py-8 rounded-2xl text-xl shadow-lg"
                onClick={() => {
                  const mensagem = encodeURIComponent(`Sou morador do ${tenant?.nome || 'condomínio'}, acessei o portal e estou com uma dúvida`)
                  window.open(`https://wa.me/5541995343245?text=${mensagem}`, '_blank')
                }}
              >
                Entrar em Contato
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 5: FORMULÁRIO DE CONTATO */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl border border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <MessageCircle className="w-40 h-40 text-primary" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-black tracking-tight text-center text-[#1a2e25] mb-6 uppercase">Envie Sua Dúvida ou Sugestão</h2>
              <p className="text-center text-slate-500 font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                Este canal é destinado ao envio de dúvidas, sugestões e comunicações para a administração do condomínio. O prazo de resposta pode variar conforme a demanda e a prioridade do assunto. 
                <br/><br/>
                <strong className="text-red-500">Em caso de emergência, entre em contato diretamente com a portaria ou canais oficiais de emergência do condomínio.</strong>
              </p>
              
              {!user ? (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                  <MessageSquareText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-800 mb-2">Canal do Morador</h3>
                  <p className="text-slate-500 font-medium mb-8">Você precisa estar logado para enviar mensagens à administração.</p>
                  <Button 
                    className="bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black py-8 px-10 rounded-2xl text-lg shadow-xl uppercase tracking-widest"
                    onClick={() => navigate(withTenantPrefix("/login", tenantSlug))}
                  >
                    Faça login para enviar mensagens
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Categoria</label>
                      <select 
                        className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800 appearance-none"
                        value={formData.categoria}
                        onChange={e => setFormData({...formData, categoria: e.target.value})}
                      >
                        <option value="" disabled>Selecione uma categoria...</option>
                        <option value="Dúvida">Dúvida</option>
                        <option value="Sugestão">Sugestão</option>
                        <option value="Reclamação">Reclamação</option>
                        <option value="Elogio">Elogio</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Segurança">Segurança</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Barulho">Barulho</option>
                        <option value="Garagem">Garagem</option>
                        <option value="Áreas comuns">Áreas comuns</option>
                        <option value="Animais/Pets">Animais/Pets</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Correspondências/Entregas">Correspondências/Entregas</option>
                        <option value="Assembleia">Assembleia</option>
                        <option value="App oficial / Acesso">App oficial / Acesso</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Assunto</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800"
                        placeholder="Ex: Lâmpada queimada no corredor"
                        value={formData.assunto}
                        onChange={e => setFormData({...formData, assunto: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Mensagem</label>
                    <textarea 
                      rows={5}
                      className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#C5D932]/20 focus:bg-white transition-all font-bold text-slate-800 resize-none"
                      placeholder="Descreva detalhadamente sua dúvida, sugestão ou ocorrência..."
                      value={formData.mensagem}
                      onChange={e => setFormData({...formData, mensagem: e.target.value})}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#C5D932] text-[#1a2e25] hover:bg-[#b3c62d] font-black py-10 rounded-2xl text-xl shadow-xl uppercase tracking-widest disabled:opacity-70"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <footer className="bg-[#1a2e25] text-white/50 py-16 text-center text-sm border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              {tenant?.logo_url ? (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={tenant.logo_url} alt={tenant.nome} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-[#C5D932] rounded-lg flex items-center justify-center font-black text-[#1a2e25]">
                  {tenant?.nome?.substring(0, 2) || "CB"}
                </div>
              )}
              <span className="font-bold text-white text-xl tracking-tight">{tenant?.nome}</span>
            </div>
            <div className="flex gap-8 font-bold text-white/80">
              <a href="#explore" className="hover:text-[#C5D932]">Portal</a>
              <Link to={withTenantPrefix("/portal/faq", tenantSlug)} className="hover:text-[#C5D932]">FAQ</Link>
              <Link to={withTenantPrefix("/login", tenantSlug)} className="hover:text-[#C5D932]">Acesso</Link>
            </div>
          </div>
          <p className="border-t border-white/5 pt-12">
            © {new Date().getFullYear()} Condomínio Smart. Plataforma construída para gestão de condomínios modernos.
          </p>
        </div>
      </footer>
    </div>
  )
}
