import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import "./globals.css";

// Tipografías del brief (Concepto 1): Poppins para todo el sistema y Lora
// reservada para el claim de marca, igual que en el logo — "Elias Pacione"
// en Poppins bold y "Psicología con sentido." en serif debajo.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elias Pacione | Psicología con sentido",
  description: "Plataforma privada de formación y acompañamiento psicológico de Elias Pacione",
};

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes escribe la clase del tema en <html>
    // con un script inline, antes del primer pintado. El HTML del servidor y el
    // del cliente difieren a propósito en este elemento.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} ${lora.variable} h-full antialiased scroll-smooth scroll-pt-28`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
