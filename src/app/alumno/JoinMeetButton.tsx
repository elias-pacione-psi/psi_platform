'use client'

import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'

export function JoinMeetButton({ linkVideollamada }: { linkVideollamada: string }) {
  return (
    <Button
      onClick={() => window.open(linkVideollamada, '_blank', 'noopener,noreferrer')}
      className="w-full bg-marca hover:bg-marca/80 text-white font-sans text-lg h-14 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 flex gap-2"
    >
      <Video className="w-6 h-6" />
      Unirme a la sesión
    </Button>
  )
}
