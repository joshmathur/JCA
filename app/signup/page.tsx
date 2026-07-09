'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
    <div style={{ maxWidth: 400, margin: '80px auto' }}>
      <h1>Sign up for JCA</h1>

      <button onClick={handleGoogleSignup} style={{ width: '100%', padding: 10, marginBottom: 16 }}>
        Continue with Google
      </button>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>or</div>

      <form onSubmit={handleEmailSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
        {message && <p style={{ color: 'green', fontSize: 14 }}>{message}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}