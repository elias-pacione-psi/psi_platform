import { Text, Button, Section, Heading } from 'npm:@react-email/components'
import { EmailLayout } from './EmailLayout.tsx'

const C = { tinta: '#2f3e46', marca: '#4e6478', blanco: '#ffffff', mutedFg: '#5f6d77' } as const

interface RecuperarPasswordEmailProps {
  enlace: string
}

export function RecuperarPasswordEmail({ enlace }: RecuperarPasswordEmailProps) {
  return (
    <EmailLayout preview="Recuperá tu contraseña">
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>🔒</Text>
      </Section>

      <Heading style={titleStyle}>Recuperar contraseña</Heading>

      <Text style={bodyTextStyle}>
        Recibimos un pedido para restablecer la contraseña de tu cuenta en la
        plataforma de <strong>Elías Pacione</strong>.
      </Text>

      <Text style={bodyTextStyle}>
        Si fuiste vos, hacé clic en el botón de abajo para elegir una nueva contraseña.
      </Text>

      <Section style={btnSectionStyle}>
        <Button href={enlace} style={btnStyle}>
          Elegir nueva contraseña
        </Button>
      </Section>

      <Text style={hintStyle}>
        Si no pediste esto, podés ignorar este mensaje — tu contraseña actual sigue
        siendo válida.
      </Text>
    </EmailLayout>
  )
}

const iconWrapStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '8px' }
const iconStyle: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: '0' }
const titleStyle: React.CSSProperties = {
  color: C.tinta, fontSize: '26px', fontWeight: '700', textAlign: 'center', margin: '0 0 24px', lineHeight: '1.3',
}
const bodyTextStyle: React.CSSProperties = { color: C.tinta, fontSize: '16px', lineHeight: '1.7', margin: '0 0 16px' }
const btnSectionStyle: React.CSSProperties = { textAlign: 'center', margin: '32px 0' }
const btnStyle: React.CSSProperties = {
  backgroundColor: C.marca, color: C.blanco, borderRadius: '8px', fontSize: '16px',
  fontWeight: '600', padding: '14px 32px', textDecoration: 'none', display: 'inline-block',
}
const hintStyle: React.CSSProperties = { color: C.mutedFg, fontSize: '13px', lineHeight: '1.6', margin: '0' }
