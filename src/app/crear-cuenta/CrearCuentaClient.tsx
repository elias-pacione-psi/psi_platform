'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { crearCuentaComprador } from './actions'
import { toast } from 'sonner'

// Mismo largo/requisitos que /configurar-password (ver el comentario en actions.ts sobre
// por qué tienen que coincidir con supabase/config.toml).
const MIN_LEN = 12

export function CrearCuentaClient({ emailInicial, ordenId }: { emailInicial: string; ordenId: string }) {
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  // Sin setter: el email lo fija la orden y el input es readOnly.
  const [email] = useState(emailInicial)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [listo, setListo] = useState<{ haySesion: boolean } | null>(null)
  const router = useRouter()

  const passwordsMatch = confirm.length > 0 && password === confirm

  function handleSubmit(formData: FormData) {
    if (password !== confirm) { toast.error('Las contraseñas no coinciden.'); return }
    startTransition(async () => {
      const res = await crearCuentaComprador(formData)
      if (res?.error) { toast.error(res.error); return }
      if (res?.haySesion) {
        toast.success('¡Cuenta creada! Ya podés ver tu compra en Materiales.')
        router.push('/alumno')
      } else {
        setListo({ haySesion: false })
      }
    })
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-marca mx-auto" />
            <h1 className="text-2xl font-heading font-bold text-tinta">¡Cuenta creada!</h1>
            <p className="text-muted-foreground">
              Te mandamos un email a <b>{email}</b> para confirmar la cuenta. Una vez confirmada,
              entrá desde <Link href="/login" className="text-marca underline underline-offset-2">Ingresar</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-heading text-center font-bold text-tinta">Creá tu cuenta</CardTitle>
          <CardDescription className="text-center font-sans">
            Con la cuenta vas a poder volver a descargar lo que compraste cuando quieras,
            sin depender del link del email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            {/* El id de la compra es lo que habilita el alta: la action exige que exista,
                esté pagada, sin cuenta asociada, y que su email coincida con el de abajo.
                Va oculto porque no es algo que la persona tenga que tipear — llega en la
                URL desde la confirmación de pago. */}
            <input type="hidden" name="orden" value={ordenId} />

            <div className="space-y-2">
              <Label htmlFor="nombre" className="font-sans text-tinta">Nombre</Label>
              <Input
                id="nombre" name="nombre" required className="border-border"
                disabled={isPending} value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans text-tinta">Email</Label>
              {/* Solo lectura: sale de la orden, no de lo que se tipee. Editable no
                  servía de nada —la action exige que coincida con el email que pagó, así
                  que cualquier cambio termina en error— y encima invitaba a probar
                  direcciones ajenas. */}
              <Input
                id="email" name="email" type="email" required readOnly
                className="border-border bg-muted text-muted-foreground"
                value={email}
              />
              <p className="text-xs text-muted-foreground">
                Es el email con el que hiciste la compra. Si no es el tuyo, escribinos antes de seguir.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-sans text-tinta">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password" name="password" type={show ? 'text' : 'password'} required
                  className="border-border pr-10" disabled={isPending} minLength={MIN_LEN}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-tinta"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo {MIN_LEN} caracteres, con mayúsculas, minúsculas, números y símbolos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="font-sans text-tinta">Repetir contraseña</Label>
              <Input
                id="confirm" type={show ? 'text' : 'password'} required
                className={`border-border ${confirm.length > 0 && !passwordsMatch ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                disabled={isPending} minLength={MIN_LEN}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 dark:text-red-400">Las contraseñas no coinciden.</p>
              )}
            </div>

            <Button type="submit" disabled={isPending || !passwordsMatch} className="w-full bg-marca hover:bg-marca/90 text-crema font-sans text-md h-12 rounded-lg">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear cuenta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta? <Link href="/login" className="text-marca underline underline-offset-2">Ingresá</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
