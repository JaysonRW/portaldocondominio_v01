import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useTenantStore } from "../../../stores/tenantStore"
import { useAuthStore } from "../../../stores/authStore"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FileText, 
  Link as LinkIcon, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin,
  Info
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { toast } from "sonner"

// Mapeamento de categorias e cores
const categoriasOptions = [
  { value: "contatos", label: "Contatos", color: "bg-blue-100 text-blue-800" },
  { value: "servicos_essenciais", label: "Serviços Essenciais", color: "bg-emerald-100 text-emerald-800" },
  { value: "mudanca", label: "Mudança", color: "bg-amber-100 text-amber-800" },
  { value: "acessos", label: "Acessos", color: "bg-purple-100 text-purple-800" },
  { value: "coleta_descarte", label: "Coleta e Descarte", color: "bg-green-100 text-green-800" },
  { value: "seguranca", label: "Segurança", color: "bg-red-100 text-red-800" },
  { value: "app_oficial", label: "App Oficial", color: "bg-indigo-100 text-indigo-800" },
  { value: "administradora", label: "Administradora", color: "bg-slate-100 text-slate-800" },
  { value: "regras_rapidas", label: "Regras Rápidas", color: "bg-orange-100 text-orange-800" },
  { value: "links_uteis", label: "Links Úteis", color: "bg-teal-100 text-teal-800" },
  { value: "outros", label: "Outros", color: "bg-gray-100 text-gray-800" },
]

export default function GuiaMoradorAdmin() {
  const { tenant } = useTenantStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("outros")
  const [tipoAcao, setTipoAcao] = useState("nenhum")
  const [textoBotao, setTextoBotao] = useState("")
  const [url, setUrl] = useState("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [endereco, setEndereco] = useState("")
  const [observacao, setObservacao] = useState("")

  const resetForm = () => {
    setEditingId(null)
    setTitulo("")
    setDescricao("")
    setCategoria("outros")
    setTipoAcao("nenhum")
    setTextoBotao("")
    setUrl("")
    setTelefone("")
    setWhatsapp("")
    setEmail("")
    setEndereco("")
    setObservacao("")
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setTitulo(item.titulo || "")
    setDescricao(item.descricao || "")
    setCategoria(item.categoria || "outros")
    setTipoAcao(item.tipo_acao || "nenhum")
    setTextoBotao(item.texto_botao || "")
    setUrl(item.url || "")
    setTelefone(item.telefone || "")
    setWhatsapp(item.whatsapp || "")
    setEmail(item.email || "")
    setEndereco(item.endereco || "")
    setObservacao(item.observacao || "")
    setOpenModal(true)
  }

  const { data: itens, isLoading } = useQuery({
    queryKey: ['guia_morador_itens', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      const { data, error } = await supabase
        .from('guia_morador_itens')
        .select('*')
        .eq('condominio_id', tenant.id)
        .order('categoria')
        .order('criado_em', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })

  const saveItem = useMutation({
    mutationFn: async () => {
      const payload = {
        condominio_id: tenant?.id,
        titulo,
        descricao,
        categoria,
        tipo_acao: tipoAcao,
        texto_botao: textoBotao,
        url,
        telefone,
        whatsapp,
        email,
        endereco,
        observacao,
        criado_por: user?.id,
      }

      if (editingId) {
        const { error } = await supabase.from('guia_morador_itens').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('guia_morador_itens').insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guia_morador_itens'] })
      toast.success(editingId ? "Item atualizado!" : "Item criado!")
      setOpenModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`)
    }
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guia_morador_itens').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guia_morador_itens'] })
      toast.success("Item removido!")
    }
  })

  const getAcaoIcon = (tipo: string) => {
    switch(tipo) {
      case 'link': return <LinkIcon className="w-4 h-4" />
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'telefone': return <Phone className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'endereco': return <MapPin className="w-4 h-4" />
      default: return null
    }
  }

  const getCategoriaLabel = (val: string) => categoriasOptions.find(c => c.value === val)?.label || val
  const getCategoriaColor = (val: string) => categoriasOptions.find(c => c.value === val)?.color || "bg-slate-100 text-slate-800"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Guia do Morador
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Gerencie contatos, orientações e serviços essenciais.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={(val) => { setOpenModal(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">
                {editingId ? "Editar Item do Guia" : "Novo Item para o Guia"}
              </DialogTitle>
              <DialogDescription>
                Adicione contatos rápidos, links e orientações para os moradores.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Categoria</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    {categoriasOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Título</label>
                  <Input 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    placeholder="Ex: Ligação de Energia (Copel)" 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Descrição (Opcional)</label>
                <Textarea 
                  value={descricao} 
                  onChange={e => setDescricao(e.target.value)} 
                  placeholder="Empresa responsável: Copel. Solicite a ligação pelo site..." 
                  className="resize-none"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Observação no Rodapé (Opcional)</label>
                <Input 
                  value={observacao} 
                  onChange={e => setObservacao(e.target.value)} 
                  placeholder="Ex: Antes de mudar, consulte as regras no FAQ." 
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Ação do Botão</h4>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tipo de Ação</label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      value={tipoAcao}
                      onChange={(e) => setTipoAcao(e.target.value)}
                    >
                      <option value="nenhum">Nenhum botão</option>
                      <option value="link">Abrir Link (URL)</option>
                      <option value="whatsapp">Chamar no WhatsApp</option>
                      <option value="telefone">Ligar (Telefone)</option>
                      <option value="email">Enviar E-mail</option>
                      <option value="endereco">Ver no Mapa</option>
                    </select>
                  </div>
                  
                  {tipoAcao !== "nenhum" && (
                    <div className="grid gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Texto do Botão</label>
                      <Input 
                        value={textoBotao} 
                        onChange={e => setTextoBotao(e.target.value)} 
                        placeholder="Ex: Falar com Suporte" 
                      />
                    </div>
                  )}
                </div>

                {tipoAcao === "link" && (
                  <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                )}
                {tipoAcao === "whatsapp" && (
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ex: 5541999999999 (Apenas números)" />
                )}
                {tipoAcao === "telefone" && (
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Ex: (41) 3333-3333" />
                )}
                {tipoAcao === "email" && (
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" />
                )}
                {tipoAcao === "endereco" && (
                  <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço completo para o mapa" />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button onClick={() => saveItem.mutate()} disabled={saveItem.isPending || !titulo}>
                {saveItem.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Carregando itens...</div>
      ) : itens?.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Info className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-700 mb-2">Nenhum item cadastrado</h3>
            <p className="text-slate-500 max-w-sm">
              Comece adicionando os contatos da administradora, regras de mudança ou fornecedores de energia/gás.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itens?.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all bg-white border-slate-200 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`border-none font-black text-[10px] px-2 py-0.5 uppercase tracking-widest ${getCategoriaColor(item.categoria)}`}>
                    {getCategoriaLabel(item.categoria)}
                  </Badge>
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => handleEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => {
                      if(window.confirm('Excluir este item?')) deleteItem.mutate(item.id)
                    }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg font-black text-slate-800 leading-tight">
                  {item.titulo}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col gap-4 text-sm">
                {item.descricao && (
                  <p className="text-slate-600 whitespace-pre-wrap">{item.descricao}</p>
                )}
                
                {item.tipo_acao !== 'nenhum' && (
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-700 font-bold bg-slate-50/50 p-3 rounded-xl">
                    {getAcaoIcon(item.tipo_acao)}
                    <span>{item.texto_botao || "Ação configurada"}</span>
                    <span className="text-xs font-normal text-slate-400 ml-auto">({item.tipo_acao})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
