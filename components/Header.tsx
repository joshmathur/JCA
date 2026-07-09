'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

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

      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Log out
      </button>
    </header>
  );
}