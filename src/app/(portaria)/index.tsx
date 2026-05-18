import { useState, useRef } from "react"
import { useAuthStore } from "../../stores/authStore"
import { useTenantStore } from "../../stores/tenantStore"
import { supabase } from "../../lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "../../components/ui/card"
import { 
  Package, 
  PlusCircle, 
  Search, 
  LogOut, 
  Camera, 
  Building2, 
  CheckCircle2, 
  X,
  ArrowRight,
  Loader2,
  Calendar,
  Eye
} from "lucide-react"
import { Skeleton } from "../../components/ui/skeleton"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { toast } from "sonner"

export default function PortariaConsole() {
  const { perfil } = useAuthStore()
  const { tenant } = useTenantStore()
  const queryClient = useQueryClient()

  // Estados dos Modais
  const [openRegister, setOpenRegister] = useState(false)
  const [openCheckout, setOpenCheckout] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null)
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  // Estados de Filtros e Abas
  const [activeTab, setActiveTab] = useState<'pendentes' | 'historico'>('pendentes')
  const [searchTerm, setSearchTerm] = useState("")

  // Estados do Cadastro de Encomenda
  const [destinatarioNome, setDestinatarioNome] = useState("")
  const [unidade, setUnidade] = useState("")
  const [bloco, setBloco] = useState("")
  const [descricao, setDescricao] = useState("")
  const [codigoRastreio, setCodigoRastreio] = useState("")
  const [selectedMorador, setSelectedMorador] = useState<any | null>(null)
  const [searchMoradorQuery, setSearchMoradorQuery] = useState("")
  const [showMoradorSuggestions, setShowMoradorSuggestions] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  
  // Estado de Upload de Foto
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados da Baixa (Checkout)
  const [retiradoPorNome, setRetiradoPorNome] = useState("")
  const [checkoutPreset, setCheckoutPreset] = useState("O próprio morador")

  // 1. Busca moradores aprovados para autocomplete
  const { data: moradores } = useQuery({
    queryKey: ['portaria-moradores', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, unidade, bloco')
        .eq('condominio_id', tenant?.id)
        .eq('role', 'morador')
        .eq('status_aprovacao', true)
        .order('nome')

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // 2. Busca encomendas do condomínio
  const { data: encomendas, isLoading } = useQuery({
    queryKey: ['portaria-encomendas', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          morador:morador_id(nome, telefone, email)
        `)
        .eq('condominio_id', tenant?.id)
        .order('criado_em', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenant?.id,
  })

  // Mutação para Cadastrar Encomenda
  const cadastrarEncomenda = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('encomendas')
        .insert({
          condominio_id: tenant?.id,
          morador_id: manualMode ? null : selectedMorador?.id || null,
          destinatario_nome: manualMode ? destinatarioNome.trim() : selectedMorador?.nome || destinatarioNome.trim(),
          unidade: manualMode ? unidade.trim() : selectedMorador?.unidade || unidade.trim(),
          bloco: (manualMode ? bloco.trim() : selectedMorador?.bloco || bloco.trim()) || null,
          descricao: descricao.trim() || null,
          codigo_rastreio: codigoRastreio.trim() || null,
          foto_url: fotoUrl,
          recebido_por: perfil?.id,
          status: 'pendente'
        })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Encomenda cadastrada e morador notificado!")
      handleCloseRegister()
      queryClient.invalidateQueries({ queryKey: ['portaria-encomendas'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar encomenda: " + error.message)
    }
  })

  // Mutação para dar baixa na Encomenda
  const darBaixaEncomenda = useMutation({
    mutationFn: async () => {
      const nomeFinal = checkoutPreset === "Outro" ? retiradoPorNome.trim() : checkoutPreset
      if (!nomeFinal) throw new Error("Informe quem está retirando a encomenda.")

      const { error } = await supabase
        .from('encomendas')
        .update({
          status: 'entregue',
          data_retirada: new Date().toISOString(),
          retirado_por_nome: nomeFinal
        })
        .eq('id', selectedPackage.id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Baixa realizada com sucesso!")
      setOpenCheckout(false)
      setSelectedPackage(null)
      setRetiradoPorNome("")
      setCheckoutPreset("O próprio morador")
      queryClient.invalidateQueries({ queryKey: ['portaria-encomendas'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao dar baixa: " + error.message)
    }
  })

  // Lógica de Upload de Foto para Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    // Criar preview visual local
    const reader = new FileReader()
    reader.onloadend = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant?.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('encomendas')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('encomendas')
        .getPublicUrl(fileName)

      setFotoUrl(publicUrl)
      toast.success("Foto do pacote anexada!")
    } catch (error: any) {
      toast.error("Erro ao fazer upload da foto: " + error.message)
      setFotoPreview(null)
      setFotoUrl(null)
    } finally {
      setUploadingFile(false)
    }
  }

  // Filtragem de Moradores no Autocomplete
  const filteredMoradoresSuggestions = moradores?.filter(m => 
    m.nome.toLowerCase().includes(searchMoradorQuery.toLowerCase()) ||
    m.unidade.toLowerCase().includes(searchMoradorQuery.toLowerCase())
  ).slice(0, 5) || []

  // Fechar Registro
  const handleCloseRegister = () => {
    setOpenRegister(false)
    setDestinatarioNome("")
    setUnidade("")
    setBloco("")
    setDescricao("")
    setCodigoRastreio("")
    setSelectedMorador(null)
    setSearchMoradorQuery("")
    setManualMode(false)
    setFotoUrl(null)
    setFotoPreview(null)
  }

  // Logout do Porteiro
  const handleLogout = async () => {
    if (confirm("Deseja realmente sair do console de Portaria?")) {
      await supabase.auth.signOut()
    }
  }

  // Filtragem das Encomendas na Lista Principal
  const filteredEncomendas = encomendas?.filter(enc => {
    const matchesTab = activeTab === 'pendentes' ? enc.status === 'pendente' : enc.status === 'entregue'
    
    const searchString = `${enc.destinatario_nome} ${enc.unidade} ${enc.bloco || ''} ${enc.descricao || ''} ${enc.codigo_rastreio || ''}`.toLowerCase()
    const matchesSearch = searchString.includes(searchTerm.toLowerCase())
    
    return matchesTab && matchesSearch
  }) || []

  // Estatísticas Rápidas
  const stats = {
    pendentes: encomendas?.filter(e => e.status === 'pendente').length || 0,
    entreguesHoje: encomendas?.filter(e => {
      if (e.status !== 'entregue' || !e.data_retirada) return false
      const d = new Date(e.data_retirada)
      return d.toDateString() === new Date().toDateString()
    }).length || 0,
    total: encomendas?.length || 0
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 antialiased">
      {/* Header Premium Mobile-First */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Package className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-slate-800">Portaria & Entregas</h1>
              <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                {tenant?.nome || "Carregando..."}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="rounded-2xl hover:bg-red-50 hover:text-red-600 text-slate-500 h-10 w-10 transition-all shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 flex flex-col gap-6">
        
        {/* Banner de Ação Primária & Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2 border-none shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative group">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-48 h-48" />
            </div>
            <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
              <div>
                <h2 className="text-xl font-black leading-tight tracking-tight">Guarita de Controle</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">Registre novos pacotes que chegam dos correios e transportadoras.</p>
              </div>
              <Button 
                onClick={() => setOpenRegister(true)}
                className="bg-primary hover:bg-primary/95 text-white rounded-2xl h-12 w-full mt-4 font-black shadow-lg shadow-primary/20 gap-2 active:scale-95 transition-all text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                Receber Encomenda
              </Button>
            </CardContent>
          </Card>

          {/* Métrica 1: Pendentes */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50 flex flex-col justify-between min-h-[120px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando Retirada</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-amber-600 leading-none">{stats.pendentes}</span>
              <span className="text-xs font-bold text-slate-400">pacotes</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 rounded-lg px-2 py-0.5 mt-2 self-start">Fila de Espera</span>
          </div>

          {/* Métrica 2: Entregues Hoje */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50 flex flex-col justify-between min-h-[120px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregues Hoje</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black text-green-600 leading-none">{stats.entreguesHoje}</span>
              <span className="text-xs font-bold text-slate-400">baixados</span>
            </div>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 rounded-lg px-2 py-0.5 mt-2 self-start">Sucesso Diário</span>
          </div>
        </div>

        {/* Fila & Lista de Encomendas */}
        <div className="flex flex-col gap-4">
          
          {/* Navegação de Abas Premium */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('pendentes')}
                className={`pb-2 px-3 text-sm font-black transition-all border-b-2 relative ${
                  activeTab === 'pendentes' ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Ativas ({stats.pendentes})
              </button>
              <button 
                onClick={() => setActiveTab('historico')}
                className={`pb-2 px-3 text-sm font-black transition-all border-b-2 relative ${
                  activeTab === 'historico' ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Histórico Entregue
              </button>
            </div>
          </div>

          {/* Barra de Busca Dinâmica */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar por unidade, bloco, morador ou rastreio..." 
              className="pl-11 h-12 rounded-2xl border-slate-200/60 bg-white shadow-sm focus:ring-primary/20 text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de Encomendas */}
          <div className="grid gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-3xl bg-slate-200/60" />
              ))
            ) : filteredEncomendas.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                <Package className="w-12 h-12 text-slate-200 mb-3" />
                <h3 className="text-lg font-black text-slate-700">Nenhuma encomenda</h3>
                <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
                  Nenhum pacote encontrado com estes filtros ou critérios de busca.
                </p>
              </div>
            ) : (
              filteredEncomendas.map((enc) => (
                <Card 
                  key={enc.id} 
                  className={`border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 bg-white ${
                    enc.status === 'pendente' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-green-500'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Informações da Encomenda */}
                    <div className="flex items-start gap-4">
                      
                      {/* Foto / Thumbnail */}
                      <div className="shrink-0">
                        {enc.foto_url ? (
                          <div 
                            onClick={() => setZoomPhoto(enc.foto_url)}
                            className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-100 overflow-hidden cursor-pointer hover:opacity-90 relative group shadow-sm"
                          >
                            <img src={enc.foto_url} alt="Pacote" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                            <Package className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* Dados principais */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                            Unid: {enc.unidade} {enc.bloco ? `• Bloco ${enc.bloco}` : ''}
                          </span>
                          {enc.status === 'pendente' ? (
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-none rounded-lg text-[9px] uppercase tracking-wider font-extrabold h-5 px-1.5">
                              Pendente
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white border-none rounded-lg text-[9px] uppercase tracking-wider font-extrabold h-5 px-1.5">
                              Entregue
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 text-base leading-tight mt-1">{enc.destinatario_nome}</h4>
                        {enc.descricao && <p className="text-xs text-slate-500 font-medium">{enc.descricao}</p>}
                        
                        {/* Rodapé Interno com Datas */}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-2">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          <span>Entrada: {new Date(enc.data_recebimento).toLocaleDateString('pt-BR')} às {new Date(enc.data_recebimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {enc.status === 'entregue' && enc.data_retirada && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50/50 px-2 py-1 rounded-lg self-start mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Retirado por: {enc.retirado_por_nome} em {new Date(enc.data_retirada).toLocaleDateString('pt-BR')} às {new Date(enc.data_retirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação para Pendentes */}
                    {enc.status === 'pendente' && (
                      <Button 
                        onClick={() => {
                          setSelectedPackage(enc)
                          setOpenCheckout(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 px-5 font-black text-xs shadow-md shadow-primary/10 gap-2 shrink-0 active:scale-95 transition-all self-end sm:self-center"
                      >
                        Entregar Pacote
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ==========================================================
          MODAL: REGISTRAR ENCOMENDA
          ========================================================== */}
      <Dialog open={openRegister} onOpenChange={(val) => { if (!val) handleCloseRegister() }}>
        <DialogContent className="max-w-[420px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Registrar Encomenda</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Preencha os dados do pacote que acabou de chegar.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-3">
            
            {/* Toggle: Morador Cadastrado / Manual */}
            <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1">
              <button 
                type="button"
                onClick={() => setManualMode(false)}
                className={`flex-1 text-center py-1.5 text-xs font-black rounded-lg transition-all ${
                  !manualMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Buscar Morador
              </button>
              <button 
                type="button"
                onClick={() => {
                  setManualMode(true)
                  setSelectedMorador(null)
                  setSearchMoradorQuery("")
                }}
                className={`flex-1 text-center py-1.5 text-xs font-black rounded-lg transition-all ${
                  manualMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Digitação Manual
              </button>
            </div>

            {/* Modo de Busca no Autocomplete */}
            {!manualMode ? (
              <div className="relative flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Buscar por Unidade ou Nome</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Busque ex: 102 ou Jayson..."
                    value={searchMoradorQuery}
                    onChange={(e) => {
                      setSearchMoradorQuery(e.target.value)
                      setShowMoradorSuggestions(true)
                      setSelectedMorador(null)
                    }}
                    onFocus={() => setShowMoradorSuggestions(true)}
                    className="pl-9 h-11 bg-slate-50 border-none rounded-xl text-sm font-medium"
                  />
                </div>

                {/* Dropdown de Sugestões */}
                {showMoradorSuggestions && searchMoradorQuery.trim().length > 0 && (
                  <div className="absolute top-[70px] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                    {filteredMoradoresSuggestions.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold p-3 text-center">Nenhum morador ativo encontrado.</p>
                    ) : (
                      filteredMoradoresSuggestions.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMorador(m)
                            setSearchMoradorQuery(`${m.nome} (Ap: ${m.unidade} ${m.bloco ? `• Bl. ${m.bloco}` : ''})`)
                            setShowMoradorSuggestions(false)
                          }}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                            {m.unidade}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 leading-tight">{m.nome}</span>
                            <span className="text-[10px] text-slate-400 font-bold">Unidade {m.unidade} {m.bloco ? `• Bloco ${m.bloco}` : ''}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedMorador && (
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl mt-1 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-700">Morador selecionado:</p>
                      <p className="text-[10px] text-slate-500 font-bold">{selectedMorador.nome} — Apto {selectedMorador.unidade} {selectedMorador.bloco ? `• Bloco ${selectedMorador.bloco}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Modo Manual
              <div className="flex flex-col gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome do Destinatário</label>
                  <Input 
                    placeholder="Escreva o nome do rótulo da caixa..."
                    value={destinatarioNome}
                    onChange={(e) => setDestinatarioNome(e.target.value)}
                    className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Unidade / Ap</label>
                    <Input 
                      placeholder="Ex: 104"
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                      className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Bloco (opcional)</label>
                    <Input 
                      placeholder="Ex: Bloco A"
                      value={bloco}
                      onChange={(e) => setBloco(e.target.value)}
                      className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Descrição do Pacote */}
            <div className="grid gap-1">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Descrição do Pacote</label>
              <Input 
                placeholder="Ex: Caixa média Mercado Livre, envelope pardo..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium"
              />
            </div>

            {/* Código de Rastreio */}
            <div className="grid gap-1">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Código de Rastreio (opcional)</label>
              <Input 
                placeholder="Ex: BR123456789BR"
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium animate-in"
              />
            </div>

            {/* Câmera / Upload de Imagem */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Foto da Encomenda (Opcional)</label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
              
              {fotoPreview ? (
                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50 flex items-center justify-center">
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoPreview(null)
                      setFotoUrl(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="w-full h-20 rounded-2xl bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-200 text-slate-400 transition-all font-bold hover:text-primary active:scale-[0.98]"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                  <span className="text-[10px] uppercase tracking-wide">
                    {uploadingFile ? "Carregando foto..." : "Tirar Foto com a Câmera"}
                  </span>
                </button>
              )}
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={handleCloseRegister} className="rounded-xl h-11 text-xs font-bold text-slate-500">
              Cancelar
            </Button>
            <Button 
              onClick={() => cadastrarEncomenda.mutate()} 
              disabled={
                cadastrarEncomenda.isPending || 
                uploadingFile || 
                (!manualMode && !selectedMorador) || 
                (manualMode && (!destinatarioNome || !unidade))
              }
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-black text-xs shadow-md shadow-primary/10 gap-2 px-5"
            >
              {cadastrarEncomenda.isPending ? "Cadastrando..." : "Registrar Entrada"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: DAR BAIXA (ENTREGAR ENCOMENDA)
          ========================================================== */}
      <Dialog open={openCheckout} onOpenChange={(val) => { if (!val) { setOpenCheckout(false); setSelectedPackage(null) } }}>
        <DialogContent className="max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Confirmar Entrega</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Quem está retirando este pacote na portaria?</DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="flex flex-col gap-4 py-3">
              
              {/* Resumo do pacote selecionado */}
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Destinatário</span>
                <p className="text-sm font-black text-slate-800">{selectedPackage.destinatario_nome}</p>
                <p className="text-xs text-slate-500 font-bold">Apto {selectedPackage.unidade} {selectedPackage.bloco ? `• Bloco ${selectedPackage.bloco}` : ''}</p>
              </div>

              {/* Seletor Rápido de Quem Retira */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Quem está retirando?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "O próprio morador",
                    "Familiar (Cônjuge/Filho)",
                    "Funcionário doméstico",
                    "Outro"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCheckoutPreset(preset)
                        if (preset !== "Outro") setRetiradoPorNome("")
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl text-center border transition-all ${
                        checkoutPreset === preset 
                          ? 'bg-primary/5 text-primary border-primary font-black shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Manual para "Outro" */}
              {checkoutPreset === "Outro" && (
                <div className="grid gap-1 animate-in fade-in duration-300">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Escreva o Nome de quem retirou</label>
                  <Input 
                    placeholder="Nome completo do responsável..."
                    value={retiradoPorNome}
                    onChange={(e) => setRetiradoPorNome(e.target.value)}
                    className="h-11 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-primary/20"
                  />
                </div>
              )}

            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => { setOpenCheckout(false); setSelectedPackage(null) }} className="rounded-xl h-11 text-xs font-bold text-slate-500">
              Cancelar
            </Button>
            <Button 
              onClick={() => darBaixaEncomenda.mutate()} 
              disabled={darBaixaEncomenda.isPending || (checkoutPreset === "Outro" && !retiradoPorNome.trim())}
              className="bg-green-600 hover:bg-green-500 text-white rounded-xl h-11 font-black text-xs shadow-md shadow-green-600/10 gap-2 px-5"
            >
              {darBaixaEncomenda.isPending ? "Concluindo..." : "Confirmar Entrega"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: ZOOM DA FOTO DO PACOTE
          ========================================================== */}
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
