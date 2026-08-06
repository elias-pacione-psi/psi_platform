import { redirect } from 'next/navigation'

// Ventas se fusionó con ebooks (una sola página, dos pestañas — ver
// src/app/psicologo/ebooks/page.tsx). Esta ruta queda solo para no romper links
// viejos guardados o compartidos.
export default function VentasPage() {
  redirect('/psicologo/ebooks?tab=ventas')
}
