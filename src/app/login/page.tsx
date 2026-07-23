'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Sprout } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      }
    })
  }

  return (
    <div className="relative flex flex-1 items-center justify-center min-h-screen bg-tinta overflow-hidden px-4 py-10">
      {/* Halos decorativos de marca */}
      <div aria-hidden className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-marca/25 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-crema/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-[420px]">
        <Card className="bg-white border-none rounded-2xl shadow-2xl shadow-black/30">
          <CardHeader className="text-center pb-2">
            <span className="w-16 h-16 rounded-full bg-marca/10 text-marca flex items-center justify-center mx-auto mb-3 ring-4 ring-tinta/10">
              <Sprout className="w-8 h-8" />
            </span>
            <CardTitle className="text-3xl font-heading font-bold text-tinta">Acceso al portal</CardTitle>
            <CardDescription className="font-sans text-muted-foreground mt-2">
              Ingresá con las credenciales que te enviamos por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="mt-4">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="email" className="font-sans text-tinta">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" placeholder="paciente@ejemplo.com" required className="border-tinta/15 h-11" disabled={isPending} />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="password" className="font-sans text-tinta">Contraseña</Label>
                  <Input id="password" name="password" type="password" autoComplete="current-password" required className="border-tinta/15 h-11" disabled={isPending} />
                </div>
              </div>

              <div className="mt-2 text-right">
                <Link href="/recuperar-contrasena" className="text-sm text-marca hover:underline font-sans font-medium inline-block relative z-10">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button type="submit" disabled={isPending} className="w-full bg-marca hover:bg-marca/90 text-white font-sans text-md h-12 rounded-lg disabled:opacity-70 shadow-md shadow-marca/25">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
                {errorMsg && (
                  <p role="alert" className="text-sm font-sans text-destructive text-center font-medium mt-1 bg-destructive/5 border border-destructive/20 rounded-lg py-2 px-3">
                    Usuario o contraseña no válidos.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-crema/70 hover:text-crema text-sm font-sans transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
