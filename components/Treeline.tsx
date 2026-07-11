/**
 * Layered forest treeline silhouette used in the landing hero. Purely
 * decorative. Three depth layers (far → near) of stylised firs sitting on soft
 * hills, with a faint green mist band behind them for atmosphere. Scales to the
 * full width of its container and anchors to the bottom.
 */

// Build a tiered-fir path: tip at (x, baseY - h), spreading to half-width w.
function fir(x: number, baseY: number, h: number, w: number): string {
  const t = baseY - h
  return [
    `M${x},${t}`,
    `L${x - w * 0.5},${baseY - h * 0.6} L${x - w * 0.3},${baseY - h * 0.6}`,
    `L${x - w * 0.72},${baseY - h * 0.32} L${x - w * 0.48},${baseY - h * 0.32}`,
    `L${x - w},${baseY} L${x + w},${baseY}`,
    `L${x + w * 0.48},${baseY - h * 0.32} L${x + w * 0.72},${baseY - h * 0.32}`,
    `L${x + w * 0.3},${baseY - h * 0.6} L${x + w * 0.5},${baseY - h * 0.6}`,
    'Z',
  ].join(' ')
}

type Tree = { x: number; h: number; w: number }

// Calm, sparse spacing — a treeline, not a dense forest.
const FAR: Tree[] = [
  { x: 120, h: 90, w: 34 },
  { x: 300, h: 70, w: 28 },
  { x: 520, h: 100, w: 38 },
  { x: 760, h: 78, w: 30 },
  { x: 980, h: 92, w: 34 },
  { x: 1180, h: 72, w: 28 },
  { x: 1360, h: 96, w: 36 },
]

const MID: Tree[] = [
  { x: 60, h: 150, w: 50 },
  { x: 250, h: 120, w: 42 },
  { x: 430, h: 165, w: 55 },
  { x: 640, h: 130, w: 46 },
  { x: 860, h: 158, w: 52 },
  { x: 1080, h: 124, w: 44 },
  { x: 1300, h: 160, w: 54 },
]

const NEAR: Tree[] = [
  { x: 150, h: 230, w: 74 },
  { x: 470, h: 200, w: 66 },
  { x: 820, h: 245, w: 80 },
  { x: 1120, h: 205, w: 68 },
  { x: 1400, h: 235, w: 76 },
]

export default function Treeline({ className = '' }: { className?: string }) {
  const BASE = 500
  return (
    <svg
      viewBox="0 0 1440 500"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Soft green mist glowing behind the trees. */}
        <radialGradient id="tl-mist" cx="50%" cy="100%" r="75%">
          <stop offset="0%" stopColor="#5a8a5a" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#3d5c3d" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0a0c0a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="120" width="1440" height="380" fill="url(#tl-mist)" />

      {/* Far layer — hill + small firs */}
      <g fill="#16221a" opacity="0.7">
        <path d={`M0,${BASE} L0,410 Q360,375 720,398 T1440,405 L1440,${BASE} Z`} />
        {FAR.map((t, i) => (
          <path key={`f${i}`} d={fir(t.x, 415, t.h, t.w)} />
        ))}
      </g>

      {/* Mid layer */}
      <g fill="#0f180f" opacity="0.92">
        <path d={`M0,${BASE} L0,455 Q300,425 720,448 T1440,450 L1440,${BASE} Z`} />
        {MID.map((t, i) => (
          <path key={`m${i}`} d={fir(t.x, 458, t.h, t.w)} />
        ))}
      </g>

      {/* Near layer — grounds into the page background */}
      <g fill="#0a0c0a">
        <path d={`M0,${BASE} L0,485 Q400,470 720,482 T1440,483 L1440,${BASE} Z`} />
        {NEAR.map((t, i) => (
          <path key={`n${i}`} d={fir(t.x, 490, t.h, t.w)} />
        ))}
      </g>
    </svg>
  )
}
