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

interface AsignacionProgramaEmailProps {
  nombre: string
  /** Títulos de los programas a los que se acaba de dar acceso (uno o más). */
  programas: string[]
  /** Nombre de la comisión, si el acceso vino de una inscripción a cohorte. */
  nombreCohorte?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  urlPlataforma: string
}

const formatFecha = (f: string | null | undefined): string | null => {
  if (!f) return null
  const d = new Date(f + 'T00:00:00')
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Email que recibe el alumno cuando se le da acceso a uno o más programas nuevos —
 * por inscripción a una comisión, por edición manual del psicólogo, o porque se le
 * agregó un programa a una comisión en la que ya estaba.
 */
export function AsignacionProgramaEmail({
  nombre,
  programas,
  nombreCohorte,
  fechaInicio,
  fechaFin,
  urlPlataforma,
}: AsignacionProgramaEmailProps) {
  const inicio = formatFecha(fechaInicio)
  const fin = formatFecha(fechaFin)
  const singular = programas.length === 1

  return (
    <EmailLayout preview={singular ? `Ahora tenés acceso a ${programas[0]}` : `Ahora tenés acceso a ${programas.length} programas nuevos`}>
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>📋</Text>
      </Section>

      <Heading style={titleStyle}>¡Tenés contenido nuevo!</Heading>

      <Text style={bodyTextStyle}>
        Hola <strong>{nombre}</strong>, te dimos acceso a{' '}
        {singular ? 'lo siguiente' : `los siguientes ${programas.length} programas`}:
      </Text>

      {/* Tarjeta de programas */}
      <Section style={cardStyle}>
        {nombreCohorte && (
          <>
            <Text style={labelStyle}>COMISIÓN</Text>
            <Text style={cohorteNombreStyle}>{nombreCohorte}</Text>
            <Hr style={hrStyle} />
          </>
        )}
        <Text style={labelStyle}>{singular ? 'PROGRAMA' : 'PROGRAMAS'}</Text>
        {programas.map((p) => (
          <Text key={p} style={programaNombreStyle}>• {p}</Text>
        ))}
        {(inicio || fin) && (
          <>
            <Hr style={hrStyle} />
            <Text style={labelStyle}>FECHAS</Text>
            {inicio && <Text style={fechaTextStyle}>🗓️ Inicio: {inicio}</Text>}
            {fin && <Text style={fechaTextStyle}>🏁 Fin estimado: {fin}</Text>}
          </>
        )}
      </Section>

      <Text style={bodyTextStyle}>
        Desde la plataforma vas a poder acceder al material, tu agenda de clases y
        las actividades del programa.
      </Text>

      <Section style={btnSectionStyle}>
        <Button href={urlPlataforma} style={btnStyle}>
          Ir a la plataforma
        </Button>
      </Section>

      <Text style={hintStyle}>
        Si tenés alguna pregunta, respondé directamente este email.
      </Text>
    </EmailLayout>
  )
}

// Preview del CLI de react-email (`npx email dev -d src/emails`) — necesita un
// default export con props de ejemplo para poder listar/renderizar el template. El
// import real desde actions.ts sigue siendo el named export de arriba.
export default function Preview() {
  return (
    <AsignacionProgramaEmail
      nombre="Julieta"
      programas={['Formación en TCC', 'Supervisión clínica grupal']}
      nombreCohorte="Comisión Marzo 2026"
      fechaInicio="2026-03-02"
      fechaFin="2026-08-15"
      urlPlataforma="https://eliaspacione.com/alumno"
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

const cardStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderRadius: '10px',
  padding: '24px 28px',
  margin: '8px 0 24px',
  borderLeft: `4px solid ${C.marca}`,
}

const labelStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}

const cohorteNombreStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px',
}

const programaNombreStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '15px',
  fontWeight: '500',
  margin: '0 0 6px',
}

const hrStyle: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '12px 0',
}

const fechaTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '14px',
  margin: '2px 0',
}

const btnSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0 24px',
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
  margin: '0',
}
