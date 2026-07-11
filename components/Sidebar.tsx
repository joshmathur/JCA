'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Star, Newspaper, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import clsx from 'clsx'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/picks', label: 'Picks', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 self-start border-r border-border/50 bg-sidebar/50 px-3 py-6 backdrop-blur-sm">
      <p className="px-3 pb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
        Navigate
      </p>

      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className="group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium"
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-accent/70 ring-1 ring-inset ring-primary/25"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className={clsx(
                'relative z-10 flex items-center gap-3 transition-colors duration-200',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            >
              <Icon
                className={clsx(
                  'size-[18px] transition-colors duration-200',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                )}
              />
              {label}
            </span>
          </Link>
        )
      })}

      <div className="mt-auto px-3">
        <hr className="divider-organic mb-4" />
        <p className="text-xs leading-relaxed text-muted-foreground/50">
          Research only. JCA never places trades.
        </p>
      </div>
    </aside>
  )
}
