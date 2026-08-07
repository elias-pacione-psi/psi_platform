import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from 'react-email'
import type { ReactNode } from 'react'

// Paleta exacta de la plataforma (src/app/globals.css) — no la de docs/marca/, que
// documenta una paleta anterior (sage/verde) que el sitio ya dejó de usar.
const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  crema: '#f1f0eb',
  blanco: '#ffffff',
  grisCalido: '#d6dee5',
  mutedFg: '#5f6d77',
} as const

interface EmailLayoutProps {
  children: ReactNode
  preview?: string // Texto de previsualización (aparece en el cliente de correo antes de abrir)
}

/**
 * Layout base reutilizable por todos los templates de email transaccional.
 * Header petróleo + contenido sobre blanco + footer neutral.
 */
export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        {preview && (
          <meta name="description" content={preview} />
        )}
      </Head>
      <Body style={bodyStyle}>
        {/* ── Header ── */}
        <Section style={headerStyle}>
          <Container style={headerInnerStyle}>
            <Text style={logoStyle}>Elías Pacione</Text>
            <Text style={subtituloStyle}>Plataforma de Formación</Text>
          </Container>
        </Section>

        {/* ── Contenido ── */}
        <Container style={cardStyle}>
          {children}
        </Container>

        {/* ── Footer ── */}
        <Container style={footerContainerStyle}>
          <Hr style={hrStyle} />
          <Text style={footerTextStyle}>
            Este mensaje fue enviado automáticamente desde la plataforma de{' '}
            <Link href="https://eliaspacione.com" style={footerLinkStyle}>
              eliaspacione.com
            </Link>
            . Si tenés alguna consulta, respondé directamente a este mail.
          </Text>
          <Text style={footerTextStyle}>
            © {new Date().getFullYear()} Elías Pacione · Todos los derechos reservados
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ── Estilos inline (React Email requiere inline styles) ──────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  fontFamily:
    "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const headerStyle: React.CSSProperties = {
  backgroundColor: C.tinta,
  padding: '0',
}

const headerInnerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '24px 32px',
}

const logoStyle: React.CSSProperties = {
  color: C.blanco,
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.3px',
}

const subtituloStyle: React.CSSProperties = {
  color: C.grisCalido,
  fontSize: '13px',
  margin: '2px 0 0',
  fontWeight: '400',
}

const cardStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: C.blanco,
  borderRadius: '0 0 8px 8px',
  padding: '40px 40px 32px',
}

const footerContainerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 32px 40px',
}

const hrStyle: React.CSSProperties = {
  borderColor: C.grisCalido,
  margin: '24px 0 16px',
}

const footerTextStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 4px',
  textAlign: 'center' as const,
}

const footerLinkStyle: React.CSSProperties = {
  color: C.marca,
  textDecoration: 'none',
}
