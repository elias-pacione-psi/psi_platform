import { Text, Button, Section, Heading, Hr, Link } from 'react-email'
import { EmailLayout } from './EmailLayout'

const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  blanco: '#ffffff',
  mutedFg: '#5f6d77',
  crema: '#f1f0eb',
  grisCalido: '#d6dee5',
} as const

interface ClaseAgendadaEmailProps {
  nombre: string
  /** Nombre de la comisión (si es grupal) o 'Sesión individual' */
  contexto: string
  tipo: 'virtual' | 'presencial'
  /** Cuántas clases nuevas se agendaron de una — evita mandar un mail por fecha. */
  cantidad: number
  /** ISO de la primera de las clases nuevas. */
  primeraFechaHora: string
  duracionMinutos?: number | null
  lugar?: string | null
  enlace?: string | null
  urlAgenda: string
}

const formatFechaHora = (iso: string) => {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  const hora = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  return { fecha, hora }
}

/**
 * Email que recibe el alumno cuando se agenda una o más clases nuevas de una vez
 * (sesión única, semanas recurrentes, o el horario completo de una comisión).
 */
export function ClaseAgendadaEmail({
  nombre,
  contexto,
  tipo,
  cantidad,
  primeraFechaHora,
  duracionMinutos,
  lugar,
  enlace,
  urlAgenda,
}: ClaseAgendadaEmailProps) {
  const { fecha, hora } = formatFechaHora(primeraFechaHora)
  const esVirtual = tipo === 'virtual'
  const esUnaSola = cantidad === 1

  return (
    <EmailLayout preview={esUnaSola ? `Nueva clase: ${fecha} a las ${hora}` : `Se agendaron ${cantidad} clases nuevas`}>
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>{esVirtual ? '💻' : '🏫'}</Text>
      </Section>

      <Heading style={titleStyle}>
        {esUnaSola ? 'Nueva clase agendada' : `Se agendaron ${cantidad} clases nuevas`}
      </Heading>

      <Text style={bodyTextStyle}>
        Hola <strong>{nombre}</strong>, se agendó{esUnaSola ? ' una nueva' : `n ${cantidad}`}{' '}
        {esVirtual ? 'clase virtual' : 'clase presencial'}{esUnaSola ? '' : 's'} para vos:
      </Text>

      {/* Tarjeta de la clase */}
      <Section style={claseCardStyle}>
        <Text style={contextoBadgeStyle}>{contexto}</Text>
        <Hr style={hrStyleInterno} />

        <Section style={infoRowStyle}>
          <Text style={labelStyle}>{esUnaSola ? '📅 FECHA' : '📅 PRIMERA FECHA'}</Text>
          <Text style={valueStyle}>{fecha}</Text>
        </Section>

        <Section style={infoRowStyle}>
          <Text style={labelStyle}>⏰ HORA</Text>
          <Text style={valueStyle}>
            {hora} hs (Argentina)
            {duracionMinutos ? ` · ${duracionMinutos} min` : ''}
          </Text>
        </Section>

        <Section style={infoRowStyle}>
          <Text style={labelStyle}>📍 MODALIDAD</Text>
          <Text style={valueStyle}>
            {esVirtual ? 'Virtual (videollamada)' : 'Presencial'}
          </Text>
        </Section>

        {!esVirtual && lugar && (
          <Section style={infoRowStyle}>
            <Text style={labelStyle}>🗺️ LUGAR</Text>
            <Text style={valueStyle}>{lugar}</Text>
          </Section>
        )}

        {esVirtual && enlace && (
          <Section style={infoRowStyle}>
            <Text style={labelStyle}>🔗 ENLACE</Text>
            <Text style={valueStyle}>
              <Link href={enlace} style={linkStyle}>
                Entrar a la videollamada
              </Link>
            </Text>
          </Section>
        )}
      </Section>

      <Section style={btnSectionStyle}>
        <Button href={urlAgenda} style={btnStyle}>
          Ver mi agenda completa
        </Button>
      </Section>

      <Text style={hintStyle}>
        Vas a recibir un recordatorio el día anterior a cada clase.
      </Text>
    </EmailLayout>
  )
}

// Preview del CLI de react-email (`npx email dev -d src/emails`).
export default function Preview() {
  return (
    <ClaseAgendadaEmail
      nombre="Julieta"
      contexto="Comisión Marzo 2026"
      tipo="virtual"
      cantidad={8}
      primeraFechaHora="2026-03-07T21:00:00.000Z"
      duracionMinutos={90}
      lugar={null}
      enlace="https://meet.google.com/abc-defg-hij"
      urlAgenda="https://eliaspacione.com/alumno/agenda"
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

const claseCardStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '0 0 28px',
  borderLeft: `4px solid ${C.marca}`,
}

const contextoBadgeStyle: React.CSSProperties = {
  color: C.marca,
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const hrStyleInterno: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '8px 0 16px',
}

const infoRowStyle: React.CSSProperties = {
  margin: '0 0 12px',
}

const labelStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 2px',
}

const valueStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '15px',
  fontWeight: '500',
  margin: '0',
}

const linkStyle: React.CSSProperties = {
  color: C.marca,
  textDecoration: 'none',
  fontWeight: '600',
}

const btnSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 20px',
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

const hintStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '13px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '0',
}
