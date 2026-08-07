import { Text, Button, Section, Heading } from 'npm:@react-email/components'
// Sin deno.json en supabase/functions, Deno compila .tsx con el transform JSX clásico
// por default (pragma React.createElement) — así que cualquier archivo con sintaxis JSX
// necesita `React` importado como VALOR, no solo como tipo. Sin esto reventaba en runtime
// con "ReferenceError: React is not defined" apenas se evaluaba el primer <Tag> del
// return — nunca se había probado hasta la primera invitación real.
import React from 'npm:react@19.2.4'
import type { CSSProperties } from 'npm:react@19.2.4'
import { EmailLayout } from './EmailLayout.tsx'

const C = { tinta: '#2f3e46', marca: '#4e6478', blanco: '#ffffff', mutedFg: '#5f6d77', crema: '#f1f0eb' } as const

interface InviteEmailProps {
  enlace: string
}

// Cubre invite, signup y magiclink — todos son "activá tu cuenta / entrá a la
// plataforma" desde el punto de vista del hook. Sin nombre: el payload del Send Email
// Hook no garantiza traer user_metadata.nombre para los tres tipos, así que el copy es
// genérico a propósito en vez de arriesgar un "Hola undefined,".
export function InviteEmail({ enlace }: InviteEmailProps) {
  return (
    <EmailLayout preview="Activá tu cuenta en la plataforma">
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>🎓</Text>
      </Section>

      <Heading style={titleStyle}>¡Bienvenido/a!</Heading>

      <Text style={bodyTextStyle}>
        Tu acceso a la plataforma de formación de <strong>Elías Pacione</strong> está listo.
      </Text>

      <Text style={bodyTextStyle}>
        Hacé clic en el botón de abajo para activar tu cuenta y configurar tu contraseña.
      </Text>

      <Section style={btnSectionStyle}>
        <Button href={enlace} style={btnStyle}>
          Activar mi cuenta
        </Button>
      </Section>

      <Text style={hintStyle}>
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:
        <br />
        <span style={{ color: C.marca, wordBreak: 'break-all' }}>{enlace}</span>
      </Text>
    </EmailLayout>
  )
}

const iconWrapStyle: CSSProperties = { textAlign: 'center', marginBottom: '8px' }
const iconStyle: CSSProperties = { fontSize: '48px', lineHeight: '1', margin: '0' }
const titleStyle: CSSProperties = {
  color: C.tinta, fontSize: '26px', fontWeight: '700', textAlign: 'center', margin: '0 0 24px', lineHeight: '1.3',
}
const bodyTextStyle: CSSProperties = { color: C.tinta, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }
const btnSectionStyle: CSSProperties = { textAlign: 'center', margin: '32px 0' }
const btnStyle: CSSProperties = {
  backgroundColor: C.marca, color: C.blanco, borderRadius: '8px', fontSize: '16px',
  fontWeight: '600', padding: '14px 32px', textDecoration: 'none', display: 'inline-block',
}
const hintStyle: CSSProperties = { color: C.mutedFg, fontSize: '13px', lineHeight: '1.6', margin: '0' }
