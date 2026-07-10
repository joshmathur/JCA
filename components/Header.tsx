'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="w-full h-14 bg-gray-950 text-white flex items-center justify-between px-6 border-b border-gray-800">
      <div className="flex items-center">
        <span className="text-lg font-bold tracking-wide text-blue-400">
          JCA
        </span>
        <span className="ml-2 text-sm text-gray-400">
          Josh&apos;s Crypto Aid
        </span>
      </div>

      {loading ? null : user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Log In
        </Link>
      )}
    </header>
  );
}