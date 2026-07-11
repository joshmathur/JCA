'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'

/**
 * Route transition wrapper. Keyed on pathname so every navigation remounts and
 * replays a mount-only enter animation (fade + slight rise + blur-in). We
 * deliberately do NOT animate exits: exit animations race Next's instant route
 * swap in the App Router and cause flashing. Enter-only stays smooth.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}