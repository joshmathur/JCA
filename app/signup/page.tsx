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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is off, Supabase returns a session immediately
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setMessage('Check your email to confirm your account.');
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your JCA research space"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogleSignup}>Continue with Google</GoogleButton>

      <OrDivider />

      <form onSubmit={handleEmailSignup} className="space-y-4">
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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />

        <AuthAlert message={error} tone="error" />
        <AuthAlert message={message} tone="success" />

        <SubmitButton loading={loading} loadingText="Signing up…">
          Sign up
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
