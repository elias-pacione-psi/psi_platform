'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export function RecuperarClient() {
  const [isPending, setIsPending] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setErrorMsg(null)
    setSuccessMsg(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/configurar-password`
    })

    if (error) {
      setErrorMsg('No se pudo enviar el enlace. Verifica el correo e intenta de nuevo.')
    } else {
      setSuccessMsg(true)
    }

    setIsPending(false)
  }

  return (
    <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-heading text-center font-bold text-tinta">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-center font-sans">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMsg ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
                ¡Enlace enviado! Revisa tu bandeja de entrada (o la carpeta de spam).
              </div>
              <Link href="/login" className="inline-block mt-4 text-marca font-bold underline">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-tinta">Email</Label>
                <Input id="email" name="email" type="email" placeholder="paciente@ejemplo.com" required className="border-gray-200" disabled={isPending} />
              </div>

              {errorMsg && (
                <p className="text-sm font-sans text-red-600 font-medium">
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isPending} className="w-full bg-marca hover:bg-marca/90 text-white font-sans text-md h-12 rounded-lg">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar enlace de recuperación"}
                </Button>
                <Link href="/login" className="flex items-center justify-center text-sm font-sans text-gray-600 hover:text-gray-900 mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver atrás
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
