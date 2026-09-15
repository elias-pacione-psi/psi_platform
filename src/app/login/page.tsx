import { LoginClient } from './LoginClient'

type Props = {
  searchParams: Promise<{ error?: string }>
}

// Server component sólo para leer el `?error=` que manda /auth/confirm cuando el enlace
// del email falla. Antes la página entera era 'use client' y ese parámetro se perdía: el
// invitado aterrizaba en un login pelado, sin contraseña creada y sin ninguna pista de
// qué había pasado. Fue el problema más reportado en la primera tanda de alumnos.
export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return <LoginClient enlaceInvalido={error === 'enlace_invalido'} />
}
