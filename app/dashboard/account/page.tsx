'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Mail, Save, Loader2, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AccountPage() {
  const [user, setUser] = useState<{ uid: string; email: string | null; displayName: string | null } | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userData = { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName };
        setUser(userData);

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || currentUser.displayName || currentUser.email || '');
        } else {
          setUsername(currentUser.displayName || currentUser.email || '');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!user || !username.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(auth.currentUser!, { displayName: username.trim() });

      await updateDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
      });

      setMessage({ type: 'success', text: 'Username updated successfully!' });
    } catch (e) {
      console.error('Failed to update username:', e);
      setMessage({ type: 'error', text: 'Failed to update username. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <User className="mx-auto text-slate-500" size={48} />
          <h1 className="mt-4 text-xl font-semibold text-white">Sign in to access your account</h1>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <User className="text-brand-400" size={28} />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-brand-100">EcoLoop</p>
              <h1 className="text-3xl font-semibold text-white">My Account</h1>
            </div>
          </div>
          <a href="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ChevronLeft size={18} />
            <span>Back to dashboard</span>
          </a>
        </header>

        <Card className="mt-8 p-6">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="flex items-center gap-2">
              <User className="text-brand-400" size={24} />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-slate-300">Email</label>
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <Mail className="text-slate-400" size={18} />
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-transparent border-0 focus:ring-0 text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-slate-300">Username</label>
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <User className="text-slate-400" size={18} />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent border-0 focus:ring-0 text-slate-100"
                  placeholder="Enter your username"
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-slate-500">This will be displayed on the leaderboard</p>
            </div>

            {message && (
              <div className={`flex items-center gap-3 p-4 rounded-3xl ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !username.trim()}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}