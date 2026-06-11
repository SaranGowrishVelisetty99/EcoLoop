'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Leaf, TimerReset } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectDoc {
  id: string;
  scanId?: string;
  suggestionId?: string;
  status?: 'saved' | 'in_progress' | 'completed';
  updatedAt?: { seconds?: number };
  startedAt?: { seconds?: number };
  completedAt?: { seconds?: number } | null;
  pointsAwarded?: boolean;
  pointsAwardedAt?: { seconds?: number };
}

interface ScanDoc {
  id: string;
  suggestions?: Array<{
    id?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    estimatedTimeMinutes?: number;
    estimatedCo2SavedKg?: number;
    steps?: string[];
  }>;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [user, setUser] = useState<{ uid: string; email?: string } | null>(null);
  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [scan, setScan] = useState<ScanDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => setUser(currentUser ? { uid: currentUser.uid, email: currentUser.email } : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const projectRef = doc(db, 'userProjects', projectId);
    const unsubProject = onSnapshot(projectRef, (snapshot) => {
      if (!snapshot.exists()) return;
      setProject({ id: snapshot.id, ...snapshot.data() });
    });
    return () => unsubProject();
  }, [projectId]);

  useEffect(() => {
    if (!project?.scanId) return;
    const scanRef = doc(db, 'scans', project.scanId);
    const unsubScan = onSnapshot(scanRef, (snapshot) => {
      if (snapshot.exists()) setScan({ id: snapshot.id, ...snapshot.data() });
      setLoading(false);
    });
    return () => unsubScan();
  }, [project]);

  const suggestion = useMemo(() => {
    if (!scan?.suggestions) return null;
    return scan.suggestions.find((item) => item.id === project?.suggestionId) ?? scan.suggestions[0] ?? null;
  }, [project, scan]);

  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const allStepsCompleted = suggestion?.steps?.every((_, index) => completedSteps[index]) ?? false;

  const handleStepChange = (index: number, checked: boolean) => {
    setCompletedSteps(prev => ({ ...prev, [index]: checked }));
  };

  async function updateStatus(nextStatus: 'in_progress' | 'completed') {
    if (!projectId || !user) return;
    const wasCompleted = project?.status === 'completed';
    await updateDoc(doc(db, 'userProjects', projectId), {
      status: nextStatus,
      startedAt: nextStatus === 'in_progress' ? (project?.startedAt ?? serverTimestamp()) : project?.startedAt,
      completedAt: nextStatus === 'completed' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    if (nextStatus === 'completed' && !wasCompleted) {
      try {
        const token = await getIdToken(auth.currentUser!);
        await fetch('/api/award-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ projectId, points: 50 }),
        });
      } catch (e) {
        console.error('Failed to award points:', e);
      }
    }

    router.refresh();
  }

  if (!user) {
    return <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8"><Card className="mx-auto max-w-2xl p-8">Sign in to open project details.</Card></main>;
  }

  if (loading || !project || !suggestion) {
    return <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8"><Card className="mx-auto max-w-2xl p-8">Loading blueprint…</Card></main>;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Blueprint details</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{suggestion.title || 'Upcycling blueprint'}</h1>
          <p className="mt-2 max-w-3xl text-slate-200/85">{suggestion.description}</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Checklist</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-3">
              {suggestion.steps?.map((step: string, index: number) => (
                <label key={`${suggestion.id}-${index}`} className="flex items-start gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-slate-100">
                  <input
                    type="checkbox"
                    checked={completedSteps[index] || false}
                    onChange={(e) => handleStepChange(index, e.target.checked)}
                    disabled={project.status !== 'in_progress'}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-500"
                  />
                  <span className="text-sm text-slate-100">{step}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Project snapshot</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4 text-sm text-slate-200">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Status</p>
                <p className="mt-1 text-xl font-semibold text-white">{project.status}</p>
                <Badge className="mt-3">{suggestion.difficulty}</Badge>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-brand-100"><TimerReset size={16} /><span>Estimated time</span></div>
                <p className="mt-2 text-xl font-semibold text-white">{suggestion.estimatedTimeMinutes} minutes</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-brand-100"><Leaf size={16} /><span>CO₂ impact</span></div>
                <p className="mt-2 text-xl font-semibold text-white">{suggestion.estimatedCo2SavedKg?.toFixed(1)} kg saved</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {project.status === 'saved' && (
                  <Button onClick={() => updateStatus('in_progress')}>Start project</Button>
                )}
                {project.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('completed')}
                    disabled={!allStepsCompleted}
                  >
                    {allStepsCompleted ? 'Mark as complete' : 'Complete all steps first'}
                  </Button>
                )}
                {project.status === 'completed' && (
                  <Button variant="outline" disabled>Completed</Button>
                )}
              </div>
              <Button variant="ghost" asChild className="w-full justify-start"><Link href="/dashboard">← Back to dashboard</Link></Button>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
