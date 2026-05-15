import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useMutation } from "@tanstack/react-query"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Switch } from "../../../components/ui/switch"
import { toast } from "sonner"
import { Upload, X, Loader2, Info, ShieldCheck, ShoppingBag, Globe, Star } from "lucide-react"

interface ParceiroFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parceiroToEdit: any | null;
  onSuccess: () => void;
}

export function ParceiroFormModal({ open, onOpenChange, parceiroToEdit, onSuccess }: ParceiroFormModalProps) {
  const { user, perfil } = useAuthStore()
  const { tenant, isMasterMode } = useTenantStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const isSuperAdmin = perfil?.role === 'super_admin' || 
                       user?.app_metadata?.role === 'super_admin' ||
                       isMasterMode || 
                       user?.email === 'propagoumkd@gmail.com'

  const [nomeForm, setNomeForm] = useState("")
  const [descForm, setDescForm] = useState("")
  const [descontoForm, setDescontoForm] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [siteForm, setSiteForm] = useState("")
  const [whatsappForm, setWhatsappForm] = useState("")
  const [isGlobalForm, setIsGlobalForm] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isUploadingPremium, setIsUploadingPremium] = useState(false)

  const [tipoAnunciante, setTipoAnunciante] = useState("parceiro_oficial")
  const [tipoOferta, setTipoOferta] = useState("servico")
  const [categoria, setCategoria] = useState("")
  const [tituloOferta, setTituloOferta] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [bannerPremiumUrl, setBannerPremiumUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  const [selo, setSelo] = useState("parceiro_oficial")
  const [destaque, setDestaque] = useState(false)
  const [status, setStatus] = useState("aprovado")
  const [visibilidade, setVisibilidade] = useState("moradores")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [precoForm, setPrecoForm] = useState("")

  useEffect(() => {
    if (open) {
      if (parceiroToEdit) {
        setNomeForm(parceiroToEdit.nome || "")
        setDescForm(parceiroToEdit.descricao || "")
        setDescontoForm(parceiroToEdit.desconto_info || "")
        setLogoUrl(parceiroToEdit.logo_url || "")
        setSiteForm(parceiroToEdit.link_site || "")
        setWhatsappForm(parceiroToEdit.whatapp_parceiro || "")
        setIsGlobalForm(parceiroToEdit.condominio_id === null)
        
        setTipoAnunciante(parceiroToEdit.tipo_anunciante || "parceiro_oficial")
        setTipoOferta(parceiroToEdit.tipo_oferta || "servico")
        setCategoria(parceiroToEdit.categoria || "")
        setTituloOferta(parceiroToEdit.titulo_oferta || "")
        setBannerUrl(parceiroToEdit.imagem_banner_url || "")
        setBannerPremiumUrl(parceiroToEdit.banner_premium_url || "")
        setInstagramUrl(parceiroToEdit.instagram_url || "")
        setSelo(parceiroToEdit.selo || "parceiro_oficial")
        setDestaque(parceiroToEdit.destaque || false)
        setStatus(parceiroToEdit.status || "aprovado")
        setVisibilidade(parceiroToEdit.visibilidade || "moradores")
        setDataInicio(parceiroToEdit.data_inicio ? new Date(parceiroToEdit.data_inicio).toISOString().split('T')[0] : "")
        setDataFim(parceiroToEdit.data_fim ? new Date(parceiroToEdit.data_fim).toISOString().split('T')[0] : "")
        setPrecoForm(parceiroToEdit.preco ? parceiroToEdit.preco.toString() : "")
      } else {
        setNomeForm("")
        setDescForm("")
        setDescontoForm("")
        setLogoUrl("")
        setSiteForm("")
        setWhatsappForm("")
        setIsGlobalForm(false)
        setTipoAnunciante("parceiro_oficial")
        setTipoOferta("servico")
        setCategoria("")
        setTituloOferta("")
        setBannerUrl("")
        setBannerPremiumUrl("")
        setInstagramUrl("")
        setSelo("parceiro_oficial")
        setDestaque(false)
        setStatus("aprovado")
        setVisibilidade("moradores")
        setDataInicio("")
        setDataFim("")
        setPrecoForm("")
      }
    }
  }, [open, parceiroToEdit])

  const handleFileUpload = async (file: File, type: 'logo' | 'banner' | 'banner_premium') => {
    try {
      if (type === 'logo') setIsUploading(true)
      else if (type === 'banner_premium') setIsUploadingPremium(true)
      else setIsUploadingBanner(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('clube')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('clube')
        .getPublicUrl(filePath)

      if (type === 'logo') setLogoUrl(publicUrl)
      else if (type === 'banner_premium') setBannerPremiumUrl(publicUrl)
      else setBannerUrl(publicUrl)
      
      toast.success(`${type === 'logo' ? 'Logo' : type === 'banner_premium' ? 'Banner Premium' : 'Banner'} carregado com sucesso!`)
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message)
    } finally {
      if (type === 'logo') setIsUploading(false)
      else if (type === 'banner_premium') setIsUploadingPremium(false)
      else setIsUploadingBanner(false)
    }
  }

  const saveParceiro = useMutation({
    mutationFn: async () => {
      if (!nomeForm || !descontoForm) throw new Error("Preencha Nome e Desconto!")
      
      const payload = {
        condominio_id: isGlobalForm ? null : tenant?.id,
        nome: nomeForm,
        descricao: descForm,
        desconto_info: descontoForm,
        logo_url: logoUrl,
        link_site: siteForm,
        whatapp_parceiro: whatsappForm,
        tipo_anunciante: tipoAnunciante,
        tipo_oferta: tipoOferta,
        categoria,
        titulo_oferta: tituloOferta,
        imagem_banner_url: bannerUrl,
        banner_premium_url: bannerPremiumUrl,
        instagram_url: instagramUrl,
        selo,
        destaque,
        status,
        visibilidade,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        preco: tipoOferta === 'produto' && precoForm ? parseFloat(precoForm.replace(',', '.')) : null,
        criado_por: user?.id,
        atualizado_em: new Date().toISOString()
      }

      if (parceiroToEdit) {
        const { error } = await supabase
          .from('clube_parceiros')
          .update(payload)
          .eq('id', parceiroToEdit.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clube_parceiros')
          .insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(parceiroToEdit ? "Parceiro atualizado!" : "Parceiro adicionado à sua vitrine!")
      onSuccess()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error("Falha ao salvar parceiro: " + error.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">
            {parceiroToEdit ? "Editar Anúncio" : "Novo Anúncio de Vantagens"}
          </DialogTitle>
          <DialogDescription className="font-medium">
            {parceiroToEdit 
              ? "Atualize as informações do anúncio ou oferta."
              : "Cadastre uma nova oferta, produto ou serviço para os moradores."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Seção 1: Identificação */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Info className="w-3 h-3" /> Informações do Negócio
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Nome do Negócio</label>
                <Input value={nomeForm} onChange={(e) => setNomeForm(e.target.value)} placeholder="Ex: Propagou Negócios" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Categoria</label>
                <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Marketing Digital" className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Título da Oferta (Curto)</label>
              <Input value={descontoForm} onChange={(e) => setDescontoForm(e.target.value)} placeholder="Ex: 20% de desconto para moradores" className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Descrição Completa</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background p-4 text-sm focus:ring-primary"
                placeholder="Descreva os detalhes da oferta..."
                value={descForm}
                onChange={(e) => setDescForm(e.target.value)}
              />
            </div>
          </div>

          {/* Seção 2: Classificação */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Classificação e Selo
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Tipo de Anunciante</label>
                <select 
                  value={tipoAnunciante} 
                  onChange={(e) => {
                    setTipoAnunciante(e.target.value)
                    // Não forçamos reset do selo se já for premium
                    if (selo !== 'premium') {
                      setSelo(e.target.value === 'morador' ? 'morador_empreendedor' : 'parceiro_oficial')
                    }
                  }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary outline-none"
                >
                  <option value="parceiro_oficial">Parceiro Oficial</option>
                  <option value="morador">Morador</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Destaque de Selo</label>
                <select 
                  value={selo} 
                  onChange={(e) => setSelo(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary outline-none"
                >
                  <option value="parceiro_oficial">Parceiro Oficial</option>
                  <option value="morador_empreendedor">Morador Empreendedor</option>
                  <option value="premium">Parceiro Premium 🌟</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Tipo de Oferta</label>
                <select 
                  value={tipoOferta} 
                  onChange={(e) => setTipoOferta(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary outline-none"
                >
                  <option value="servico">Serviço</option>
                  <option value="produto">Produto</option>
                  <option value="beneficio">Benefício</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            
            {tipoOferta === 'produto' && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-slate-700">Preço do Produto (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                  <Input 
                    type="text" 
                    value={precoForm} 
                    onChange={(e) => setPrecoForm(e.target.value)} 
                    placeholder="0,00" 
                    className="rounded-xl pl-10" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Imagens */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ShoppingBag className="w-3 h-3" /> Imagens
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Logo (Opcional)</label>
                <div className="flex flex-col gap-2">
                  {logoUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border group bg-slate-50 flex items-center justify-center">
                      <img src={logoUrl} alt="Preview" className="w-full h-full object-contain" />
                      <button onClick={() => setLogoUrl("")} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-xl border-dashed" disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Banner Principal (1:1)</label>
                <div className="flex flex-col gap-2">
                  {bannerUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border group bg-slate-50 flex items-center justify-center">
                      <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setBannerUrl("")} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => bannerInputRef.current?.click()} className="h-20 w-20 rounded-xl border-dashed" disabled={isUploadingBanner}>
                      {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  )}
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')} />
                </div>
              </div>
            </div>
            
            {selo === 'premium' && (
              <div className="grid gap-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Banner Premium (Carrossel 1200x400) <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </label>
                <p className="text-xs text-slate-500 mb-1">Este banner aparecerá com destaque no topo do Clube de Vantagens.</p>
                <div className="flex flex-col gap-2">
                  {bannerPremiumUrl ? (
                    <div className="relative w-full h-32 md:h-48 rounded-xl overflow-hidden border group bg-slate-50 flex items-center justify-center">
                      <img src={bannerPremiumUrl} alt="Preview Premium" className="w-full h-full object-cover" />
                      <button onClick={() => setBannerPremiumUrl("")} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-8 h-8 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className={`relative flex flex-col items-center justify-center w-full h-32 md:h-48 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors ${isUploadingPremium ? 'opacity-50 pointer-events-none' : 'border-slate-300'}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploadingPremium ? <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}
                        <p className="text-sm text-slate-500 font-bold">Clique para enviar imagem</p>
                        <p className="text-xs text-slate-400">Recomendado: 1200x400px</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner_premium')} disabled={isUploadingPremium} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seção 4: Contatos e Links */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Globe className="w-3 h-3" /> Contatos e Links
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">WhatsApp</label>
                <Input value={whatsappForm} onChange={(e) => setWhatsappForm(e.target.value)} placeholder="Ex: 11999999999" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Instagram URL</label>
                <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Site Oficial ou Link da Oferta</label>
              <Input value={siteForm} onChange={(e) => setSiteForm(e.target.value)} placeholder="https://..." className="rounded-xl" />
            </div>
          </div>

          {/* Seção 5: Configurações de Exibição */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Star className="w-3 h-3" /> Configurações de Exibição
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Data de Início</label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-700">Data de Término</label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Switch id="destaque" checked={destaque} onCheckedChange={setDestaque} />
                <label htmlFor="destaque" className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                  Destaque <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </label>
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                  <Switch id="global" checked={isGlobalForm} onCheckedChange={setIsGlobalForm} />
                  <label htmlFor="global" className="text-sm font-bold text-purple-900 cursor-pointer">
                    Parceiro Global
                  </label>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="grid gap-2 mt-2">
                <label className="text-sm font-bold text-slate-700">Status Administrativo</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-primary outline-none"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="recusado">Recusado</option>
                  <option value="pausado">Pausado</option>
                  <option value="expirado">Expirado</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
          <Button className="bg-primary hover:opacity-90 text-white rounded-xl px-8" onClick={() => saveParceiro.mutate()} disabled={saveParceiro.isPending || isUploading || isUploadingBanner}>
            {saveParceiro.isPending ? "Salvando..." : (parceiroToEdit ? "Salvar Alterações" : "Publicar Benefício")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
