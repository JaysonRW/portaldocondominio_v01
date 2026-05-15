import { useState } from "react"
import { Link } from "react-router"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "../../../components/ui/card"
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Calendar,
  MoreVertical,
  Trash2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Pencil
} from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../../../components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { toast } from "sonner"
import { withTenantPrefix } from "../../../lib/utils"

export default function GestaoZeladores() {
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [horarioTrabalho, setHorarioTrabalho] = useState("")
  
  // Limpar form ao fechar modal
  const handleOpenChange = (open: boolean) => {
    setOpenModal(open)
    if (!open) {
      setEditingId(null)
      setNome("")
      setEmail("")
      setHorarioTrabalho("")
    }
  }

  // Mutação para cadastrar/editar zelador
  const cadastrarZelador = useMutation({
    mutationFn: async () => {
      if (editingId) {
        // Modo edição - atualiza dados diretamente no banco (apenas dados do perfil)
        const { error } = await supabase
          .from('perfis')
          .update({
            nome,
            horario_trabalho: horarioTrabalho
          })
          .eq('id', editingId)
          
        if (error) throw error
        return { success: true }
      } else {
        // Modo criação - usa Edge Function para criar user + perfil
        const { data, error } = await supabase.functions.invoke('invite-condominio-user', {
          body: {
            nome,
            email: email.trim(),
            horario_trabalho: horarioTrabalho,
            role: 'zelador',
            condominio_id: tenant?.id
          }
        })

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Zelador atualizado com sucesso!" : "Zelador cadastrado com sucesso!")
      handleOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['zeladores-list'] })
    },
    onError: (error: any) => {
      toast.error(`Erro ao ${editingId ? 'atualizar' : 'cadastrar'} zelador: ` + error.message)
    }
  })

  // Iniciar edição
  const handleEdit = (zelador: any) => {
    setEditingId(zelador.id)
    setNome(zelador.nome || "")
    setEmail(zelador.email || "") // Apenas leitura visual se for edição
    setHorarioTrabalho(zelador.horario_trabalho || "")
    setOpenModal(true)
  }

  // Mutação para remover (inativar)
  const removerZelador = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('perfis')
        .update({ ativo: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Zelador removido com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['zeladores-list'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao remover zelador: " + error.message)
    }
  })

  // Busca zeladores
  const { data: zeladores, isLoading } = useQuery({
    queryKey: ['zeladores-list', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .eq('role', 'zelador')
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  const filteredZeladores = zeladores?.filter(z => 
    z.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl shrink-0">
            <Link to={withTenantPrefix("/painel", tenant?.slug)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Zeladores</h1>
            <p className="text-slate-500 font-medium mt-1">Gerencie a equipe de manutenção do condomínio.</p>
          </div>
        </div>

        <Dialog open={openModal} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 text-white rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" />
              Cadastrar Zelador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-800">
                {editingId ? "Editar Zelador" : "Novo Zelador"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize os dados do profissional." : "Adicione um novo profissional para a equipe de manutenção."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Nome do Profissional</label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Horário de Trabalho</label>
                <Input 
                  placeholder="Ex: Seg a Sex, 08:00 às 17:00" 
                  value={horarioTrabalho}
                  onChange={e => setHorarioTrabalho(e.target.value)}
                  className="rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">E-mail para Acesso</label>
                <Input 
                  type="email"
                  placeholder="Ex: joao@condominio.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl bg-slate-50 border-none"
                  disabled={!!editingId}
                />
                <p className="text-xs text-slate-500">
                  {editingId ? "O e-mail de acesso não pode ser alterado por aqui." : "Obrigatório para o zelador acessar o aplicativo."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => handleOpenChange(false)} className="rounded-xl">Cancelar</Button>
              <Button 
                onClick={() => cadastrarZelador.mutate()} 
                disabled={cadastrarZelador.isPending || !nome || (!editingId && !email)}
                className="bg-primary hover:opacity-90 text-white rounded-xl"
              >
                {cadastrarZelador.isPending ? "Salvando..." : "Salvar Profissional"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Buscar zelador por nome..." 
          className="pl-11 h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))
        ) : filteredZeladores?.length === 0 ? (
          <Card className="md:col-span-3 border-none shadow-sm bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-800">Nenhum zelador cadastrado</h3>
            <p className="text-slate-500 font-medium max-w-xs mt-2">
              Cadastre um zelador para começar a atribuir ordens de serviço.
            </p>
          </Card>
        ) : (
          filteredZeladores?.map((zelador) => (
            <Card key={zelador.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                      {zelador.nome[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 leading-tight">{zelador.nome}</h3>
                      <Badge variant="outline" className="mt-1 bg-primary/5 text-primary border-primary/20 text-[10px] uppercase">Zelador</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                      <DropdownMenuItem className="gap-2 font-bold text-slate-600 focus:text-primary">
                        <ShieldCheck className="w-4 h-4" /> Ver Atividades
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 font-bold text-slate-600 focus:text-primary"
                        onClick={() => handleEdit(zelador)}
                      >
                        <Pencil className="w-4 h-4" /> Editar Dados
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 font-bold text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm("Deseja realmente remover este zelador? Ele não poderá mais acessar o painel.")) {
                            removerZelador.mutate(zelador.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-bold">{zelador.telefone || "Não informado"}</span>
                  </div>
                  {zelador.horario_trabalho && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-bold">{zelador.horario_trabalho}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-bold">Desde {new Date(zelador.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                     <span className="text-xs font-black text-green-600">Ativo</span>
                   </div>
                   <Button variant="outline" className="rounded-xl h-9 text-xs font-bold border-slate-200 text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20">
                     Ver Histórico
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
