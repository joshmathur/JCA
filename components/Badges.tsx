import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

type Confidence = 'low' | 'medium' | 'high'
type Outlook = 'favorable' | 'neutral' | 'unfavorable'

const confidenceStyles: Record<Confidence, string> = {
  high: 'bg-positive/15 text-positive ring-positive/30',
  medium: 'bg-[#c2a878]/15 text-[#c2a878] ring-[#c2a878]/30',
  low: 'bg-muted text-muted-foreground ring-border/70',
}

/** Visual confidence pill — reused by analysis + picks. */
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${confidenceStyles[confidence]}`}
    >
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-1 rounded-full ${
              (confidence === 'low' && i === 0) ||
              (confidence === 'medium' && i <= 1) ||
              confidence === 'high'
                ? 'bg-current'
                : 'bg-current/25'
            }`}
          />
        ))}
      </span>
      {confidence} confidence
    </span>
  )
}

const outlookConfig: Record<
  Outlook,
  { label: string; className: string; Icon: typeof TrendingUp }
> = {
  favorable: {
    label: 'Favorable',
    className: 'bg-positive/15 text-positive ring-positive/30',
    Icon: TrendingUp,
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-[#c2a878]/15 text-[#c2a878] ring-[#c2a878]/30',
    Icon: Minus,
  },
  unfavorable: {
    label: 'Unfavorable',
    className: 'bg-negative/15 text-[#d98b76] ring-negative/40',
    Icon: TrendingDown,
  },
}

/** Visual outlook badge. */
export function OutlookBadge({ outlook }: { outlook: Outlook }) {
  const { label, className, Icon } = outlookConfig[outlook]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}
