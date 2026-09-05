// Layout compartido por los templates de esta Edge Function. Deliberadamente separado
// de src/emails/EmailLayout.tsx: esto corre en Deno (no en el build de Next.js), así que
// no puede importar nada del árbol de src/ — mismo diseño visual, copia independiente.
import { Html, Head, Font, Body, Container, Section, Row, Column, Img, Text, Hr, Link } from 'npm:@react-email/components'
// React como valor: ver el comentario en InviteEmail.tsx sobre el transform JSX
// clásico de Deno (sin esto, "ReferenceError: React is not defined" en runtime).
import React from 'npm:react@19.2.4'
import type { ReactNode, CSSProperties } from 'npm:react@19.2.4'

// Paleta exacta de la plataforma (src/app/globals.css).
const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  crema: '#f1f0eb',
  blanco: '#ffffff',
  grisCalido: '#d6dee5',
  mutedFg: '#5f6d77',
  border: '#dce3e8',
} as const

// Mismo isotipo que src/components/BrandMark.tsx (mark.png, silueta petróleo sobre
// transparente). En el sitio se pinta con mask-image + currentColor para reusarlo en
// claro y oscuro — la mayoría de los clientes de mail no soporta ese truco, por eso acá
// el header va en claro (igual que el header público real, nunca el footer/login
// oscuros) y el PNG oscuro se ve tal cual, sin necesitar una segunda versión clara.
const URL_ISOTIPO = 'https://eliaspacione.com/brand/mark.png'

interface EmailLayoutProps {
  children: ReactNode
  preview?: string
}

/**
 * Header = mismo lockup que src/components/BrandLogo.tsx (isotipo + nombre en Poppins +
 * claim en Lora) sobre crema, igual que el header público del sitio.
 */
export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        {preview && <meta name="description" content={preview} />}
        {/* Tipografías de marca — ver el mismo comentario en src/emails/EmailLayout.tsx.
            Orden importa: cada <Font> agrega una regla `* { font-family: ... }` además
            del @font-face, y las cuatro empatan en especificidad — gana la última.
            Lora va primero para que las tres de Poppins queden al final y su `*` sea
            el default de todo el mail; el claim en Lora se fuerza con fontFamily
            inline, que gana sin importar el orden de estos <Font>. */}
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

        <Container style={cardStyle}>
          {children}
        </Container>

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

const bodyStyle: CSSProperties = {
  backgroundColor: C.crema,
  fontFamily: "'Poppins', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const headerStyle: CSSProperties = {
  backgroundColor: C.crema,
  borderBottom: `1px solid ${C.border}`,
  padding: '0',
}

const headerInnerStyle: CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '20px 32px' }

const logoColStyle: CSSProperties = { width: '52px', verticalAlign: 'middle' }

const logoImgStyle: CSSProperties = { display: 'block' }

const logoStyle: CSSProperties = {
  fontFamily: "'Poppins', Helvetica, Arial, sans-serif",
  color: C.tinta, fontSize: '17px', fontWeight: '600', margin: '0', letterSpacing: '-0.2px',
}

const subtituloStyle: CSSProperties = {
  fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
  color: C.mutedFg, fontSize: '13px', margin: '2px 0 0', fontWeight: '400',
}

const cardStyle: CSSProperties = {
  maxWidth: '600px', margin: '24px auto 0', backgroundColor: C.blanco,
  borderRadius: '12px', padding: '40px 40px 32px',
}

const footerContainerStyle: CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '0 32px 40px' }

const hrStyle: CSSProperties = { borderColor: C.grisCalido, margin: '24px 0 16px' }

const footerTextStyle: CSSProperties = {
  color: C.mutedFg, fontSize: '12px', lineHeight: '1.6', margin: '0 0 4px', textAlign: 'center' as const,
}

const footerLinksStyle: CSSProperties = {
  color: C.mutedFg, fontSize: '12px', lineHeight: '1.6', margin: '0 0 10px', textAlign: 'center' as const,
}

const footerLinkStyle: CSSProperties = { color: C.marca, textDecoration: 'none' }
