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

interface EbookListoEmailProps {
  tituloEbook: string
  urlPedido: string
}

/**
 * Email que recibe quien compró un ebook cuando el pago queda confirmado.
 *
 * Es la red de seguridad del flujo de compra: quien paga puede no tener cuenta y puede
 * haber cerrado la pestaña del pedido apenas terminó de pagar (sobre todo con el link de
 * pago manual, donde la confirmación no es instantánea). Sin este mail, el único camino
 * de vuelta al PDF era una URL que la persona ya no tiene.
 *
 * No lleva el PDF adjunto ni una URL firmada: manda al /pedido/[id], que re-chequea
 * server-side que la orden siga 'pagada' y firma la descarga recién en el momento del
 * click. Un adjunto o un link firmado pegado acá sobreviviría a un reembolso.
 */
export function EbookListoEmail({ tituloEbook, urlPedido }: EbookListoEmailProps) {
  return (
    <EmailLayout preview={`Ya podés descargar "${tituloEbook}"`}>
      <Section style={iconWrapStyle}>
        <Text style={iconStyle}>📖</Text>
      </Section>

      <Heading style={titleStyle}>Tu ebook está listo</Heading>

      <Text style={bodyTextStyle}>
        Confirmamos tu pago. Ya podés descargar:
      </Text>

      <Section style={ebookBadgeStyle}>
        <Text style={ebookTextStyle}>{tituloEbook}</Text>
      </Section>

      <Section style={btnSectionStyle}>
        <Button href={urlPedido} style={btnStyle}>
          Descargar mi ebook
        </Button>
      </Section>

      <Hr style={hrStyle} />

      <Text style={notaStyle}>
        Guardá este mail: el link te sirve para volver a descargarlo cuando quieras. Si
        preferís no depender de él, desde esa misma página podés crear una cuenta con
        este email y tener el ebook siempre a mano.
      </Text>
    </EmailLayout>
  )
}

// Preview del CLI de react-email (`npx email dev -d src/emails`).
export default function Preview() {
  return (
    <EbookListoEmail
      tituloEbook="Vuelvo — Cuaderno de trabajo"
      urlPedido="https://eliaspacione.com/pedido/00000000-0000-0000-0000-000000000000"
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

const ebookBadgeStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderRadius: '6px',
  padding: '12px 20px',
  margin: '0 0 24px',
  borderLeft: `3px solid ${C.marca}`,
}

const ebookTextStyle: React.CSSProperties = {
  color: C.tinta,
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
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

const hrStyle: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '24px 0',
}

const notaStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0',
}
