'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Leaf, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Subtle scroll effect: header gains a translucent, blurred backing once the
  // user scrolls past the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isLanding = pathname === '/';
  // On landing, float transparently over the hero until scrolled. Elsewhere,
  // always show the backing so content reads clearly beneath.
  const showBacking = scrolled || !isLanding;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        showBacking
          ? 'border-b border-border/60 bg-background/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          href={user ? '/dashboard' : '/'}
          className="group flex items-center gap-2.5"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-inset ring-primary/30 transition-transform duration-300 group-hover:scale-105">
            <Leaf className="size-4 text-primary" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              JCA
            </span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Josh&apos;s Crypto Aid
            </span>
          </span>
        </Link>

        {/* Auth-aware actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-muted/50" />
          ) : user ? (
            <>
              <span className="mr-1 hidden max-w-[180px] truncate text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
              <motion.button
                onClick={handleLogout}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <LogOut className="size-3.5" />
                Log out
              </motion.button>
            </>
          ) : (
            <>
              <UnderlineLink href="/login">Log in</UnderlineLink>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-forest transition-[filter] hover:brightness-110"
                >
                  Sign up
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Text link with a smooth underline that grows from the left on hover. */
function UnderlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <span className="absolute inset-x-3.5 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}
