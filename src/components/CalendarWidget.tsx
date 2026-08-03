"use client";

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns';
import { parse } from 'date-fns';
import { startOfWeek } from 'date-fns';
import { getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventoCalendario } from '@/app/calendarActions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarSesionUnica, eliminarTodaLaAgendaDelAlumno } from '@/app/psicologo/actions';

// Formato requerido por Google Calendar: YYYYMMDDTHHmmSSZ
function formatoFechaGoogle(date: Date) {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
}

function urlGoogleCalendar(evento: EventoCalendario) {
  const start = new Date(evento.start)
  const end = new Date(evento.end)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.title,
    dates: `${formatoFechaGoogle(start)}/${formatoFechaGoogle(end)}`,
    location: evento.tipo === 'presencial' ? (evento.lugar || '') : (evento.enlace || ''),
    details: evento.tipo === 'presencial' ? 'Sesión presencial.' : 'Sesión virtual — el enlace está en "Ubicación".',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const messages = {
  allDay: 'Todo el día',
  previous: 'Atrás',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total: number) => `+ Ver más (${total})`
};

interface CalendarWidgetProps {
  eventos: EventoCalendario[];
  esPsicologo?: boolean;
}

export function CalendarWidget({ eventos, esPsicologo = false }: CalendarWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [detalleDialog, setDetalleDialog] = useState<{ open: boolean, selectedEvent: EventoCalendario | null }>({ open: false, selectedEvent: null });

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectEvent = (event: any) => {
    // Todos ven el detalle (el alumno accede al link de videollamada); solo el psicólogo ve acciones de borrado
    if (event.type === 'sesion') {
      setDetalleDialog({ open: true, selectedEvent: event });
    }
  }

  const confirmDelete = async () => {
    const eventId = detalleDialog.selectedEvent?.id?.replace('sesion-', '');
    if (eventId) {
      try {
        const result = await eliminarSesionUnica(eventId)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Sesión eliminada de la agenda.")
        }
      } catch {
        toast.error("Error al eliminar la sesión.")
      }
    }
    setDetalleDialog({ open: false, selectedEvent: null })
  }

  const confirmDeleteAll = async () => {
    const alumnoId = detalleDialog.selectedEvent?.alumno_id;
    if (alumnoId) {
      try {
        const result = await eliminarTodaLaAgendaDelAlumno(alumnoId)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Todas las sesiones del alumno fueron eliminadas.")
        }
      } catch {
        toast.error("Error al eliminar las sesiones en lote.")
      }
    }
    setDetalleDialog({ open: false, selectedEvent: null })
  }

  if (!mounted) {
    return (
      <div className="h-[600px] w-full bg-muted animate-pulse rounded-xl border border-border flex items-center justify-center">
        <p className="text-muted-foreground font-sans">Cargando calendario...</p>
      </div>
    );
  }

  // Deserializar las fechas que vienen del SSR
  const calendarEvents = eventos.map(ev => ({
    ...ev,
    start: new Date(ev.start),
    end: new Date(ev.end),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventPropGetter = (event: any) => {
    let backgroundColor = '#5a6d7d'; // Azul medio de marca (sesiones)
    let color = 'white';

    if (event.type === 'feriado') {
      backgroundColor = '#cbd5e1'; // Slate 300 (gris opaco)
      color = '#334155'; // Slate 700
    } else if (event.tipo === 'presencial') {
      backgroundColor = '#2f3e46'; // Petróleo (presencial)
    }

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: '5px',
        border: 'none',
        display: 'block',
        fontWeight: 'bold',
        fontSize: '0.85rem'
      }
    };
  };

  return (
    <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm h-[700px]">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        messages={messages}
        culture="es"
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day']}
        defaultView="month"
      />

      <AlertDialog open={detalleDialog.open} onOpenChange={(open) => setDetalleDialog({ open, selectedEvent: open ? detalleDialog.selectedEvent : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-tinta font-serif text-2xl">
              {detalleDialog.selectedEvent?.title || 'Detalle del evento'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-base text-muted-foreground">
              <span className="block">
                {detalleDialog.selectedEvent?.type === 'sesion' && (
                  <>
                    <span className="mt-2 block">
                      {detalleDialog.selectedEvent?.start ? format(new Date(detalleDialog.selectedEvent.start), "EEEE d 'de' MMMM - HH:mm 'hs'", { locale: es }) : ''}
                    </span>
                    {detalleDialog.selectedEvent?.tipo === 'presencial' && (
                      <span className="mt-2 block font-semibold text-tinta">📍 Presencial{detalleDialog.selectedEvent?.lugar ? ` — ${detalleDialog.selectedEvent.lugar}` : ''}</span>
                    )}
                  </>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {detalleDialog.selectedEvent?.type === 'sesion' && detalleDialog.selectedEvent?.tipo !== 'presencial' && detalleDialog.selectedEvent?.enlace && (
            <div className="flex w-full mb-2">
              <a href={detalleDialog.selectedEvent.enlace} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full flex items-center justify-center bg-noche hover:bg-noche/90 text-white font-semibold py-2 px-4 transition-colors h-12 text-md shadow-md rounded-xl">
                  📹 Entrar a la videollamada
                </Button>
              </a>
            </div>
          )}

          {detalleDialog.selectedEvent?.type === 'sesion' && (
            <div className="flex w-full mb-4">
              <a href={urlGoogleCalendar(detalleDialog.selectedEvent)} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center border-tinta/20 text-tinta hover:bg-crema font-semibold h-10 rounded-xl">
                  <CalendarPlus className="w-4 h-4 mr-2" /> Agregar a Google Calendar
                </Button>
              </a>
            </div>
          )}

          <AlertDialogFooter className="mt-4 sm:justify-center gap-2">
            <AlertDialogCancel>Cerrar</AlertDialogCancel>

            {esPsicologo && detalleDialog.selectedEvent?.type === 'sesion' && (
              <>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  Eliminar sesión
                </AlertDialogAction>
                {detalleDialog.selectedEvent?.alumno_id && (
                  <AlertDialogAction onClick={confirmDeleteAll} className="bg-red-800 hover:bg-red-900 text-white font-bold">
                    Eliminar todas las del alumno
                  </AlertDialogAction>
                )}
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
