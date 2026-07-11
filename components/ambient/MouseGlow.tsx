'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import ForestBackdrop from './ForestBackdrop'

/**
 * A soft "flashlight" that follows the cursor. It sits behind page content
 * (-z-10) so it glows through the translucent surfaces. When `revealForest` is
 * set, a hidden forest silhouette is masked to the cursor so trees are only
 * visible in the pool of light. Whisper-subtle by design.
 */
export default function MouseGlow({ revealForest = false }: { revealForest?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.style.setProperty('--x', `${e.clientX}px`)
        el.style.setProperty('--y', `${e.clientY}px`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const baseVars = { '--x': '50vw', '--y': '50vh' } as CSSProperties

  // Reveal only near the cursor; soft falloff.
  const revealMask =
    'radial-gradient(circle 230px at var(--x) var(--y), #000 0%, rgba(0,0,0,0.55) 45%, transparent 78%)'

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={baseVars}
    >
      {revealForest && (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            WebkitMaskImage: revealMask,
            maskImage: revealMask,
            willChange: 'mask-image, -webkit-mask-image',
          }}
        >
          <ForestBackdrop className="absolute inset-x-0 bottom-0 h-[78vh] w-full" />
        </div>
      )}

      {/* Warm-green light pool + a faint inner core. Kept very subtle. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 300px at var(--x) var(--y), rgba(90,138,90,0.10), transparent 72%)',
          willChange: 'background',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 130px at var(--x) var(--y), rgba(206,222,160,0.06), transparent 70%)',
          willChange: 'background',
        }}
      />
    </div>
  )
}
