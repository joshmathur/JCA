'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

type Fly = {
  id: number
  left: number
  top: number
  size: number
  dur: number
  delay: number
  x: number[]
  y: number[]
  flick: number[]
}

/**
 * Fireflies drifting across the viewport. Foreground ambience (above content,
 * below the header), kept dim and small. Positions/paths are randomised on the
 * client after mount so there's no SSR hydration mismatch. Motion respects the
 * user's reduced-motion setting (via the app's MotionConfig) — drift stops,
 * only the gentle flicker remains.
 */
export default function Fireflies({ count = 16 }: { count?: number }) {
  const [flies, setFlies] = useState<Fly[]>([])

  useEffect(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const arr: Fly[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: rand(2, 98),
      top: rand(2, 92),
      size: rand(2, 3.8),
      dur: rand(10, 20),
      delay: rand(0, 9),
      x: [0, rand(-70, 70), rand(-45, 45), rand(-80, 80), 0],
      y: [0, rand(-60, 40), rand(-80, 30), rand(-40, 70), 0],
      flick: [0, rand(0.5, 0.9), rand(0.1, 0.35), rand(0.55, 0.95), 0],
    }))
    setFlies(arr)
  }, [count])

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      {flies.map((f) => (
        <motion.span
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            background:
              'radial-gradient(circle, rgba(214,232,154,0.95), rgba(160,200,90,0.5) 45%, transparent 72%)',
            boxShadow: '0 0 8px 2px rgba(180,220,110,0.35)',
          }}
          initial={{ opacity: 0 }}
          animate={{ x: f.x, y: f.y, opacity: f.flick }}
          transition={{
            duration: f.dur,
            delay: f.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
