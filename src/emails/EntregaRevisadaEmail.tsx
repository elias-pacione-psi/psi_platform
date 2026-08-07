import { Text, Button, Section, Heading, Hr } from 'react-email'
import { EmailLayout } from './EmailLayout'

const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  blanco: '#ffffff',
  mutedFg: '#5f6d77',
  crema: '#f1f0eb',
  grisCalido: '#d6dee5',
} as const

interface EntregaRevisadaEmailProps {
  nombre: string
  tituloLeccion: string
  comentarioInstructor: string | null
  urlEntrega: string
}

/**
 * Email que recibe el alumno cuando el psicólogo corrige su entrega.
 */
export function EntregaRevisadaEmail({
  nombre,
  tituloLeccion,
  comentarioInstructor,
  urlEntrega,
}: EntregaRevisadaEmailProps) {
  return (
    <EmailLayout preview={`Tu entrega de "${tituloLeccion}" fue revisada`}>
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>✅</Text>
      </Section>

      <Heading style={titleStyle}>Tu entrega fue revisada</Heading>

      <Text style={bodyTextStyle}>
        Hola <strong>{nombre}</strong>, el psicólogo revisó tu entrega de:
      </Text>

      <Section style={leccionBadgeStyle}>
        <Text style={leccionTextStyle}>{tituloLeccion}</Text>
      </Section>

      {comentarioInstructor ? (
        <>
          <Text style={seccionTituloStyle}>Devolución del instructor</Text>
          <Section style={comentarioBoxStyle}>
            <Text style={comentarioTextStyle}>{comentarioInstructor}</Text>
          </Section>
        </>
      ) : (
        <Text style={sinComentarioStyle}>
          La entrega fue marcada como revisada sin comentarios adicionales.
        </Text>
      )}

      <Hr style={hrStyle} />

      <Text style={bodyTextStyle}>
        Podés ver el estado completo de tu entrega desde la plataforma.
      </Text>

      <Section style={btnSectionStyle}>
        <Button href={urlEntrega} style={btnStyle}>
          Ver mi entrega
        </Button>
      </Section>
    </EmailLayout>
  )
}

// Preview del CLI de react-email (`npx email dev -d src/emails`).
export default function Preview() {
  return (
    <EntregaRevisadaEmail
      nombre="Julieta"
      tituloLeccion="Trabajo práctico: análisis de caso clínico"
      comentarioInstructor="Buen desarrollo del caso. Te sugiero profundizar un poco más en la hipótesis diagnóstica del apartado 3 antes de la próxima entrega."
      urlEntrega="https://eliaspacione.com/alumno/tareas"
    />
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const iconWrapStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '8px',
}

const iconStyle: React.CSSProperties = {
  fontSize: '48px',
  lineHeight: '1',
  margin: '0',
}

const titleStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '26px',
  fontWeight: '700',
  textAlign: 'center',
  margin: '0 0 24px',
  lineHeight: '1.3',
}

const bodyTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const leccionBadgeStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderRadius: '6px',
  padding: '12px 20px',
  margin: '0 0 24px',
  borderLeft: `3px solid ${C.marca}`,
}

const leccionTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
}

const seccionTituloStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const comentarioBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0f4f7',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '0 0 24px',
  borderLeft: `4px solid ${C.marca}`,
}

const comentarioTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const sinComentarioStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '0 0 24px',
}

const hrStyle: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '0 0 24px',
}

const btnSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 8px',
}

const btnStyle: React.CSSProperties = {
  backgroundColor: C.marca,
  color: C.blanco,
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  padding: '13px 30px',
  textDecoration: 'none',
  display: 'inline-block',
}
