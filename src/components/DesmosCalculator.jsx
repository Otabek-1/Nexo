import { useEffect, useRef, useState } from 'react'

export default function DesmosCalculator() {
  const [isOpen, setIsOpen] = useState(true)
  const [position, setPosition] = useState(null)
  const [dragOrigin, setDragOrigin] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!dragOrigin) return undefined

    const handlePointerMove = (event) => {
      const panel = panelRef.current
      if (!panel) return
      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth)
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight)
      setPosition({
        left: Math.max(0, Math.min(maxLeft, dragOrigin.left + event.clientX - dragOrigin.x)),
        top: Math.max(0, Math.min(maxTop, dragOrigin.top + event.clientY - dragOrigin.y))
      })
    }

    const handlePointerUp = () => setDragOrigin(null)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragOrigin])

  const startDragging = (event) => {
    if (event.button !== 0 || !panelRef.current) return
    const bounds = panelRef.current.getBoundingClientRect()
    setDragOrigin({
      x: event.clientX,
      y: event.clientY,
      left: bounds.left,
      top: bounds.top
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-700 px-4 py-3 font-semibold text-white shadow-xl hover:bg-blue-800"
      >
        Desmos kalkulyator
      </button>
    )
  }

  return (
    <section
      ref={panelRef}
      aria-label="Desmos grafik kalkulyatori"
      className="fixed z-50 flex h-[min(460px,55vh)] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
      style={position
        ? { left: position.left, top: position.top }
        : { right: '1rem', bottom: '1rem' }}
    >
      <header
        onPointerDown={startDragging}
        className="flex cursor-move touch-none items-center justify-between bg-slate-800 px-4 py-2.5 text-white"
      >
        <span className="text-sm font-semibold">Desmos kalkulyator</span>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setIsOpen(false)}
          aria-label="Kalkulyatorni yopish"
          className="rounded px-2 py-1 text-lg leading-none hover:bg-white/15"
        >
          ×
        </button>
      </header>
      <iframe
        title="Desmos grafik kalkulyatori"
        src="https://www.desmos.com/calculator?embed"
        className="min-h-0 flex-1 border-0"
        allow="fullscreen"
      />
    </section>
  )
}
