/**
 * A full-bleed forest silhouette that is invisible on its own — it's meant to
 * be masked by <MouseGlow> so it only shows where the cursor's "flashlight"
 * falls. A faint green fog reads as illuminated air; dark firs at three depths
 * sit in front of it as silhouettes.
 */

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

type Tree = { x: number; base: number; h: number; w: number }

// Distant tree tops peeking up — rooted higher, smaller.
const FAR: Tree[] = [
  { x: 90, base: 470, h: 190, w: 42 },
  { x: 300, base: 455, h: 220, w: 48 },
  { x: 520, base: 475, h: 175, w: 40 },
  { x: 740, base: 450, h: 230, w: 50 },
  { x: 960, base: 470, h: 195, w: 44 },
  { x: 1180, base: 455, h: 215, w: 48 },
  { x: 1380, base: 470, h: 200, w: 44 },
]

const MID: Tree[] = [
  { x: 40, base: 585, h: 320, w: 66 },
  { x: 250, base: 600, h: 360, w: 74 },
  { x: 470, base: 585, h: 330, w: 68 },
  { x: 690, base: 605, h: 375, w: 78 },
  { x: 910, base: 585, h: 340, w: 70 },
  { x: 1130, base: 600, h: 360, w: 74 },
  { x: 1350, base: 585, h: 335, w: 70 },
]

const NEAR: Tree[] = [
  { x: 150, base: 710, h: 500, w: 104 },
  { x: 430, base: 710, h: 540, w: 112 },
  { x: 720, base: 710, h: 505, w: 106 },
  { x: 1010, base: 710, h: 545, w: 114 },
  { x: 1310, base: 710, h: 515, w: 108 },
]

export default function ForestBackdrop({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fb-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d5c3d" stopOpacity="0" />
          <stop offset="55%" stopColor="#3d5c3d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5a8a5a" stopOpacity="0.42" />
        </linearGradient>
      </defs>

      {/* Illuminated air */}
      <rect x="0" y="120" width="1440" height="580" fill="url(#fb-fog)" />

      {/* Depth layers, far (lighter) → near (darkest) */}
      <g fill="#12241a">
        {FAR.map((t, i) => (
          <path key={`fb-f${i}`} d={fir(t.x, t.base, t.h, t.w)} />
        ))}
      </g>
      <g fill="#0c180e">
        {MID.map((t, i) => (
          <path key={`fb-m${i}`} d={fir(t.x, t.base, t.h, t.w)} />
        ))}
      </g>
      <g fill="#060d08">
        {NEAR.map((t, i) => (
          <path key={`fb-n${i}`} d={fir(t.x, t.base, t.h, t.w)} />
        ))}
      </g>
    </svg>
  )
}
