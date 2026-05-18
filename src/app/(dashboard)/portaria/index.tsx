import { useState } from "react"
import { Link } from "react-router"
import { useTenantStore } from "../../../stores/tenantStore"
import { useAuthStore } from "../../../stores/authStore"
import { supabase } from "../../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { 
  Users, 
  UserPlus, 
  Search, 
  Package, 
  MoreVertical, 
  Trash2, 
  ArrowLeft, 
  Mail, 
  ClipboardList, 
  Clock, 
  Eye, 
  X,
  FileSpreadsheet
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

export default function GestaoPortaria() {
  const { tenant } = useTenantStore()
  const { perfil } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<'contas' | 'auditoria'>('contas')
  const [searchTerm, setSearchTerm] = useState("")
  const [openModal, setOpenModal] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  // Segurança de role - Síndico apenas
  if (perfil?.role !== 'sindico') {
    return <div className="p-8 font-black text-red-600">Acesso negado. Apenas o Síndico Administrador pode acessar este console.</div>
  }

  // Limpar formulário
  const handleOpenChange = (open: boolean) => {
    setOpenModal(open)
    if (!open) {
      setNome("")
      setEmail("")
    }
  }

  // Busca Contas de Portaria (perfis de role = 'portaria')
  const { data: portarias, isLoading: isLoadingPortarias } = useQuery({
    queryKey: ['portarias-list', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .eq('role', 'portaria')
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // Busca todas as encomendas do condomínio (Auditoria Geral)
  const { data: todasEncomendas, isLoading: isLoadingEncomendas } = useQuery({
    queryKey: ['auditoria-encomendas-list', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id && activeTab === 'auditoria',
  })

  // Criar conta de Portaria
  const cadastrarPortaria = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('invite-condominio-user', {
        body: {
          nome,
          email: email.trim(),
          role: 'portaria',
          condominio_id: tenant?.id
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success("Conta de Portaria criada e convite enviado por e-mail com sucesso!")
      handleOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['portarias-list'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao criar conta de Portaria: " + error.message)
    }
  })

  // Remover / Inativar Portaria
  const removerPortaria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('perfis')
        .update({ ativo: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Acesso da Portaria inativado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['portarias-list'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao inativar acesso: " + error.message)
    }
  })

  // Remover registro de Encomenda (Auditoria)
  const excluirEncomenda = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('encomendas')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Registro de encomenda excluído com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['auditoria-encomendas-list'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir encomenda: " + error.message)
    }
  })

  // Filtros
  const filteredPortarias = portarias?.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEncomendas = todasEncomendas?.filter(e => 
    e.destinatario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.codigo_rastreio && e.codigo_rastreio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    e.unidade.includes(searchTerm) ||
    (e.bloco && e.bloco.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header com Navegação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl shrink-0">
            <Link to={withTenantPrefix("/painel", tenant?.slug)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mb-2 shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Controle de Portaria & Entregas</h1>
            <p className="text-slate-500 font-medium mt-1">Gerencie acessos da portaria e audite os registros de encomendas.</p>
          </div>
        </div>

        {activeTab === 'contas' && (
          <Dialog open={openModal} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:opacity-90 text-white rounded-xl px-6 gap-2 shadow-lg shadow-primary/20">
                <UserPlus className="h-4 w-4" />
                Cadastrar Acesso de Portaria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800">Nova Portaria</DialogTitle>
                <DialogDescription>
                  Gere uma credencial de acesso exclusiva para a equipe de portaria (Guarita, Portaria A, B, etc.).
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">Nome de Identificação da Guarita/Porteiro</label>
                  <Input 
                    placeholder="Ex: Guarita Principal ou Portaria Noturna" 
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="rounded-xl bg-slate-50 border-none h-12 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-700">E-mail para Logon</label>
                  <Input 
                    type="email"
                    placeholder="Ex: portaria.principal@condominio.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl bg-slate-50 border-none h-12 font-bold"
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    Será enviado um e-mail de confirmação de senha para este endereço.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="rounded-xl">Cancelar</Button>
                <Button 
                  onClick={() => cadastrarPortaria.mutate()} 
                  disabled={cadastrarPortaria.isPending || !nome || !email}
                  className="bg-primary hover:opacity-90 text-white rounded-xl"
                >
                  {cadastrarPortaria.isPending ? "Criando..." : "Criar Credencial"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => { setActiveTab('contas'); setSearchTerm(''); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'contas' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            Contas de Portaria ({portarias?.length || 0})
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('auditoria'); setSearchTerm(''); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'auditoria' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Auditoria Geral
          </div>
        </button>
      </div>

      {/* Busca Dinâmica */}
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder={activeTab === 'contas' ? "Buscar portaria por nome ou e-mail..." : "Buscar por morador, rastreio, unidade..."} 
          className="pl-11 h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Aba 1: Contas de Portaria */}
      {activeTab === 'contas' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingPortarias ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))
          ) : filteredPortarias?.length === 0 ? (
            <Card className="md:col-span-3 border-none shadow-sm bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-slate-200 mb-4" />
              <h3 className="text-xl font-black text-slate-800">Nenhuma guarita cadastrada</h3>
              <p className="text-slate-500 font-medium max-w-xs mt-2">
                Cadastre as portarias físicas para permitir que registrem encomendas.
              </p>
            </Card>
          ) : (
            filteredPortarias?.map((portaria) => (
              <Card key={portaria.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-lg">
                        {portaria.nome[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 leading-tight">{portaria.nome}</h3>
                        <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-600 border-amber-200 text-[10px] uppercase font-bold">Portaria</Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                        <DropdownMenuItem 
                          className="gap-2 font-bold text-red-600 focus:text-red-600"
                          onClick={() => {
                            if (confirm(`Deseja inativar o acesso da guarita "${portaria.nome}"? Ela perderá acesso imediato.`)) {
                              removerPortaria.mutate(portaria.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" /> Remover Acesso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-bold truncate max-w-[200px]">{portaria.email || "Sem e-mail"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-bold">Criada em {new Date(portaria.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</span>
                      <span className={`text-xs font-black ${portaria.ativo !== false ? 'text-green-600' : 'text-red-600'}`}>
                        {portaria.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <Button variant="outline" className="rounded-xl h-9 text-xs font-bold border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200">
                      Auditar Logins
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Aba 2: Auditoria Geral de Encomendas */}
      {activeTab === 'auditoria' && (
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-800">Registro de Auditoria de Entregas</CardTitle>
              <CardDescription className="font-medium">Histórico e trilha completa de todas as encomendas entregues no condomínio.</CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-bold gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Exportar XLS
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingEncomendas ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredEncomendas?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-slate-200 mb-4" />
                <h3 className="text-lg font-black text-slate-700">Nenhuma encomenda registrada</h3>
                <p className="text-slate-400 font-medium text-sm mt-1">Nenhuma entrega corresponde aos filtros ou está cadastrada neste condomínio.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-4 px-6">Foto</th>
                      <th className="py-4 px-6">Destinatário / Unidade</th>
                      <th className="py-4 px-6">Rastreio / Pacote</th>
                      <th className="py-4 px-6">Recebimento (Portaria)</th>
                      <th className="py-4 px-6">Status / Retirada</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEncomendas?.map((enc) => (
                      <tr key={enc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Foto do Pacote */}
                        <td className="py-4 px-6">
                          {enc.foto_url ? (
                            <div 
                              onClick={() => setZoomPhoto(enc.foto_url)}
                              className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden cursor-pointer relative group"
                            >
                              <img src={enc.foto_url} alt="Pacote" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </td>

                        {/* Unidade & Bloco */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800">{enc.destinatario}</span>
                            <span className="text-xs font-bold text-slate-400">
                              Apto {enc.unidade} {enc.bloco ? `• Bloco ${enc.bloco}` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Código de Rastreio / Descrição */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-700">{enc.descricao || "Pacote / Caixa"}</span>
                            {enc.codigo_rastreio ? (
                              <code className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit font-bold">
                                {enc.codigo_rastreio}
                              </code>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Sem Rastreio</span>
                            )}
                          </div>
                        </td>

                        {/* Data e Porteiro Recebedor */}
                        <td className="py-4 px-6 text-xs text-slate-500 font-bold">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(enc.data_recebimento).toLocaleDateString('pt-BR')} às {new Date(enc.data_recebimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Cadastrado por: {enc.porteiro_nome || "Porteiro"}</span>
                          </div>
                        </td>

                        {/* Status de Retirada */}
                        <td className="py-4 px-6">
                          {enc.status === 'pendente' ? (
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white rounded-lg text-[9px] font-extrabold uppercase px-2 py-0.5">
                              Aguardando Retirada
                            </Badge>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-green-600 hover:bg-green-600 text-white rounded-lg text-[9px] font-extrabold uppercase px-2 py-0.5 w-fit">
                                Entregue
                              </Badge>
                              {enc.data_retirada && (
                                <span className="text-[10px] text-green-600 font-black leading-tight">
                                  Retirado por {enc.retirado_por_nome} em {new Date(enc.data_retirada).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Ações de Auditoria */}
                        <td className="py-4 px-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                              <DropdownMenuItem 
                                className="gap-2 font-bold text-red-600 focus:text-red-600"
                                onClick={() => {
                                  if (confirm("ATENÇÃO: Deseja realmente excluir este registro de encomenda permanentemente do histórico de auditoria?")) {
                                    excluirEncomenda.mutate(enc.id)
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" /> Excluir Registro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zoom Dialog para fotos do pacote */}
      <Dialog open={!!zoomPhoto} onOpenChange={(val) => { if (!val) setZoomPhoto(null) }}>
        <DialogContent className="max-w-[480px] rounded-3xl p-2 bg-black border-none overflow-hidden">
          <div className="relative w-full h-[70vh] flex items-center justify-center">
            {zoomPhoto && (
              <img src={zoomPhoto} alt="Zoom Pacote" className="w-full h-full object-contain rounded-2xl" />
            )}
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow z-50 border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
