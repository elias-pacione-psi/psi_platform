'use client'

import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'

export function JoinMeetButton({ linkVideollamada }: { linkVideollamada: string }) {
  return (
    <Button
      onClick={() => window.open(linkVideollamada, '_blank', 'noopener,noreferrer')}
      className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-sans font-bold text-lg h-14 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
    >
      <Video className="w-5 h-5" />
      Unirse a mi clase en vivo
    </Button>
  )
}
