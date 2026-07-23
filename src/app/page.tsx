import Link from 'next/link'
import { Sprout, FolderHeart, Calendar, ShieldCheck } from 'lucide-react'

// Landing mínima y sobria: acá no hay registro público — las cuentas
// las crea el psicólogo y el paciente llega invitado por email.
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <header className="w-full sticky top-0 z-50 bg-crema/90 backdrop-blur border-b border-tinta/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-marca/10 text-marca flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </span>
            <span className="font-heading font-bold text-xl text-tinta">Espacio Terapéutico</span>
          </div>
          <Link href="/login" className="bg-marca text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-marca/25 transition-all hover:bg-marca/90 hover:shadow-lg hover:-translate-y-0.5">
            Ingresar
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-tinta text-4xl md:text-5xl font-heading font-bold mb-6 leading-tight max-w-2xl">
          Tu material terapéutico, en un solo lugar
        </h1>
        <p className="text-tinta/70 text-lg md:text-xl mb-10 max-w-xl">
          Un espacio privado donde encontrás los videos, lecturas y ejercicios
          que tu psicólogo seleccionó para vos, junto con la agenda de tus sesiones.
        </p>
        <Link href="/login" className="bg-marca text-white px-10 py-4 rounded-full font-bold text-base shadow-lg shadow-marca/25 transition-all hover:bg-marca/90 hover:shadow-xl hover:-translate-y-0.5">
          Acceder a mi espacio
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-20 text-left">
          <div className="bg-white rounded-2xl border border-tinta/10 p-6 shadow-sm">
            <FolderHeart className="w-8 h-8 text-marca mb-4" />
            <h3 className="font-heading font-bold text-tinta text-lg mb-2">Material a tu medida</h3>
            <p className="text-sm text-tinta/70">Solo ves el contenido que tu psicólogo te asignó, organizado en programas y una biblioteca de apoyo.</p>
          </div>
          <div className="bg-white rounded-2xl border border-tinta/10 p-6 shadow-sm">
            <Calendar className="w-8 h-8 text-marca mb-4" />
            <h3 className="font-heading font-bold text-tinta text-lg mb-2">Tus sesiones</h3>
            <p className="text-sm text-tinta/70">Agenda con tus próximas sesiones y acceso directo a la videollamada.</p>
          </div>
          <div className="bg-white rounded-2xl border border-tinta/10 p-6 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-marca mb-4" />
            <h3 className="font-heading font-bold text-tinta text-lg mb-2">Privado</h3>
            <p className="text-sm text-tinta/70">Acceso únicamente por invitación de tu psicólogo. Acá no se publica ni se comparte nada.</p>
          </div>
        </div>
      </section>

      <footer className="bg-tinta text-crema/60 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Espacio Terapéutico. Plataforma privada de material para pacientes.
      </footer>
    </main>
  )
}
