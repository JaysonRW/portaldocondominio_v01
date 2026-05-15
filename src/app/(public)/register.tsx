import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { supabase } from "../../lib/supabase"
import { isLocalhostHost, withTenantPrefix } from "../../lib/utils"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const schema = z.object({
  slug: z.string().min(3, "O subdomínio precisa ter 3 caracteres").regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hifens"),
  nome: z.string().min(3, "Digite o nome completo do condomínio"),
  nomeSindico: z.string().min(3, "Digite seu nome"),
  emailSindico: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "Confirme sua senha")
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
})

type FormData = z.infer<typeof schema>

export default function RegisterTenant() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      // 1. Criar o Condomínio
      const { data: condo, error: condoError } = await supabase
        .from('condominios')
        .insert([{ slug: data.slug, nome: data.nome }])
        .select()
        .single()

      if (condoError) {
        if (condoError.code === "23505") { // Unique violation
           throw new Error("Este subdomínio já está em uso.")
        }
        throw condoError
      }

      // 2. Criar o usuário Síndico com e-mail e senha
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.emailSindico,
        password: data.senha,
        options: {
          data: {
            role: 'sindico',
            condominio_id: condo.id,
            nome: data.nomeSindico
          },
          emailRedirectTo: `${window.location.origin}${withTenantPrefix("/auth/callback", data.slug)}`,
        }
      })

      if (signUpError) throw signUpError

      toast.success("Condomínio criado com sucesso!", {
        description: "Verifique seu e-mail para confirmar a conta."
      })
      navigate(withTenantPrefix("/login", isLocalhostHost(window.location.hostname) ? data.slug : null))
    } catch (err: any) {
      toast.error("Impossível criar cadastro", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex bg-muted/20 min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Cadastrar Condomínio</CardTitle>
            <CardDescription>Crie o portal exclusivo do seu condomínio na plataforma Smart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">Subdomínio (URL base)</label>
              <div className="flex items-center space-x-2">
                <Input id="slug" {...register("slug")} placeholder="residencial-flores" />
                <span className="text-sm text-muted-foreground">.condosmart.com.br</span>
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">Nome do Condomínio</label>
              <Input id="nome" {...register("nome")} placeholder="Residencial das Flores" />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <label htmlFor="nomeSindico" className="text-sm font-medium">Nome do Síndico / Gestor</label>
              <Input id="nomeSindico" {...register("nomeSindico")} placeholder="Ex: Maria José" />
              {errors.nomeSindico && <p className="text-sm text-destructive">{errors.nomeSindico.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="emailSindico" className="text-sm font-medium">E-mail Profissional</label>
              <Input id="emailSindico" type="email" {...register("emailSindico")} placeholder="sindico@exemplo.com" />
              {errors.emailSindico && <p className="text-sm text-destructive">{errors.emailSindico.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium">Senha</label>
                <Input id="senha" type="password" {...register("senha")} placeholder="******" />
                {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmarSenha" className="text-sm font-medium">Confirmar Senha</label>
                <Input id="confirmarSenha" type="password" {...register("confirmarSenha")} placeholder="******" />
                {errors.confirmarSenha && <p className="text-sm text-destructive">{errors.confirmarSenha.message}</p>}
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button disabled={isSubmitting} type="submit" className="w-full">
              {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro Gratuito"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
