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

interface RecordatorioClaseEmailProps {
  nombre: string
  contexto: string           // Comisión o 'Sesión individual'
  tipo: 'virtual' | 'presencial'
  fechaHora: string          // ISO string
  duracionMinutos?: number | null
  lugar?: string | null
  enlace?: string | null
  urlAgenda: string
}

const formatHora = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

const formatFechaCorta = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

/**
 * Recordatorio automático que sale la mañana del día anterior a la clase.
 * Tono más urgente/práctico: "mañana tenés clase".
 */
export function RecordatorioClaseEmail({
  nombre,
  contexto,
  tipo,
  fechaHora,
  duracionMinutos,
  lugar,
  enlace,
  urlAgenda,
}: RecordatorioClaseEmailProps) {
  const hora = formatHora(fechaHora)
  const fecha = formatFechaCorta(fechaHora)
  const esVirtual = tipo === 'virtual'

  return (
    <EmailLayout preview={`Recordatorio: mañana a las ${hora} tenés clase`}>
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>🔔</Text>
      </Section>

      <Heading style={titleStyle}>Recordatorio de clase</Heading>

      <Text style={bodyTextStyle}>
        Hola <strong>{nombre}</strong>, este es tu recordatorio:
        mañana tenés una {esVirtual ? 'clase virtual' : 'clase presencial'}.
      </Text>

      {/* Bloque de urgencia — hora grande */}
      <Section style={urgenciaBlockStyle}>
        <Text style={mananaLabelStyle}>MAÑANA · {fecha}</Text>
        <Text style={horaGrandeStyle}>{hora} hs</Text>
        {duracionMinutos && (
          <Text style={duracionStyle}>Duración: {duracionMinutos} min</Text>
        )}
      </Section>

      {/* Detalles */}
      <Section style={detallesCardStyle}>
        <Section style={infoRowStyle}>
          <Text style={labelStyle}>📚 CLASE</Text>
          <Text style={valueStyle}>{contexto}</Text>
        </Section>

        <Hr style={hrStyleInterno} />

        <Section style={infoRowStyle}>
          <Text style={labelStyle}>📍 MODALIDAD</Text>
          <Text style={valueStyle}>{esVirtual ? 'Virtual (videollamada)' : 'Presencial'}</Text>
        </Section>

        {!esVirtual && lugar && (
          <>
            <Hr style={hrStyleInterno} />
            <Section style={infoRowStyle}>
              <Text style={labelStyle}>🗺️ LUGAR</Text>
              <Text style={valueStyle}>{lugar}</Text>
            </Section>
          </>
        )}

        {esVirtual && enlace && (
          <>
            <Hr style={hrStyleInterno} />
            <Section style={infoRowStyle}>
              <Text style={labelStyle}>🔗 ENLACE</Text>
              <Text style={valueStyle}>
                <Link href={enlace} style={linkStyle}>
                  Entrar a la videollamada
                </Link>
              </Text>
            </Section>
          </>
        )}
      </Section>

      <Section style={btnSectionStyle}>
        <Button href={urlAgenda} style={btnStyle}>
          Ver mi agenda
        </Button>
      </Section>

      <Text style={hintStyle}>
        Este recordatorio fue enviado automáticamente. ¡Hasta mañana!
      </Text>
    </EmailLayout>
  )
}

// Preview del CLI de react-email (`npx email dev -d src/emails`).
export default function Preview() {
  return (
    <RecordatorioClaseEmail
      nombre="Julieta"
      contexto="Comisión Marzo 2026"
      tipo="virtual"
      fechaHora="2026-03-07T21:00:00.000Z"
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
  margin: '0 0 20px',
  lineHeight: '1.3',
}

const bodyTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 20px',
}

const urgenciaBlockStyle: React.CSSProperties = {
  backgroundColor: C.marca,
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 24px',
  textAlign: 'center',
}

const mananaLabelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
}

const horaGrandeStyle: React.CSSProperties = {
  color: C.blanco,
  fontSize: '48px',
  fontWeight: '700',
  lineHeight: '1',
  margin: '0',
}

const duracionStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: '14px',
  margin: '6px 0 0',
}

const detallesCardStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '0 0 28px',
}

const infoRowStyle: React.CSSProperties = {
  margin: '0',
}

const hrStyleInterno: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '12px 0',
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
