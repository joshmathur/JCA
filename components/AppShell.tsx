'use client'

import { usePathname } from 'next/navigation'
import { MotionConfig } from 'motion/react'
import Header from './Header'
import Sidebar from './Sidebar'
import PageTransition from './PageTransition'
import Fireflies from './ambient/Fireflies'
import MouseGlow from './ambient/MouseGlow'

// Auth pages render as self-contained, full-bleed screens (no app chrome).
const BARE_ROUTES = ['/login', '/signup']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  )
  const isLanding = pathname === '/'
  const showSidebar = !isBare && !isLanding

  // Motion respects the user's OS "reduce motion" setting everywhere.
  return (
    <MotionConfig reducedMotion="user">
      {isBare ? (
        <PageTransition>{children}</PageTransition>
      ) : (
        <>
          {/* Ambient forest layer. Fireflies everywhere but the auth pages;
              the cursor "flashlight" reveals the treeline only off the landing
              (the landing already shows its own treeline). */}
          <MouseGlow revealForest={!isLanding} />
          <Fireflies />

          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
              {showSidebar && <Sidebar />}
              <main className={showSidebar ? 'flex-1 px-6 py-8' : 'flex-1'}>
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
        </>
      )}
    </MotionConfig>
  )
}
