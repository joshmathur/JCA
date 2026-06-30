'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Star, Newspaper, TrendingUp } from 'lucide-react'
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
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col py-6 px-4 gap-2">
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </aside>
  )
}