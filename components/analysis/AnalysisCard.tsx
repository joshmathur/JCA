'use client'

import { motion } from 'motion/react'
import { AlertCircle, Newspaper, LineChart, ExternalLink } from 'lucide-react'
import type { AIAnalysis } from '@/types/analysis'
import { ConfidenceBadge, OutlookBadge } from '@/components/Badges'

/**
 * Presentation for a single coin's AI analysis. Three states: thinking (a
 * smooth shimmer animation, not a spinner), error, and result. No data logic
 * lives here — the parent owns fetching.
 */

/** Claude "thinking" animation — breathing sparkle + waving shimmer bars. */
export function AnalysisThinking() {
  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
        <motion.span
          className="inline-flex size-4 items-center justify-center"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M12 2l1.9 5.6L19.5 9l-4.5 3.3L16.6 18 12 14.7 7.4 18l1.6-5.7L4.5 9l5.6-1.4L12 2z" />
          </svg>
        </motion.span>
        Reading the market…
      </div>
      <div className="space-y-2">
        {[92, 78, 85].map((w, i) => (
          <motion.div
            key={i}
            className="h-2.5 rounded-full bg-gradient-to-r from-muted via-accent/70 to-muted bg-[length:200%_100%]"
            style={{ width: `${w}%` }}
            animate={{ backgroundPositionX: ['150%', '-50%'] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.18,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function AnalysisError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex items-start gap-2 rounded-xl border border-negative/40 bg-negative/10 p-3 text-xs text-[#d98b76]"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  )
}

export function AnalysisResult({ analysis }: { analysis: AIAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 overflow-hidden border-t border-border/50 pt-3"
    >
      {/* Badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <OutlookBadge outlook={analysis.outlook} />
        <ConfidenceBadge confidence={analysis.confidence} />
      </div>

      {analysis.outlook === 'unfavorable' ? (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-3 py-2.5 text-sm font-medium text-[#d98b76]">
          No position recommended right now.
        </div>
      ) : (
        <div className="divide-y divide-border/40 rounded-xl bg-background/50 px-3 ring-1 ring-inset ring-border/50">
          <Stat label="Entry" value={analysis.entryZone} />
          <Stat label="Exit" value={analysis.exitZone} />
          <Stat label="Stop-loss" value={analysis.stopLoss} />
        </div>
      )}

      {/* Reasoning */}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {analysis.reasoning}
      </p>

      {/* Provenance */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
        {analysis.newsBased ? (
          <>
            <Newspaper className="size-3.5 text-primary/80" />
            News-informed
          </>
        ) : (
          <>
            <LineChart className="size-3.5" />
            Price action only
          </>
        )}
      </div>

      {/* Cited sources */}
      {analysis.citedArticles.length > 0 && (
        <div className="mt-2 space-y-1">
          {analysis.citedArticles.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{a.title}</span>
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )
}
