import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  ShieldCheck, 
  Search, 
  Building2,
  Trash2,
  Wand2
} from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"

export default function UnidadesAdmin() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const canAdmin = perfil?.role === "sindico" || perfil?.role === "super_admin"

  const [searchTerm, setSearchTerm] = useState("")
  
  // Modais
  const [openGerador, setOpenGerador] = useState(false)
  const [openManual, setOpenManual] = useState(false)

  // Estados do Gerador
  const [temBlocos, setTemBlocos] = useState(true)
  const [blocosLista, setBlocosLista] = useState("A, B, C")
  const [andares, setAndares] = useState("10")
  const [aptosPorAndar, setAptosPorAndar] = useState("4")

  // Estados Manual
  const [novoBloco, setNovoBloco] = useState("")
  const [novaUnidade, setNovaUnidade] = useState("")

  // 1. Busca todas as unidades desse condomínio
  const { data: unidades, isLoading } = useQuery({
    queryKey: ['unidades', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('condominio_unidades')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('bloco', { ascending: true })
        .order('unidade', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Mutação: Gerador Automático
  const geradorMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Condomínio não encontrado.")
      
      const qtdAndares = parseInt(andares)
      const qtdAptos = parseInt(aptosPorAndar)
      
      if (isNaN(qtdAndares) || isNaN(qtdAptos) || qtdAndares <= 0 || qtdAptos <= 0) {
        throw new Error("Andares e apartamentos por andar devem ser números maiores que zero.")
      }

      const unidadesParaInserir = []
      const blocos = temBlocos ? blocosLista.split(',').map(b => b.trim()).filter(Boolean) : [null]

      for (const bloco of blocos) {
        for (let andar = 1; andar <= qtdAndares; andar++) {
          for (let apto = 1; apto <= qtdAptos; apto++) {
            // Exemplo: Andar 1, apto 1 => 101. Andar 10, apto 4 => 1004.
            const numeroUnidade = `${andar}${apto.toString().padStart(2, '0')}`
            unidadesParaInserir.push({
              condominio_id: tenant.id,
              bloco: bloco,
              unidade: numeroUnidade,
              tipo: 'residencial',
              ativo: true
            })
          }
        }
      }

      if (unidadesParaInserir.length === 0) throw new Error("Nenhuma unidade para gerar.")

      const { error } = await supabase
        .from('condominio_unidades')
        .upsert(unidadesParaInserir, { onConflict: 'condominio_id,bloco,unidade', ignoreDuplicates: true })

      if (error) throw error
      return unidadesParaInserir.length
    },
    onSuccess: (qtd) => {
      toast.success(`${qtd} unidades geradas/verificadas com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['unidades'] })
      setOpenGerador(false)
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar unidades: " + error.message)
    }
  })

  // 3. Mutação: Adicionar Manual
  const addManualMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Condomínio não encontrado.")
      if (!novaUnidade.trim()) throw new Error("O campo Unidade é obrigatório.")

      const { error } = await supabase
        .from('condominio_unidades')
        .insert({
          condominio_id: tenant.id,
          bloco: novoBloco.trim() || null,
          unidade: novaUnidade.trim(),
          tipo: 'residencial',
          ativo: true
        })

      if (error) {
        if (error.code === '23505') throw new Error("Esta unidade já existe neste bloco.")
        throw error
      }
    },
    onSuccess: () => {
      toast.success("Unidade adicionada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['unidades'] })
      setNovoBloco("")
      setNovaUnidade("")
      setOpenManual(false)
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar: " + error.message)
    }
  })

  // 4. Mutação: Excluir
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('condominio_unidades')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Unidade removida!")
      queryClient.invalidateQueries({ queryKey: ['unidades'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao remover: " + error.message)
    }
  })

  if (!canAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground">Esta área é restrita à administração do condomínio.</p>
      </div>
    )
  }

  const filteredUnidades = unidades?.filter(u => 
    u.unidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.bloco && u.bloco.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const estatisticas = {
    total: unidades?.length || 0,
    blocos: new Set(unidades?.map(u => u.bloco).filter(Boolean)).size,
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Estrutura e Unidades</h1>
          <p className="text-slate-500 font-medium mt-1">Configure os blocos e apartamentos para habilitar módulos inteligentes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Adicionar Manual */}
          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl px-6 border-slate-200">
                Adicionar Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Unidade</DialogTitle>
                <DialogDescription>
                  Adicione uma unidade específica (ex: Casa do Zelador, Cobertura).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Bloco (Opcional)</label>
                  <Input value={novoBloco} onChange={(e) => setNovoBloco(e.target.value)} placeholder="Ex: B, Torre 1" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Unidade (Obrigatório)</label>
                  <Input value={novaUnidade} onChange={(e) => setNovaUnidade(e.target.value)} placeholder="Ex: 101, Cobertura A" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenManual(false)}>Cancelar</Button>
                <Button onClick={() => addManualMutation.mutate()} disabled={addManualMutation.isPending}>
                  {addManualMutation.isPending ? "Salvando..." : "Salvar Unidade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Gerador Automático */}
          <Dialog open={openGerador} onOpenChange={setOpenGerador}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2">
                <Wand2 className="w-4 h-4" /> Gerador Inteligente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Gerador Automático de Unidades</DialogTitle>
                <DialogDescription>
                  Configure o padrão do seu condomínio e nós criamos todas as unidades instantaneamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="temBlocos" 
                    checked={temBlocos} 
                    onChange={(e) => setTemBlocos(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="temBlocos" className="font-bold text-slate-700 cursor-pointer">
                    Meu condomínio possui blocos/torres
                  </label>
                </div>

                {temBlocos && (
                  <div className="grid gap-2">
                    <label className="text-sm font-bold text-slate-700">Nome dos Blocos (Separados por vírgula)</label>
                    <Input 
                      value={blocosLista} 
                      onChange={(e) => setBlocosLista(e.target.value)} 
                      placeholder="Ex: A, B, C, D" 
                    />
                    <p className="text-xs text-slate-500">Nós geraremos apartamentos para cada um destes blocos.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-bold text-slate-700">Andares</label>
                    <Input 
                      type="number"
                      value={andares} 
                      onChange={(e) => setAndares(e.target.value)} 
                      min="1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-bold text-slate-700">Aptos por Andar</label>
                    <Input 
                      type="number"
                      value={aptosPorAndar} 
                      onChange={(e) => setAptosPorAndar(e.target.value)} 
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-2">
                  <p className="text-sm text-blue-800 font-medium leading-relaxed">
                    <strong>Exemplo da Geração:</strong> O primeiro apartamento do 1º andar será <span className="font-bold bg-blue-100 px-1 rounded">101</span>, e do 10º andar será <span className="font-bold bg-blue-100 px-1 rounded">1001</span>. Unidades que já existem serão ignoradas (não duplicam).
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed font-semibold">
                    💡 <strong>Dica para Exceções:</strong> O gerador é aditivo! Se você tiver blocos com padrões ou andares diferentes, pode rodá-lo múltiplas vezes (ex: uma vez para os blocos "A, B" com 6 aptos/andar e outra para o bloco "C" com 3 aptos/andar). Unidades já criadas não são apagadas nem duplicadas.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenGerador(false)}>Cancelar</Button>
                <Button onClick={() => geradorMutation.mutate()} disabled={geradorMutation.isPending} className="bg-primary">
                  {geradorMutation.isPending ? "Gerando..." : "Gerar Tudo Agora"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <Card className="border-none shadow-sm bg-white">
           <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                 <Building2 className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Unidades</p>
                 <h3 className="text-2xl font-black text-slate-800">{estatisticas.total}</h3>
              </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-white">
           <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                 <Building2 className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qtd. de Blocos</p>
                 <h3 className="text-2xl font-black text-slate-800">{estatisticas.blocos}</h3>
              </div>
           </CardContent>
         </Card>
      </div>

      {/* Main Units Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
           <CardTitle className="text-lg font-black text-slate-800">Unidades Cadastradas</CardTitle>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar bloco ou unidade..." 
                   className="pl-9 h-10 rounded-xl border-slate-100 bg-slate-50 w-64 focus:bg-white transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar relative">
          <table className="w-full text-left relative">
            <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Bloco / Torre</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Unidade</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUnidades?.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <Building2 className="w-12 h-12" />
                         <p className="font-bold">Nenhuma unidade cadastrada</p>
                         <p className="text-sm max-w-sm">Use o Gerador Inteligente acima para criar a estrutura do seu condomínio em segundos.</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredUnidades?.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <span className="font-bold text-slate-700">{item.bloco || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{item.unidade}</span>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="outline" className="uppercase text-[10px] tracking-widest">{item.tipo}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                         onClick={() => {
                           if(confirm(`Tem certeza que deseja remover a unidade ${item.unidade}?`)) {
                             deleteMutation.mutate(item.id)
                           }
                         }}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
