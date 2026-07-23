'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

const MIN_LEN = 8

export function ConfigurarPasswordClient() {
  const [isPending, setIsPending] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const router = useRouter()

  const passwordsMatch = confirm.length > 0 && password === confirm

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password.length < MIN_LEN) {
      toast.error(`La contraseña debe tener al menos ${MIN_LEN} caracteres.`)
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setIsPending(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('No se pudo actualizar la contraseña. Inténtalo de nuevo.')
      setIsPending(false)
    } else {
      toast.success('¡Contraseña actualizada con éxito!')
      router.push('/paciente')
    }
  }

  return (
    <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-heading text-center font-bold text-tinta">Configurar nueva contraseña</CardTitle>
          <CardDescription className="text-center font-sans">
            Ingresa tu nueva contraseña para acceder a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-sans text-tinta">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  required
                  className="border-gray-200 pr-10"
                  disabled={isPending}
                  minLength={MIN_LEN}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tinta"
                  tabIndex={-1}
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Mínimo {MIN_LEN} caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="font-sans text-tinta">Repetir Contraseña</Label>
              <Input
                id="confirm"
                name="confirm"
                type={show ? 'text' : 'password'}
                required
                className={`border-gray-200 ${confirm.length > 0 && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                disabled={isPending}
                minLength={MIN_LEN}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
              )}
            </div>

            <Button type="submit" disabled={isPending || !passwordsMatch} className="w-full bg-marca hover:bg-marca/90 text-white font-sans text-md h-12 rounded-lg">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar contraseña y entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
