'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { Trophy, User, ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  uid: string;
  username: string;
  points: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rankAnnouncerRef = useRef<HTMLDivElement>(null);

  const announceRank = (message: string) => {
    if (rankAnnouncerRef.current) {
      rankAnnouncerRef.current.textContent = message;
    }
  };

  useEffect(() => {
    if (leaderboard.length > 0 && currentUserId) {
      const userEntry = leaderboard.find((e) => e.uid === currentUserId);
      if (userEntry) {
        const rank = leaderboard.findIndex((e) => e.uid === currentUserId) + 1;
        announceRank(`You are ranked ${rank} with ${userEntry.points} points.`);
      }
    }
  }, [leaderboard, currentUserId]);

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
      <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-brand-400">Loading leaderboard…</div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <div ref={rankAnnouncerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl" role="banner">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-400" size={28} aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-brand-100">EcoLoop</p>
              <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')} aria-label="Go back to dashboard">
            <ChevronLeft size={18} aria-hidden="true" /> Back to dashboard
          </Button>
        </header>

        <Card className="mt-8 overflow-hidden">
          <CardHeader className="p-6 pb-0">
            <CardTitle id="leaderboard-heading">Top Upcyclers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center text-slate-400" role="status" aria-live="polite">
                <Trophy className="mx-auto text-slate-600" size={48} aria-hidden="true" />
                <p className="mt-4 text-lg">No upcyclers yet</p>
                <p className="mt-2 text-sm">Complete projects to earn points and climb the ranks!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  role="table"
                  aria-labelledby="leaderboard-heading"
                >
                  <thead>
                    <tr className="border-b border-white/10">
                      <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-[0.18em] text-brand-100">Rank</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-[0.18em] text-brand-100">Upcycler</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-[0.18em] text-brand-100">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leaderboard.map((entry, index) => (
                      <tr
                        key={entry.uid}
                        className={`${getRankStyles(index)} transition-all ${
                          entry.uid === currentUserId ? 'ring-2 ring-brand-400 ring-inset' : ''
                        }`}
                        aria-label={entry.uid === currentUserId ? `You, rank ${index + 1}, ${entry.points} points` : `${entry.username}, rank ${index + 1}, ${entry.points} points`}
                      >
                        <td className="px-6 py-4 w-12 text-center" aria-label="Rank">
                          {getRankIcon(index)}
                        </td>
                        <td className="px-6 py-4" aria-label="Username">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{entry.username}</p>
                            {entry.uid === currentUserId && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30" aria-label="You">You</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" aria-label="Points">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-lg">{entry.points}</span>
                            <Trophy className="text-brand-400" size={16} aria-hidden="true" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {currentUserId && leaderboard.length > 0 && (
          <Card className="mt-6 p-6 bg-brand-900/30 border-brand-500/20" role="region" aria-label="Your leaderboard position">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="text-brand-400" size={24} aria-hidden="true" />
                <div>
                  <p className="text-sm text-slate-300">Your position</p>
                  <p className="font-semibold text-white" aria-live="polite">
                    {leaderboard.findIndex((e) => e.uid === currentUserId) + 1 || 'Unranked'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Your points</p>
                <p className="font-semibold text-white text-xl" aria-live="polite">
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