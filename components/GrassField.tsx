'use client'

import { useEffect, useRef } from 'react'

/**
 * Layered field of long, wavy grass for the landing footer — built in the same
 * silhouette style as the treeline (far → near depth layers). Blades sway on a
 * traveling breeze, and part away from the cursor as it sweeps across, like
 * brushing a hand through grass.
 *
 * Animation is a single rAF loop that writes each blade's rotation directly
 * (idle wave + cursor bend), which stays smooth with ~120 blades and avoids
 * fighting per-element animation libraries. Blade geometry is deterministic
 * (index-hashed, no Math.random) so SSR and client markup match.
 */

const VW = 1440
const VBH = 300
const BASE = 280

const frac = (n: number) => n - Math.floor(n)
const rnd = (i: number) => frac(Math.sin(i * 127.1 + 311.7) * 43758.5453)

type Blade = {
  x: number
  h: number
  curve: number
  w: number
  fill: string
  opacity: number
  phase: number
  sway: number
  speed: number
  bendMax: number
}

const LAYERS = [
  { count: 54, hMin: 80, hMax: 120, w: 3.2, fill: '#3f5f38', opacity: 0.8, sway: 3, bend: 12 },
  { count: 40, hMin: 120, hMax: 168, w: 3.8, fill: '#2c4a28', opacity: 0.92, sway: 4, bend: 17 },
  { count: 30, hMin: 160, hMax: 214, w: 4.6, fill: '#152719', opacity: 1, sway: 5.2, bend: 23 },
]

const blades: Blade[] = []
let idx = 0
for (const L of LAYERS) {
  const spacing = (VW + 60) / L.count
  for (let k = 0; k < L.count; k++) {
    const r1 = rnd(idx + 1)
    const r2 = rnd(idx + 7)
    const r3 = rnd(idx + 13)
    const r4 = rnd(idx + 19)
    const x = -30 + spacing * (k + 0.5) + (r1 - 0.5) * spacing * 0.8
    const h = L.hMin + r2 * (L.hMax - L.hMin)
    blades.push({
      x,
      h,
      curve: (r3 - 0.5) * 30 * (h / 214), // baked-in lean so blades look wavy at rest
      w: L.w * (0.8 + r4 * 0.5),
      fill: L.fill,
      opacity: L.opacity,
      phase: r1 * Math.PI * 2,
      sway: L.sway * (0.7 + r2 * 0.6),
      speed: 0.5 + r3 * 0.6,
      bendMax: L.bend,
    })
    idx++
  }
}

function bladePath(b: Blade): string {
  const { x, h, curve, w } = b
  return [
    `M${x - w},${BASE}`,
    `Q${x - w * 0.4},${BASE - h * 0.45} ${x + curve},${BASE - h}`,
    `Q${x + w * 0.4},${BASE - h * 0.45} ${x + w},${BASE}`,
    'Z',
  ].join(' ')
}

export default function GrassField({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const cursorX = useRef<number | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    const loop = () => {
      const t = performance.now() / 1000
      const cx = cursorX.current
      for (let i = 0; i < blades.length; i++) {
        const el = pathRefs.current[i]
        if (!el) continue
        const b = blades[i]
        const idle = reduce ? 0 : b.sway * Math.sin(t * b.speed + b.phase)
        let bend = 0
        if (cx !== null) {
          const dx = b.x / VW - cx
          const sigma = 0.05
          const infl = Math.exp(-(dx * dx) / (2 * sigma * sigma))
          bend = Math.tanh(dx / 0.05) * infl * b.bendMax // smoothly parts away from cursor
        }
        el.style.transform = `rotate(${idle + bend}deg)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const el = svgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    cursorX.current = (e.clientX - r.left) / r.width
  }
  const onPointerLeave = () => {
    cursorX.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VBH}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden="true"
    >
      {/* Ground the blades are rooted in */}
      <path
        d={`M0,${VBH} L0,${BASE - 4} Q720,${BASE - 14} 1440,${BASE - 4} L1440,${VBH} Z`}
        fill="#0a120a"
      />
      {blades.map((b, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el
          }}
          d={bladePath(b)}
          fill={b.fill}
          opacity={b.opacity}
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
            willChange: 'transform',
          }}
        />
      ))}
    </svg>
  )
}
