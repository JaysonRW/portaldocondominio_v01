import { useTenantStore } from "../../stores/tenantStore"
import { useAuthStore } from "../../stores/authStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { PublicHeader } from "../../components/layout/PublicHeader"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
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
  ShieldCheck,
  Building2,
  Users,
  Sparkles
} from "lucide-react"
import { AcessoRestritoModal } from "../../components/layout/AcessoRestritoModal"
import { useState } from "react"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"

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
  const [accessOpen, setAccessOpen] = useState(false)
  const [accessSlug, setAccessSlug] = useState("")

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
    const handleAccessCondo = () => {
      const slug = accessSlug.trim().toLowerCase()
      if (!slug) return
      setAccessOpen(false)
      setAccessSlug("")
      navigate(`/${slug}`)
    }

    return (
      <div className="flex min-h-screen flex-col bg-[#07110d] text-white [font-family:'IBM_Plex_Sans',ui-sans-serif,system-ui,sans-serif]">
        <PublicHeader />
        
        <main className="flex-1">
          <section className="relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(197,217,50,0.22),transparent_55%),radial-gradient(1000px_circle_at_90%_30%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(700px_circle_at_60%_100%,rgba(59,130,246,0.14),transparent_55%)]" />
              <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
            </div>

            <div className="container mx-auto max-w-7xl px-4 pt-10 pb-14 sm:pt-16 sm:pb-20">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
                    <Sparkles className="h-4 w-4 text-[#C5D932]" />
                    Portal Condomínio Smart
                  </div>

                  <h1 className="mt-6 text-balance [font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[3.25rem] lg:text-[3.75rem]">
                    Seu condomínio ainda depende de grupos de WhatsApp para informar os moradores?
                  </h1>

                  <p className="mt-5 max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/70 sm:text-lg">
                    Organize comunicados, documentos, guia do morador, clube de vantagens e informações importantes em um portal simples, moderno e acessível pelo celular.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button asChild className="h-12 rounded-2xl bg-[#C5D932] px-6 font-black text-[#0b1411] hover:bg-[#b3c62d]">
                      <a
                        href="https://wa.me/5541995343245?text=Ol%C3%A1!%20Quero%20uma%20demonstra%C3%A7%C3%A3o%20do%20Condom%C3%ADnio%20Smart."
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Solicitar demonstração no WhatsApp"
                      >
                        Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>

                    <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 rounded-2xl border-white/15 bg-white/5 px-6 font-black text-white hover:bg-white/10"
                          type="button"
                        >
                          Acessar meu condomínio
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                          <DialogTitle className="text-base font-black uppercase tracking-widest">
                            Acessar meu condomínio
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="text-sm font-medium text-slate-600">
                            Digite o slug do seu condomínio para abrir o portal.
                          </div>
                          <Input
                            value={accessSlug}
                            onChange={(e) => setAccessSlug(e.target.value)}
                            placeholder="ex: colina-belvedere"
                            autoComplete="off"
                            inputMode="text"
                            aria-label="Slug do condomínio"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAccessCondo()
                            }}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" className="rounded-xl" onClick={() => setAccessOpen(false)} type="button">
                              Cancelar
                            </Button>
                            <Button className="rounded-xl font-black" onClick={handleAccessCondo} type="button">
                              Abrir portal
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <ShieldCheck className="h-4 w-4 text-white/70" />
                      Acesso por perfil
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <Globe className="h-4 w-4 text-white/70" />
                      Multi-tenant
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                      <MessageCircle className="h-4 w-4 text-white/70" />
                      Comunicação oficial
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="relative mx-auto w-full max-w-[420px]">
                    <div className="absolute -inset-4 rounded-[2.75rem] bg-white/5 blur-2xl" />
                    <div className="relative rounded-[2.25rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-2xl">
                      <div className="rounded-[1.75rem] bg-[#07110d] p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                            Prévia do Portal
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C5D932]" />
                            Ao vivo
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C5D932]/15 text-[#C5D932]">
                                <MessageSquareText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-black text-white">Último comunicado</div>
                                <div className="mt-1 text-xs font-medium leading-relaxed text-white/65">
                                  Avisos oficiais e fixados. Sem depender do grupo.
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black uppercase tracking-widest text-white/80">Arquivos</div>
                                  <div className="mt-1 text-[11px] font-medium text-white/60">Atas e PDFs</div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                                  <Globe className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black uppercase tracking-widest text-white/80">Guia</div>
                                  <div className="mt-1 text-[11px] font-medium text-white/60">Contatos úteis</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                                  <Gift className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black uppercase tracking-widest text-white/80">Vantagens</div>
                                  <div className="mt-1 text-[11px] font-medium text-white/60">Parceiros</div>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                                  <CalendarIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black uppercase tracking-widest text-white/80">Eventos</div>
                                  <div className="mt-1 text-[11px] font-medium text-white/60">Agenda</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="features" className="mt-14">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="text-balance [font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Tudo que o morador precisa encontrar, em poucos toques.
                  </h2>
                  <p className="mt-4 text-pretty text-base font-medium leading-relaxed text-white/70">
                    Uma central simples para acessar informações importantes do condomínio sem procurar em conversas antigas.
                  </p>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      icon: MessageSquareText,
                      title: "Comunicados importantes",
                      desc: "Avisos oficiais do condomínio organizados em um só lugar.",
                      tone: "bg-sky-400/10 text-sky-300",
                    },
                    {
                      icon: FileText,
                      title: "Arquivos e documentos",
                      desc: "Regimentos, atas e documentos úteis sempre acessíveis.",
                      tone: "bg-emerald-400/10 text-emerald-300",
                    },
                    {
                      icon: Globe,
                      title: "Guia do morador",
                      desc: "Orientações essenciais, contatos úteis e regras práticas.",
                      tone: "bg-indigo-400/10 text-indigo-300",
                    },
                    {
                      icon: Gift,
                      title: "Clube de vantagens",
                      desc: "Benefícios, parceiros e promoções exclusivas para moradores.",
                      tone: "bg-violet-400/10 text-violet-300",
                    },
                    {
                      icon: CalendarIcon,
                      title: "Eventos do condomínio",
                      desc: "Agenda de atividades, campanhas, reuniões e eventos internos.",
                      tone: "bg-amber-400/10 text-amber-300",
                    },
                    {
                      icon: MessageCircle,
                      title: "Dúvidas frequentes",
                      desc: "Respostas rápidas que reduzem mensagens repetidas para o síndico.",
                      tone: "bg-rose-400/10 text-rose-300",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.75)]">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="mt-5 text-lg font-black text-white">{item.title}</div>
                      <div className="mt-2 text-sm font-medium leading-relaxed text-white/65">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="sobre" className="bg-[#06100c] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-5">
                  <h2 className="[font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Chega de informação espalhada.
                  </h2>
                  <p className="mt-4 text-base font-medium leading-relaxed text-white/70">
                    Em muitos condomínios, comunicados ficam perdidos em grupos, documentos são enviados várias vezes, e o síndico perde tempo respondendo dúvidas repetidas.
                    <span className="text-white/85"> Com o Condomínio Smart, cada condomínio ganha um portal próprio, organizado e fácil de acessar.</span>
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "Comunicados perdidos em conversas antigas",
                      "Documentos enviados repetidamente",
                      "Moradores sem saber onde encontrar informações",
                      "Síndico sobrecarregado com perguntas recorrentes",
                      "Falta de uma central oficial de comunicação",
                      "Dificuldade para divulgar benefícios e parceiros",
                    ].map((text) => (
                      <div key={text} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#C5D932]" />
                        <div className="text-sm font-medium leading-relaxed text-white/70">{text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="para-quem" className="bg-[#07110d] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-balance [font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Uma plataforma pensada para quem administra e para quem mora.
                </h2>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C5D932]/15 text-[#C5D932]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="mt-5 text-lg font-black">Para síndicos</div>
                  <div className="mt-2 text-sm font-medium leading-relaxed text-white/65">
                    Publique comunicados, documentos, guia do morador, parceiros e eventos em poucos cliques. Reduza dúvidas repetidas e melhore a comunicação com os moradores.
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="mt-5 text-lg font-black">Para administradoras</div>
                  <div className="mt-2 text-sm font-medium leading-relaxed text-white/65">
                    Entregue uma experiência digital consistente para diferentes condomínios, com padronização e percepção de valor para os clientes atendidos.
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div className="mt-5 text-lg font-black">Para moradores</div>
                  <div className="mt-2 text-sm font-medium leading-relaxed text-white/65">
                    Acesse avisos, documentos, guia, benefícios, eventos e FAQ direto pelo celular. Informação simples, organizada e disponível quando precisar.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="como-funciona" className="bg-[#06100c] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-balance [font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Como funciona na prática
                </h2>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  {
                    step: "1",
                    title: "O condomínio é cadastrado",
                    desc: "Criamos o ambiente do condomínio com identidade visual, dados e módulos disponíveis.",
                  },
                  {
                    step: "2",
                    title: "O síndico publica os conteúdos",
                    desc: "Comunicados, arquivos, guia do morador, parceiros e eventos são organizados no painel.",
                  },
                  {
                    step: "3",
                    title: "O morador acessa quando precisar",
                    desc: "Tudo fica centralizado em um portal simples, seguro e pensado para o celular.",
                  },
                ].map((item) => (
                  <div key={item.step} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Passo</div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sm font-black text-white/80">
                        {item.step}
                      </div>
                    </div>
                    <div className="mt-4 text-lg font-black">{item.title}</div>
                    <div className="mt-2 text-sm font-medium leading-relaxed text-white/65">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#07110d] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-5">
                  <h2 className="[font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Controle simples para o síndico manter tudo atualizado.
                  </h2>
                  <p className="mt-4 text-base font-medium leading-relaxed text-white/70">
                    O painel administrativo permite atualizar os conteúdos do portal sem depender de alterações técnicas.
                  </p>
                </div>
                <div className="lg:col-span-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "Publicação de comunicados",
                      "Gestão de documentos e arquivos",
                      "Cadastro do guia do morador",
                      "Cadastro de parceiros do clube",
                      "Eventos e agenda do condomínio",
                      "Galeria de fotos e FAQ",
                    ].map((text) => (
                      <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C5D932]/15 text-[#C5D932]">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium text-white/75">{text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#06100c] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <h2 className="[font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Mais valor percebido para os moradores.
                  </h2>
                  <p className="mt-4 text-base font-medium leading-relaxed text-white/70">
                    Além de organizar informações, o condomínio pode divulgar parceiros, benefícios e promoções exclusivas, fortalecendo o relacionamento com empresas locais.
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Exemplos</div>
                    <div className="mt-4 grid gap-2 text-sm font-medium text-white/70">
                      {["Pet shops", "Mercados", "Academias", "Restaurantes", "Assistências técnicas", "Profissionais locais"].map((t) => (
                        <div key={t} className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-[#C5D932]" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="contato" className="bg-[#07110d] py-16 sm:py-24">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(800px_circle_at_20%_0%,rgba(197,217,50,0.18),transparent_55%),radial-gradient(700px_circle_at_90%_70%,rgba(59,130,246,0.12),transparent_55%)] p-8 sm:p-12">
                <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-7">
                    <h2 className="[font-family:'Bricolage_Grotesque',ui-sans-serif,system-ui,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
                      Pronto para modernizar a comunicação do seu condomínio?
                    </h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-white/70">
                      Ofereça aos moradores uma central simples, organizada e acessível pelo celular.
                    </p>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="grid gap-3">
                      <Button asChild className="h-12 rounded-2xl bg-[#C5D932] px-6 font-black text-[#0b1411] hover:bg-[#b3c62d]">
                        <a
                          href="https://wa.me/5541995343245?text=Ol%C3%A1!%20Quero%20uma%20demonstra%C3%A7%C3%A3o%20do%20Condom%C3%ADnio%20Smart."
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Quero uma demonstração no WhatsApp"
                        >
                          Quero uma demonstração <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>

                      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-12 rounded-2xl border-white/15 bg-white/5 px-6 font-black text-white hover:bg-white/10"
                            type="button"
                          >
                            Já sou morador / acessar portal
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px]">
                          <DialogHeader>
                            <DialogTitle className="text-base font-black uppercase tracking-widest">
                              Acessar meu condomínio
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div className="text-sm font-medium text-slate-600">
                              Digite o slug do seu condomínio para abrir o portal.
                            </div>
                            <Input
                              value={accessSlug}
                              onChange={(e) => setAccessSlug(e.target.value)}
                              placeholder="ex: colina-belvedere"
                              autoComplete="off"
                              inputMode="text"
                              aria-label="Slug do condomínio"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAccessCondo()
                              }}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" className="rounded-xl" onClick={() => setAccessOpen(false)} type="button">
                                Cancelar
                              </Button>
                              <Button className="rounded-xl font-black" onClick={handleAccessCondo} type="button">
                                Abrir portal
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                        Ou envie mensagem para <span className="text-white/70">+55 (41) 99534-3245</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                  Condomínio Smart © 2026
                </div>
                <div className="flex items-center gap-5 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                  <a href="#features" className="hover:text-white">Funcionalidades</a>
                  <a href="#como-funciona" className="hover:text-white">Como funciona</a>
                  <a href="#contato" className="hover:text-white">Contato</a>
                </div>
              </div>
            </div>
          </section>
        </main>
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
