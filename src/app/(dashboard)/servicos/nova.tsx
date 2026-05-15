import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  PlusCircle, 
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Tag,
  AlertTriangle,
  ClipboardList,
  Save,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { withTenantPrefix, cn } from "../../../lib/utils"
import { useNavigate, Link } from "react-router"

export default function NovaOrdemServico() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")
  const [prioridade, setPrioridade] = useState("media")
  const [local, setLocal] = useState("")
  const [responsavelId, setResponsavelId] = useState("")
  const [dataAgendada, setDataAgendada] = useState("")
  const [tempoEstimado, setTempoEstimado] = useState("")
  const [custoEstimado, setCustoEstimado] = useState("")

  // Permite fetch seguro sem ser bloqueado pela RLS da auth.users
  const { data: zeladores } = useQuery({
    queryKey: ['zeladores', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome')
        .eq('condominio_id', tenant?.id)
        .eq('role', 'zelador')
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const saveOS = useMutation({
    mutationFn: async () => {
      if (!titulo || !local) throw new Error("Título e Local são obrigatórios!")

      const payload = {
        condominio_id: tenant?.id,
        titulo,
        descricao,
        categoria,
        prioridade,
        local_descricao: local,
        responsavel_id: responsavelId || null,
        data_agendada: dataAgendada ? new Date(dataAgendada).toISOString() : null,
        tempo_estimado_minutos: tempoEstimado ? parseInt(tempoEstimado) : null,
        custo_estimado: custoEstimado ? parseFloat(custoEstimado.replace(',', '.')) : null,
        criado_por: perfil?.id || null,
        status: dataAgendada ? 'agendado' : 'pendente'
      }

      const { error } = await supabase
        .from('ordens_servico')
        .insert([payload])

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Ordem de serviço criada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      navigate(withTenantPrefix("/painel/servicos", tenant?.slug))
    },
    onError: (error: any) => {
      toast.error("Falha ao criar OS: " + error.message)
    }
  })

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link to={withTenantPrefix("/painel/servicos", tenant?.slug)}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Nova Ordem de Serviço</h1>
          <p className="text-slate-500 font-medium text-sm">Preencha os detalhes para agendar ou abrir um serviço.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulário Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Título do Serviço</label>
                <Input 
                  placeholder="Ex: Troca de lâmpada no hall" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Descrição Detalhada</label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary outline-none"
                  placeholder="Descreva o que precisa ser feito..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Ex: Bloco A, Garagem" 
                      value={local} 
                      onChange={(e) => setLocal(e.target.value)}
                      className="rounded-xl h-11 pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Categoria</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-primary outline-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Elétrica">Elétrica</option>
                      <option value="Hidráulica">Hidráulica</option>
                      <option value="Limpeza">Limpeza</option>
                      <option value="Pintura">Pintura</option>
                      <option value="Jardinagem">Jardinagem</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configurações Laterais */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Atribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Responsável (Zelador)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={responsavelId}
                    onChange={(e) => setResponsavelId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-primary outline-none"
                  >
                    <option value="">Aguardando...</option>
                    {zeladores?.map(z => (
                      <option key={z.id} value={z.id}>{z.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Prioridade</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'baixa', label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
                    { id: 'media', label: 'Média', color: 'bg-blue-50 text-blue-600' },
                    { id: 'alta', label: 'Alta', color: 'bg-orange-50 text-orange-600' },
                    { id: 'urgente', label: 'Urgente', color: 'bg-red-50 text-red-600' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrioridade(p.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        prioridade === p.id ? "bg-primary/10 border-primary" : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Data Agendada</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="date" 
                    value={dataAgendada}
                    onChange={(e) => setDataAgendada(e.target.value)}
                    className="rounded-xl h-11 pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Estimativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Tempo Estimado (minutos)</label>
                <Input 
                  type="number" 
                  placeholder="Ex: 60" 
                  value={tempoEstimado}
                  onChange={(e) => setTempoEstimado(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Custo Estimado (R$)</label>
                <Input 
                  placeholder="0,00" 
                  value={custoEstimado}
                  onChange={(e) => setCustoEstimado(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 rounded-2xl bg-primary hover:opacity-90 text-white font-black text-lg shadow-lg shadow-primary/20"
            disabled={saveOS.isPending}
            onClick={() => saveOS.mutate()}
          >
            {saveOS.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Criar Ordem
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
