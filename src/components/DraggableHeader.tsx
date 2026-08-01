"use client"

import { useState, useRef, useEffect } from "react"

export function DraggableHeader({
  title = "Mover recuadro",
  children,
}: {
  title?: string
  children?: React.ReactNode
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const rel = useRef({ x: 0, y: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    // Evitar iniciar arrastre si se hace clic en botones/inputs dentro de la barra
    if ((e.target as HTMLElement).tagName.match(/BUTTON|INPUT|SELECT|A/i)) return
    dragging.current = true
    rel.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - rel.current.x, y: e.clientY - rel.current.y })
    }

    const onMouseUp = () => {
      dragging.current = false
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  return (
    <div style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }} className="transition-transform duration-75">
      <div
        onMouseDown={onMouseDown}
        className="h-8 bg-noche text-nieve flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none text-xs font-bold rounded-t-lg shadow-sm border-b border-white/10"
      >
        <span className="flex items-center gap-2">
          <span className="opacity-60 text-sm">⠿</span> {title}
        </span>
      </div>
      {children}
    </div>
  )
}
