'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

// `variant="sobre-oscuro"` es para las superficies bg-noche (login, footer), donde
// los colores del tema no aplican porque esa superficie no gira con el tema.
type Props = { variant?: 'normal' | 'sobre-oscuro'; className?: string }

export function ThemeToggle({ variant = 'normal', className = '' }: Props) {
  // next-themes solo conoce el tema real en el cliente: hasta que monta, renderizamos
  // el mismo marcador en servidor y cliente para no romper la hidratación.
  const [montado, setMontado] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // setTimeout en vez de llamar a setMontado directo: mismo patrón que
  // CalendarWidget.tsx, evita el lint de setState síncrono dentro del efecto.
  useEffect(() => {
    const id = setTimeout(() => setMontado(true), 0)
    return () => clearTimeout(id)
  }, [])

  const esOscuro = resolvedTheme === 'dark'
  const estilos =
    variant === 'sobre-oscuro'
      ? 'text-nieve/70 hover:text-nieve hover:bg-nieve/10'
      : 'text-tinta/70 hover:text-tinta hover:bg-muted'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full ${estilos} ${className}`}
      onClick={() => setTheme(esOscuro ? 'light' : 'dark')}
      // Sin montar no sabemos el tema: el botón existe (no salta el layout) pero no
      // anuncia un estado que puede ser el equivocado.
      aria-label={montado ? (esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') : 'Cambiar tema'}
      title={montado ? (esOscuro ? 'Modo claro' : 'Modo oscuro') : undefined}
    >
      {montado && esOscuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
