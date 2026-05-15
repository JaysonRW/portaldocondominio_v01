import { useState, useEffect } from "react"
import { useAuthStore } from "../../../stores/authStore"
import { useTenantStore } from "../../../stores/tenantStore"
import { supabase } from "../../../lib/supabase"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Switch } from "../../../components/ui/switch"
import { cn } from "../../../lib/utils"
import { toast } from "sonner"
import { 
  Settings, 
  Smartphone, 
  Palette, 
  ShieldCheck, 
  Save,
  Bell,
  Gavel,
  FileText,
  ImageIcon,
  Gift,
  CircleHelp,
  ImagePlus,
  Loader2
} from "lucide-react"

export default function CondominioConfig() {
  const { perfil } = useAuthStore()
  const { tenant, setTenant } = useTenantStore()
  const queryClient = useQueryClient()

  const [nomeApp, setNomeApp] = useState(tenant?.app_oficial_nome || "")
  const [urlApp, setUrlApp] = useState(tenant?.app_oficial_url || "")
  const [whatsapp, setWhatsapp] = useState(tenant?.whatsapp_contato || "")
  const [corPrimaria, setCorPrimaria] = useState(tenant?.cor_primaria || "#3E594D")
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || "")
  const [capaUrl, setCapaUrl] = useState(tenant?.capa_url || "")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCapa, setIsUploadingCapa] = useState(false)
  const [modulos, setModulos] = useState<any>(tenant?.modulos_ativos || {
    comunicados: true,
    assembleias: true,
    arquivos: true,
    galeria: true,
    clube: true,
    faq: true
  })

  useEffect(() => {
    if (tenant) {
      setNomeApp(tenant.app_oficial_nome || "")
      setUrlApp(tenant.app_oficial_url || "")
      setWhatsapp(tenant.whatsapp_contato || "")
      setCorPrimaria(tenant.cor_primaria || "#3E594D")
      setLogoUrl(tenant.logo_url || "")
      setCapaUrl(tenant.capa_url || "")
      setModulos(tenant.modulos_ativos || {
        comunicados: true,
        assembleias: true,
        arquivos: true,
        galeria: true,
        clube: true,
        faq: true
      })
    }
  }, [tenant])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant?.id) return

    try {
      setIsUploadingLogo(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('onboarding_fotos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('onboarding_fotos')
        .getPublicUrl(filePath)

      setLogoUrl(publicUrl)
      toast.success("Foto do condomínio carregada com sucesso! Lembre-se de salvar as configurações.")
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant?.id) return

    try {
      setIsUploadingCapa(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}-capa-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('onboarding_fotos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('onboarding_fotos')
        .getPublicUrl(filePath)

      setCapaUrl(publicUrl)
      toast.success("Capa do condomínio carregada com sucesso! Lembre-se de salvar as configurações.")
    } catch (error: any) {
      toast.error("Erro no upload da capa: " + error.message)
    } finally {
      setIsUploadingCapa(false)
    }
  }

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("ID do condomínio não encontrado")
      
      const { data, error } = await supabase
        .from('condominios')
        .update({
          app_oficial_nome: nomeApp,
          app_oficial_url: urlApp,
          whatsapp_contato: whatsapp,
          cor_primaria: corPrimaria,
          logo_url: logoUrl,
          capa_url: capaUrl,
          modulos_ativos: modulos
        })
        .eq('id', tenant.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success("Configurações salvas com sucesso!")
      setTenant(data)
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message)
    }
  })

  const toggleModulo = (modulo: string) => {
    setModulos({ ...modulos, [modulo]: !modulos[modulo] })
  }

  if (perfil?.role === 'morador') {
    return <div className="p-8">Acesso restrito à administração.</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações do Condomínio
        </h1>
        <p className="text-slate-500 font-medium">
          Personalize a experiência dos moradores e gerencie os módulos ativos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Configurações de Integração Operacional */}
        <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              App Operacional (Boletos/Reservas)
            </CardTitle>
            <CardDescription className="font-medium">Defina onde o morador deve realizar operações financeiras.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Nome do App/Sistema</label>
              <Input 
                value={nomeApp} 
                onChange={(e) => setNomeApp(e.target.value)} 
                placeholder="Ex: CondoPlus, SuperLógica, App do Condomínio" 
                className="rounded-xl" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">URL de Acesso (Link)</label>
              <Input 
                value={urlApp} 
                onChange={(e) => setUrlApp(e.target.value)} 
                placeholder="https://app.condominio.com.br" 
                className="rounded-xl" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">WhatsApp da Administração</label>
              <Input 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)} 
                placeholder="(41) 99999-9999" 
                className="rounded-xl" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Identidade Visual */}
        <Card className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Identidade Visual
            </CardTitle>
            <CardDescription className="font-medium">Ajuste as cores principais do portal informativo.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">Foto / Logo do Condomínio</span>
                  <span className="text-xs text-slate-500 font-medium max-w-xs">Aparece no cabeçalho do portal público e nos menus. Recomendado: Imagem quadrada (ex: 400x400px), PNG ou JPG.</span>
                </div>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="w-16 h-16 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white">
                      <img src={logoUrl} alt="Logo do Condomínio" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="relative overflow-hidden rounded-xl border-slate-200 hover:border-primary/50 text-slate-600 hover:text-primary transition-all font-bold"
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingLogo ? "Enviando..." : logoUrl ? "Trocar Imagem" : "Enviar Imagem"}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploadingLogo}
                    />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">Foto de Capa (Banner)</span>
                  <span className="text-xs text-slate-500 font-medium max-w-xs">Aparece como fundo na página inicial do portal. Recomendado: Imagem horizontal (ex: 1920x1080px), PNG ou JPG.</span>
                </div>
                <div className="flex items-center gap-4">
                  {capaUrl ? (
                    <div className="w-24 h-16 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-white">
                      <img src={capaUrl} alt="Capa do Condomínio" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="relative overflow-hidden rounded-xl border-slate-200 hover:border-primary/50 text-slate-600 hover:text-primary transition-all font-bold"
                    disabled={isUploadingCapa}
                  >
                    {isUploadingCapa ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingCapa ? "Enviando..." : capaUrl ? "Trocar Capa" : "Enviar Capa"}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleCapaUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploadingCapa}
                    />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">Cor Primária</span>
                  <span className="text-xs text-slate-500 font-medium">Usada em botões e destaques.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">{corPrimaria}</span>
                  <input 
                    type="color" 
                    value={corPrimaria} 
                    onChange={(e) => setCorPrimaria(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestão de Módulos Ativos */}
        <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Gestão de Módulos (Portal Informativo)
            </CardTitle>
            <CardDescription className="font-medium">Habilite ou desabilite seções do portal conforme a necessidade do seu condomínio.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: "comunicados", label: "Mural de Comunicados", icon: Bell, color: "text-blue-500 bg-blue-50" },
                { id: "assembleias", label: "Gestão de Assembleias", icon: Gavel, color: "text-purple-500 bg-purple-50" },
                { id: "arquivos", label: "Arquivos e Documentos", icon: FileText, color: "text-emerald-500 bg-emerald-50" },
                { id: "galeria", label: "Galeria de Fotos", icon: ImageIcon, color: "text-amber-500 bg-amber-50" },
                { id: "clube", label: "Clube de Vantagens", icon: Gift, color: "text-pink-500 bg-pink-50" },
                { id: "faq", label: "Dúvidas Frequentes (FAQ)", icon: CircleHelp, color: "text-slate-500 bg-slate-100" },
              ].map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", mod.color)}>
                      <mod.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{mod.label}</span>
                  </div>
                  <Switch 
                    checked={modulos[mod.id]} 
                    onCheckedChange={() => toggleModulo(mod.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button variant="ghost" className="rounded-xl font-bold" onClick={() => window.location.reload()}>
          Descartar Alterações
        </Button>
        <Button 
          className="bg-primary hover:opacity-90 rounded-xl px-10 h-14 font-black text-white shadow-xl shadow-primary/20 gap-2"
          onClick={() => saveConfig.mutate()}
          disabled={saveConfig.isPending}
        >
          {saveConfig.isPending ? "Salvando..." : (
            <>
              <Save className="w-5 h-5" />
              Salvar Todas as Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
