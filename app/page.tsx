'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'motion/react'
import { Star, Sparkles, TrendingUp, ArrowRight, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Treeline from '@/components/Treeline'
import GrassField from '@/components/GrassField'

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

const features = [
  {
    icon: Star,
    title: 'Watchlist',
    body: 'Track live prices for the coins you care about, refreshed automatically in the background.',
  },
  {
    icon: Sparkles,
    title: 'AI Signals',
    body: 'Claude-generated analysis on any coin — entry zones, outlook, and reasoning grounded in current market data.',
  },
  {
    icon: TrendingUp,
    title: 'Daily Picks',
    body: 'A fresh shortlist of standout coins each day, selected and explained by AI so you know where to look.',
  },
]

export default function Home() {
  // Auth-aware CTAs so logged-in visitors always have a path into the app.
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user))
  }, [])

  const ctaHref = authed ? '/dashboard' : '/signup'
  const heroCta = authed ? 'Go to dashboard' : 'Get started'
  const aboutCta = authed ? 'Go to dashboard' : 'Start exploring'

  return (
    <div className="relative overflow-hidden">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-40 pt-24 text-center">
        {/* Treeline anchored to the bottom of the hero, behind the content. */}
        <Treeline className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] w-full" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto max-w-3xl"
        >
          <motion.div
            variants={rise}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
          >
            <Leaf className="size-3.5 text-primary" />
            AI-powered crypto research
          </motion.div>

          <motion.h1
            variants={rise}
            className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            <span className="text-forest-gradient">Josh&apos;s Crypto Aid</span>
          </motion.h1>

          <motion.p
            variants={rise}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            A calm place to research the market. Track your watchlist in real
            time, read the latest news, and let AI surface daily analysis and
            picks — all in one quiet corner of the forest.
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <CtaButton href={ctaHref}>{heroCta}</CtaButton>
            {!authed && (
              <Link
                href="/login"
                className="rounded-full px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                I already have an account
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <SectionHeading eyebrow="What you get" title="Everything in one place" />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="surface-grain group rounded-3xl border border-border/70 bg-card/80 p-6 shadow-forest transition-colors hover:border-primary/40"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-accent/60 text-primary ring-1 ring-inset ring-border/60 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="size-5" />
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- About */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-16 pt-4 text-center">
        <hr className="divider-organic mx-auto mb-14 w-2/3" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Research, not noise.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            JCA is a full-stack research assistant built by Josh — live market
            data, Supabase auth, and the Claude API for AI-driven analysis. It
            helps you think. It never places a trade.
          </p>
          <div className="mt-10">
            <CtaButton href={ctaHref}>{aboutCta}</CtaButton>
          </div>
        </motion.div>
      </section>

      {/* -------------------------------------------------------------- Footer */}
      <footer className="relative z-10 mt-8">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm text-muted-foreground">Josh&apos;s Crypto Aid</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Research only · never places trades
          </p>
        </div>
        {/* Interactive long grass grounds the page — waves, and parts as you brush over it. */}
        <GrassField className="mt-6 block h-52 w-full sm:h-64" />
      </footer>
    </div>
  )
}

/* --------------------------------------------------------------- primitives */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
    </motion.div>
  )
}

/** Prominent CTA with a satisfying hover: lift, glow, and a nudging arrow. */
function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="inline-block"
    >
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-forest transition-shadow hover:shadow-[0_0_0_1px_rgba(90,138,90,0.5),0_12px_30px_-8px_rgba(90,138,90,0.55)]"
      >
        {/* Sheen sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {children}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  )
}
