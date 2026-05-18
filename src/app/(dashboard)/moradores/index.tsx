import { useState } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  Users, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Filter, 
  Building,
  Smartphone
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
import { withTenantPrefix, cn } from "../../../lib/utils"
import { Badge } from "../../../components/ui/badge"

export default function MoradoresAdmin() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const canAdmin = perfil?.role === "sindico" || perfil?.role === "super_admin"

  const [openInvite, setOpenInvite] = useState(false)
  const [telefone, setTelefone] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  const isMock = tenant?.id === '00000000-0000-0000-0000-000000000000'

  // 1. Busca todos os moradores desse condomínio (excluindo contas de portaria)
  const { data: pessoas, isLoading } = useQuery({
    queryKey: ['moradores', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .neq('role', 'portaria')
        .order('nome', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 3. Mutação: Atualizar Cargo
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: string }) => {
      const { error } = await supabase
        .from('perfis')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['moradores'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar cargo: " + error.message)
    }
  })

  const inviteMorador = useMutation({
    mutationFn: async () => {
      if (!canAdmin) throw new Error("Apenas o síndico pode convidar moradores.")
      if (isMock) throw new Error("Você está no modo de demonstração. Crie um condomínio real no painel Master para convidar moradores.")
      if (!telefone.trim()) throw new Error("Preencha o número do WhatsApp.")

      // Formata o telefone (remove caracteres não numéricos)
      const numeroFormatado = telefone.replace(/\D/g, '')
      
      // Pega a URL de join
      const joinUrl = `${window.location.origin}${withTenantPrefix("/join", tenant?.slug)}`
      
      // Cria a mensagem
      const mensagem = encodeURIComponent(`Olá! Aqui é a administração do condomínio ${tenant?.nome || ''}. Segue o link para você acessar nosso portal de moradores e criar seu acesso:\n\n${joinUrl}`)
      
      // Abre o WhatsApp
      window.open(`https://wa.me/55${numeroFormatado}?text=${mensagem}`, '_blank')
      
      return true
    },
    onSuccess: () => {
      toast.success("Redirecionando para o WhatsApp...")
      setOpenInvite(false)
      setTelefone("")
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar link: " + error.message)
    }
  })

  // Mutação para aprovar/bloquear morador
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ userId, statusAprovacao }: { userId: string, statusAprovacao: boolean }) => {
      // 1. Atualiza o perfil principal
      const { error: perfilError } = await supabase
        .from('perfis')
        .update({ status_aprovacao: statusAprovacao })
        .eq('id', userId)

      if (perfilError) throw perfilError

      // 2. Tenta buscar o e-mail do usuário para atualizar a solicitação de adesão
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('email')
        .eq('id', userId)
        .single()

      if (perfilData?.email) {
        // 3. Se achar o email, atualiza a solicitação de adesão correspondente para 'aprovado' ou 'recusado/pendente'
        await supabase
          .from('solicitacoes_adesao')
          .update({ status: statusAprovacao ? 'aprovado' : 'pendente' })
          .eq('email', perfilData.email)
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.statusAprovacao ? "Acesso Aprovado e Liberado!" : "Acesso Bloqueado!")
      queryClient.invalidateQueries({ queryKey: ['moradores'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar status: " + error.message)
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

  const filteredPessoas = pessoas?.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.unidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bloco?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    'super_admin': 'bg-slate-900 text-white',
    'sindico': 'bg-blue-100 text-blue-700',
    'subsindico': 'bg-sky-100 text-sky-700',
    'zelador': 'bg-emerald-100 text-emerald-700',
    'morador': 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Moradores & Pessoal</h1>
          <p className="text-slate-500 font-medium mt-1">Gerenciamento completo de acessos e cargos.</p>
        </div>

        <Dialog open={openInvite} onOpenChange={setOpenInvite}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 gap-2">
              <PlusCircle className="w-4 h-4" /> Convidar Morador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Link de Adesão</DialogTitle>
              <DialogDescription>
                Gere um link de adesão ao portal e envie diretamente para o WhatsApp do morador.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">WhatsApp</label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenInvite(false)}>Cancelar</Button>
              <Button onClick={() => inviteMorador.mutate()} disabled={inviteMorador.isPending}>
                {inviteMorador.isPending ? "Redirecionando..." : "Enviar via WhatsApp"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <Card className="border-none shadow-sm bg-white">
           <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                 <Users className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Ativos</p>
                 <h3 className="text-2xl font-black text-slate-800">{pessoas?.filter(p => p.ativo).length || 0}</h3>
              </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-white">
           <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                 <Building className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unidades</p>
                 <h3 className="text-2xl font-black text-slate-800">
                    {new Set(pessoas?.map(p => p.unidade).filter(Boolean)).size}
                 </h3>
              </div>
           </CardContent>
         </Card>
      </div>

      {/* Main Users Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between space-y-0 p-6">
           <CardTitle className="text-lg font-black text-slate-800">Base de Moradores</CardTitle>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   placeholder="Buscar morador, unidade..." 
                   className="pl-9 h-10 rounded-xl border-slate-100 bg-slate-50 w-64 focus:bg-white transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 text-slate-400">
                 <Filter className="w-4 h-4" />
              </Button>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Morador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Localização</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo / Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-40 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredPessoas?.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                         <Users className="w-12 h-12" />
                         <p className="font-bold">Nenhum morador encontrado</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredPessoas?.map((pessoa) => (
                  <tr key={pessoa.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0", roleColors[pessoa.role] || roleColors['morador'])}>
                             {pessoa.nome?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{pessoa.nome}</span>
                             </div>
                             <p className="text-xs text-slate-500 font-medium">{pessoa.email || 'Sem e-mail'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <Building className="w-3.5 h-3.5" />
                          <span>{pessoa.bloco ? `Bloco ${pessoa.bloco}` : ''} {pessoa.unidade ? `Un. ${pessoa.unidade}` : '-'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                             <Smartphone className="w-3.5 h-3.5 text-primary" />
                             <span>{pessoa.telefone || 'Sem WhatsApp'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col items-start gap-2">
                         <Badge className={cn("rounded-lg font-black uppercase text-[10px] tracking-widest border-none px-2 py-1 shadow-none", roleColors[pessoa.role] || roleColors['morador'])}>
                            {pessoa.role}
                         </Badge>
                         {pessoa.status_aprovacao ? (
                           <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-widest border-none px-2 py-1 shadow-none">Aprovado</Badge>
                         ) : pessoa.role !== 'sindico' ? (
                           <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-[10px] uppercase tracking-widest border-none px-2 py-1 shadow-none">Aguardando Aprovação</Badge>
                         ) : null}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <select 
                            className="inline-flex h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer hover:border-primary transition-all"
                            value={pessoa.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: pessoa.id, newRole: e.target.value })}
                            disabled={updateRoleMutation.isPending || pessoa.role === 'super_admin' || pessoa.role === 'sindico'}
                          >
                            <option value="morador">Morador</option>
                            <option value="sindico">Síndico</option>
                            <option value="subsindico">Subsindico</option>
                            <option value="zelador">Zelador</option>
                          </select>
                          {pessoa.role !== 'super_admin' && pessoa.role !== 'sindico' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn("h-9 rounded-xl font-bold", pessoa.status_aprovacao ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700")}
                              onClick={() => toggleAtivoMutation.mutate({ userId: pessoa.id, statusAprovacao: !pessoa.status_aprovacao })}
                            >
                              {pessoa.status_aprovacao ? "Bloquear" : "Aprovar"}
                            </Button>
                          )}
                       </div>
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
