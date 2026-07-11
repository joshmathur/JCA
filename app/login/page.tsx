'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  AuthShell,
  Field,
  GoogleButton,
  OrDivider,
  SubmitButton,
  AuthAlert,
} from '@/components/auth/AuthUI';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your JCA research space"
      footer={
        <>
          No account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogleLogin}>Continue with Google</GoogleButton>

      <OrDivider />

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Field
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <AuthAlert message={error} tone="error" />

        <SubmitButton loading={loading} loadingText="Logging in…">
          Log in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
