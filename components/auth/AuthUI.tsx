'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Leaf, Loader2 } from 'lucide-react'
import Treeline from '@/components/Treeline'

/**
 * Shared presentational kit for the login & signup pages. No auth logic lives
 * here — pages pass in their own handlers/state. Because both pages render the
 * identical shell in the same position, navigating between them reads as a
 * smooth content morph under the global page transition.
 */

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Quiet ambient forest: a faint treeline at the base + the body's warmth. */}
      <Treeline className="pointer-events-none absolute inset-x-0 bottom-0 h-[36vh] w-full opacity-40" />

      <div className="surface-grain relative z-10 w-full max-w-md rounded-3xl border border-border/70 bg-card/80 p-8 shadow-forest backdrop-blur-xl sm:p-9">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/30">
            <Leaf className="size-4 text-primary" />
          </span>
          <span className="text-lg font-semibold tracking-tight">JCA</span>
        </Link>

        <div className="mb-7 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <p className="mt-7 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  )
}

export function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-background/80 focus:ring-2 focus:ring-primary/25"
        {...props}
      />
    </div>
  )
}

export function GoogleButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
      </svg>
      {children}
    </motion.button>
  )
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="divider-organic flex-1" />
      <span className="text-xs uppercase tracking-widest text-muted-foreground/70">
        or
      </span>
      <span className="divider-organic flex-1" />
    </div>
  )
}

export function SubmitButton({
  loading,
  loadingText,
  children,
}: {
  loading: boolean
  loadingText: string
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={loading ? undefined : { y: -1 }}
      whileTap={loading ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-forest transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {loading ? loadingText : children}
    </motion.button>
  )
}

/** Animated inline alert. tone: 'error' | 'success'. */
export function AuthAlert({
  message,
  tone,
}: {
  message: string | null
  tone: 'error' | 'success'
}) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              tone === 'error'
                ? 'border-destructive/40 bg-destructive/10 text-[#e0917f]'
                : 'border-positive/40 bg-positive/10 text-[#a7d3a1]'
            }`}
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
