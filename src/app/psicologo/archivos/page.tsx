import { redirect } from 'next/navigation'

// Archivos se fusionó con Biblioteca (una sola página, dos pestañas — ver
// src/app/psicologo/biblioteca/page.tsx). Esta ruta queda solo para no romper links
// viejos guardados o compartidos.
export default function ArchivosPage() {
  redirect('/psicologo/biblioteca?tab=archivos')
}
