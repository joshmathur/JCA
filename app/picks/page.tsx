'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { SavedPick } from '@/types/picks';
import { ConfidenceBadge } from '@/components/Badges';

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PicksPage() {
  // Picks currently saved in Supabase — the source of truth for what renders
  const [savedPicks, setSavedPicks] = useState<SavedPick[]>([]);

  // True while the initial saved-picks fetch is in flight
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  useEffect(() => {
    fetchSavedPicks();
  }, []);

  const fetchSavedPicks = async () => {
    try {
      const res = await fetch('/api/ai/picks');
      if (!res.ok) throw new Error('Failed to fetch saved picks');
      const data: SavedPick[] = await res.json();
      setSavedPicks(data);
    } catch (error) {
      console.error('Fetch saved picks error:', error);
    } finally {
      setIsLoadingPicks(false);
    }
  };

  // All rows in a batch are inserted together, so the newest row's
  // timestamp is a good proxy for "when this whole batch was generated"
  const generatedAt = savedPicks[0]?.created_at
    ? new Date(savedPicks[0].created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-inset ring-primary/30">
            <Sparkles className="size-5" />
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Today&apos;s Picks
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {generatedAt
            ? `AI-selected standouts · last generated ${generatedAt}`
            : 'A daily AI-selected shortlist worth a closer look.'}
        </p>
      </header>

      {isLoadingPicks ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-muted/40" />
          ))}
        </div>
      ) : savedPicks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-sm text-muted-foreground">
          No picks yet. Picks are generated automatically once a day.
        </div>
      ) : (
        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {savedPicks.map((pick) => (
            <motion.div
              key={pick.id}
              variants={card}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="surface-grain group flex flex-col rounded-3xl border border-border/70 bg-card/80 p-5 shadow-forest transition-colors hover:border-primary/40"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Monogram avatar (picks carry no logo URL) */}
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-accent/60 text-sm font-semibold uppercase text-primary ring-1 ring-inset ring-border/60 transition-transform duration-300 group-hover:scale-105">
                    {pick.symbol.slice(0, 3)}
                  </span>
                  <div>
                    <p className="font-semibold tracking-tight text-foreground">
                      {pick.name}
                    </p>
                    <p className="text-xs uppercase text-muted-foreground">
                      {pick.symbol}
                    </p>
                  </div>
                </div>
                <ConfidenceBadge confidence={pick.analysis.confidence} />
              </div>

              <div className="flex items-start gap-2 rounded-2xl bg-background/40 p-3.5 text-sm leading-relaxed text-muted-foreground ring-1 ring-inset ring-border/40">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary/80" />
                <span>{pick.analysis.reason}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
