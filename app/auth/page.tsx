'use client';

import Link from 'next/link';
import { useEffect, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Leaf, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<null | { uid: string; email?: string | null }>(null);
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? { uid: currentUser.uid, email: currentUser.email } : null);
      if (currentUser) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      if (isSignUp) {
        await setDoc(
          doc(db, 'users', credential.user.uid),
          { email: credential.user.email, createdAt: serverTimestamp() },
          { merge: true },
        );
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch = Boolean(isSignUp && password && confirmPassword && password !== confirmPassword);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100" id="main-content">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10 lg:px-10" aria-labelledby="auth-heading">
        <Card className="grid w-full overflow-hidden lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent p-8" aria-hidden="true">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-100">EcoLoop Access</div>
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Sign in to manage upcycling projects and scans.</h1>
              <p className="mt-3 text-slate-200/85">Secure Firebase Auth keeps your scan history and progress private. The dashboard shows aggregate carbon impact in real time.</p>
            </div>
            <div className="space-y-4">
              {[
                'Firebase Auth + Firestore sync',
                'OpenRouter scan analysis and blueprint generation',
                'A sustainable dashboard for active and completed projects',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
                  <ShieldCheck className="text-brand-400" size={18} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Authentication</p>
                <h2 id="auth-heading" className="text-2xl font-semibold text-white">{isSignUp ? 'Create account' : 'Welcome back'}</h2>
              </div>
              <Leaf className="text-brand-400" size={24} aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id={emailId}
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />

              <div className="relative">
                <Input
                  id={passwordId}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  disabled={loading}
                  hint={isSignUp ? 'At least 6 characters' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              {isSignUp && (
                <div className="relative">
                  <Input
                    id={confirmPasswordId}
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    error={passwordMismatch ? 'Passwords do not match' : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              )}

              {(error || passwordMismatch) && (
                <p
                  id={errorId}
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100"
                  role="alert"
                  aria-live="polite"
                >
                  {passwordMismatch ? 'Passwords do not match' : error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading || passwordMismatch}
              >
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-200">
              <button
                type="button"
                className="text-brand-100 hover:text-brand-50"
                onClick={() => setIsSignUp((prev) => !prev)}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
              {user ? (
                <button
                  type="button"
                  className="text-slate-200 hover:text-white"
                  onClick={() => signOut(auth)}
                >
                  Sign out
                </button>
              ) : null}
            </div>

            <p className="mt-8 text-sm text-slate-300">Need a quick route to the main workspace? <Link href="/dashboard" className="text-brand-100 hover:text-brand-50">Open the dashboard</Link>.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
