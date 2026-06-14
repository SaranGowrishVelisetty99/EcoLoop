'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, lazy } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Leaf, ArrowLeft } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CarbonFootprintResult, CarbonFootprintHistoryEntry } from '@/types';

// Lazy load heavy components
const CarbonFootprintCalculatorLazy = lazy(() => import('@/components/carbon/CarbonFootprintCalculator').then(m => ({ default: m.CarbonFootprintCalculator })));
const CarbonFootprintChartsLazy = lazy(() => import('@/components/carbon/CarbonFootprintCharts').then(m => ({ default: m.CarbonFootprintCharts })));
const CarbonFootprintGoalsLazy = lazy(() => import('@/components/carbon/CarbonFootprintGoals').then(m => ({ default: m.CarbonFootprintGoals })));

// Suspense fallback components
function CalculatorFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-white/5 rounded-3xl" />
      <div className="h-64 bg-white/5 rounded-3xl" />
    </div>
  );
}

function ChartsFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-white/5 rounded-3xl" />
      <div className="h-64 bg-white/5 rounded-3xl" />
    </div>
  );
}

function GoalsFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-white/5 rounded w-3/4" />
      <div className="h-20 bg-white/5 rounded" />
    </div>
  );
}

export default function CarbonFootprintPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username] = useState<string>('');
  const [footprintResult, setFootprintResult] = useState<CarbonFootprintResult | null>(null);
  const [footprintHistory, setFootprintHistory] = useState<CarbonFootprintHistoryEntry[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const footprintRef = collection(db, 'users', userId, 'carbonFootprint');
    const historyQuery = query(footprintRef, orderBy('calculatedAt', 'desc'), limit(6));
    const unsub = onSnapshot(historyQuery, (snapshot) => {
      const entries = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          date: data.calculatedAt?.toDate() || new Date(),
          totalKgCo2: data.totalKgCo2PerYear || 0,
          breakdown: data.breakdown || { transport: 0, energy: 0, diet: 0, consumption: 0 },
        };
      }).reverse();
      setFootprintHistory(entries);
      if (entries.length > 0) {
        setFootprintResult({
          totalKgCo2PerYear: entries[entries.length - 1].totalKgCo2,
          breakdown: entries[entries.length - 1].breakdown,
          percentiles: { transport: 0, energy: 0, diet: 0, consumption: 0 },
          averageTotalKgCo2PerYear: 9000,
          lastCalculated: entries[entries.length - 1].date,
        });
      }
    });
    return () => unsub();
  }, [userId]);

  const saveFootprint = async (result: CarbonFootprintResult) => {
    if (!userId) return;
    try {
      const footprintRef = collection(db, 'users', userId, 'carbonFootprint');
      await addDoc(footprintRef, {
        ...result,
        lastCalculated: result.lastCalculated,
        calculatedAt: serverTimestamp(),
      });
      setFootprintResult(result);
    } catch (e) {
      console.error('Failed to save footprint:', e);
    }
  };

  if (!userId) {
    return (
      <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8">
        <Card className="mx-auto max-w-3xl p-8 text-center" role="region" aria-label="Sign in required">
          <Leaf className="mx-auto text-brand-400" size={30} aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Sign in to view your carbon footprint.</h1>
          <p className="mt-2 text-slate-200/80">Authentication is required to calculate and track your carbon footprint.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.href = '/auth'}>Go to sign-in</Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl" role="banner">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')} aria-label="Go back to dashboard">
              <ArrowLeft size={18} aria-hidden="true" />
              Back to Dashboard
            </Button>
            <div>
              <p className="text-xs tracking-[0.18em] text-brand-100">EcoLoop</p>
              <h1 className="text-3xl font-semibold text-white">Carbon Footprint</h1>
            </div>
          </div>
          {username && <p className="mt-1 text-sm text-brand-400 font-medium">Welcome, {username}</p>}
        </header>

        <section className="mt-8" aria-labelledby="calculator-heading">
          <h2 id="calculator-heading" className="sr-only">Carbon Footprint Calculator</h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Suspense fallback={<CalculatorFallback />}>
              <CarbonFootprintCalculatorLazy initialResult={footprintResult} onSave={saveFootprint} />
            </Suspense>
            <Suspense fallback={<ChartsFallback />}>
              <CarbonFootprintChartsLazy result={footprintResult} history={footprintHistory} />
            </Suspense>
          </div>
        </section>

        {userId && (
          <section className="mt-8" aria-labelledby="goals-heading">
            <h2 id="goals-heading" className="sr-only">Carbon Reduction Goals</h2>
            <Suspense fallback={<GoalsFallback />}>
              <CarbonFootprintGoalsLazy currentFootprint={footprintResult} userId={userId} />
            </Suspense>
          </section>
        )}

        <section className="mt-8" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="sr-only">How this works</h2>
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Understanding Your Carbon Footprint</CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid gap-4 text-sm text-slate-200 md:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <strong className="text-brand-400">1. Calculate</strong>
                <p className="mt-2">Enter your lifestyle data across transport, energy, diet, and consumption.</p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <strong className="text-brand-400">2. Visualize</strong>
                <p className="mt-2">See your footprint breakdown vs. average with interactive charts.</p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <strong className="text-brand-400">3. Reduce</strong>
                <p className="mt-2">Set reduction goals and track progress over time.</p>
              </article>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}