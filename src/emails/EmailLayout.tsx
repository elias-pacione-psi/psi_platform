import {
  Html,
  Head,
  Font,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
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
  border: '#dce3e8',
} as const

// URL absoluta: los clientes de mail no resuelven rutas relativas ni corren el build
// de Next, así que no hay forma de importar el asset — tiene que salir del dominio
// productivo. Es el mismo isotipo que src/components/BrandMark.tsx (mark.png, silueta
// petróleo sobre transparente): ahí se pinta con mask-image + currentColor para poder
// reusarlo en claro y oscuro, truco que la mayoría de los clientes de mail no soporta.
// Por eso el header de acá va en claro (igual que el header real del sitio, nunca el
// footer/login oscuros) — así el PNG oscuro se ve tal cual, sin necesitar una segunda
// versión clara del isotipo solo para mail.
const URL_ISOTIPO = 'https://eliaspacione.com/brand/mark.png'

interface EmailLayoutProps {
  children: ReactNode
  preview?: string // Texto de previsualización (aparece en el cliente de correo antes de abrir)
}

/**
 * Layout base reutilizable por todos los templates de email transaccional.
 * Header = mismo lockup que src/components/BrandLogo.tsx (isotipo + nombre en Poppins +
 * claim en Lora) sobre crema, igual que el header público del sitio. Contenido sobre
 * blanco, footer neutral con los mismos links legales del pie de la landing.
 */
export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        {preview && (
          <meta name="description" content={preview} />
        )}
        {/* Tipografías de marca (ver layout.tsx: Poppins es --font-sans/--font-heading
            en todo el sitio, Lora queda reservada al claim). No todos los clientes de
            mail cargan @font-face — por eso cada <Font> trae su fallback y bodyStyle
            abajo repite la misma cadena, para que degrade con la personalidad más
            parecida posible en vez de cambiar de familia entera.

            Orden importa: cada <Font> además del @font-face agrega una regla
            `* { font-family: ... }` (así aplica sin tocar cada Text/Heading a mano) y
            las cuatro reglas empatan en especificidad — gana la última en pisar a las
            anteriores. Lora va primero a propósito para que las tres de Poppins queden
            al final y su `*` sea el que rige por default en todo el mail; donde se
            necesita Lora igual (el claim del lockup) se fuerza con fontFamily inline,
            que le gana a cualquier regla de `<style>` sin importar el orden. */}
        <Font
          fontFamily="Lora"
          fallbackFontFamily={['Georgia', 'Times New Roman', 'serif']}
          webFont={{ url: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecg.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2', format: 'woff2' }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2', format: 'woff2' }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Body style={bodyStyle}>
        {/* ── Header: mismo lockup que el sitio (isotipo + nombre + claim) ── */}
        <Section style={headerStyle}>
          <Container style={headerInnerStyle}>
            <Row>
              <Column style={logoColStyle}>
                <Img src={URL_ISOTIPO} width="44" height="29" alt="" style={logoImgStyle} />
              </Column>
              <Column>
                <Text style={logoStyle}>Elias Pacione</Text>
                <Text style={subtituloStyle}>Psicología con sentido.</Text>
              </Column>
            </Row>
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
          <Text style={footerLinksStyle}>
            <Link href="https://eliaspacione.com/privacidad" style={footerLinkStyle}>
              Política de privacidad
            </Link>
            {' · '}
            <Link href="https://eliaspacione.com/terminos" style={footerLinkStyle}>
              Términos y condiciones
            </Link>
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
  fontFamily: "'Poppins', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const headerStyle: React.CSSProperties = {
  backgroundColor: C.crema,
  borderBottom: `1px solid ${C.border}`,
  padding: '0',
}

const headerInnerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px 32px',
}

const logoColStyle: React.CSSProperties = {
  width: '52px',
  verticalAlign: 'middle',
}

const logoImgStyle: React.CSSProperties = {
  display: 'block',
}

const logoStyle: React.CSSProperties = {
  fontFamily: "'Poppins', Helvetica, Arial, sans-serif",
  color: C.tinta,
  fontSize: '17px',
  fontWeight: '600',
  margin: '0',
  letterSpacing: '-0.2px',
}

const subtituloStyle: React.CSSProperties = {
  fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
  color: C.mutedFg,
  fontSize: '13px',
  margin: '2px 0 0',
  fontWeight: '400',
}

const cardStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '24px auto 0',
  backgroundColor: C.blanco,
  borderRadius: '12px',
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

const footerLinksStyle: React.CSSProperties = {
  color: C.mutedFg,
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 10px',
  textAlign: 'center' as const,
}

const footerLinkStyle: React.CSSProperties = {
  color: C.marca,
  textDecoration: 'none',
}
