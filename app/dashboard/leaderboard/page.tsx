'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Trophy, User, ChevronLeft, type LucideIcon } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  uid: string;
  username: string;
  points: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const getRankStyles = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-lg shadow-amber-700/30';
    return 'bg-white/5 border border-white/10';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-300" size={24} />;
    if (index === 1) return <Trophy className="text-gray-300" size={20} />;
    if (index === 2) return <Trophy className="text-amber-300" size={18} />;
    return <span className="text-slate-400 font-bold">{index + 1}</span>;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-brand-400">Loading leaderboard…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-400" size={28} />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-brand-100">EcoLoop</p>
              <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
            </div>
          </div>
          <Button variant="outline" asChild><Link href="/dashboard"><ChevronLeft size={18} /> Back to dashboard</Link></Button>
        </header>

        <Card className="mt-8 overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <CardTitle>Top Upcyclers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/10">
              {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Trophy className="mx-auto text-slate-600" size={48} />
                  <p className="mt-4 text-lg">No upcyclers yet</p>
                  <p className="mt-2 text-sm">Complete projects to earn points and climb the ranks!</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.uid}
                    className={`flex items-center gap-4 px-6 py-4 transition-all ${getRankStyles(index)} ${
                      entry.uid === currentUserId ? 'ring-2 ring-brand-400' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 text-center">{getRankIcon(index)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.username}</p>
                      <p className="text-sm opacity-75">
                        {entry.uid === currentUserId ? 'You' : 'Upcycler'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-bold text-lg">{entry.points}</span>
                      <Trophy className="text-brand-400" size={16} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {currentUserId && leaderboard.length > 0 && (
          <Card className="mt-6 p-6 bg-brand-900/30 border-brand-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="text-brand-400" size={24} />
                <div>
                  <p className="text-sm text-slate-300">Your position</p>
                  <p className="font-semibold text-white">
                    {leaderboard.findIndex((e) => e.uid === currentUserId) + 1 || 'Unranked'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Your points</p>
                <p className="font-semibold text-white text-xl">
                  {leaderboard.find((e) => e.uid === currentUserId)?.points || 0}
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}