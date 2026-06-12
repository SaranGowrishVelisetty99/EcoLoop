'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
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
  const stepAnnouncerRef = useRef<HTMLDivElement>(null);

  const announceStep = (message: string) => {
    if (stepAnnouncerRef.current) {
      stepAnnouncerRef.current.textContent = message;
    }
  };

  const allStepsCompleted = suggestion?.steps?.every((_, index) => completedSteps[index]) ?? false;

  const handleStepChange = (index: number, checked: boolean) => {
    setCompletedSteps(prev => ({ ...prev, [index]: checked }));
    if (checked) {
      announceStep(`Step ${index + 1} completed: ${suggestion?.steps?.[index]}`);
    } else {
      announceStep(`Step ${index + 1} marked as incomplete: ${suggestion?.steps?.[index]}`);
    }
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
    return <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8"><Card className="mx-auto max-w-2xl p-8">Sign in to open project details.</Card></main>;
  }

  if (loading || !project || !suggestion) {
    return <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8"><Card className="mx-auto max-w-2xl p-8">Loading blueprint…</Card></main>;
  }

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <div ref={stepAnnouncerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10" role="main">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl" role="banner">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Blueprint details</p>
          <h1 className="mt-2 text-3xl font-semibold text-white" id="blueprint-title">{suggestion.title || 'Upcycling blueprint'}</h1>
          <p className="mt-2 max-w-3xl text-slate-200/85">{suggestion.description}</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="checklist-heading">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle id="checklist-heading">Checklist</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-3" role="list" aria-label="Project steps">
              {suggestion.steps?.map((step: string, index: number) => (
                <div key={`${suggestion.id}-${index}`} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-slate-100" role="listitem">
                  <label className="flex items-start gap-3 cursor-pointer w-full" htmlFor={`step-${index}`}>
                    <input
                      id={`step-${index}`}
                      type="checkbox"
                      checked={completedSteps[index] || false}
                      onChange={(e) => handleStepChange(index, e.target.checked)}
                      disabled={project.status !== 'in_progress'}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label={`Step ${index + 1}: ${step}`}
                      aria-describedby={`step-desc-${index}`}
                    />
                    <span id={`step-desc-${index}`} className="text-sm text-slate-100">{step}</span>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle id="snapshot-heading">Project snapshot</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4 text-sm text-slate-200" aria-labelledby="snapshot-heading">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Status</p>
                <p className="mt-1 text-xl font-semibold text-white" aria-live="polite">{project.status}</p>
                <Badge className="mt-3" aria-label={`Difficulty: ${suggestion.difficulty}`}>{suggestion.difficulty}</Badge>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-brand-100"><TimerReset size={16} aria-hidden="true" /><span>Estimated time</span></div>
                <p className="mt-2 text-xl font-semibold text-white">{suggestion.estimatedTimeMinutes} minutes</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center gap-2 text-brand-100"><Leaf size={16} aria-hidden="true" /><span>CO₂ impact</span></div>
                <p className="mt-2 text-xl font-semibold text-white">{suggestion.estimatedCo2SavedKg?.toFixed(1)} kg saved</p>
              </div>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Project actions">
                {project.status === 'saved' && (
                  <Button
                    onClick={() => updateStatus('in_progress')}
                    aria-label="Start this project"
                  >
                    Start project
                  </Button>
                )}
                {project.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus('completed')}
                    disabled={!allStepsCompleted}
                    aria-label={allStepsCompleted ? 'Mark project as complete' : 'Complete all steps first to finish project'}
                    aria-disabled={!allStepsCompleted}
                  >
                    {allStepsCompleted ? 'Mark as complete' : 'Complete all steps first'}
                  </Button>
                )}
                {project.status === 'completed' && (
                  <Button variant="outline" disabled aria-label="Project completed">Completed</Button>
                )}
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/dashboard')} aria-label="Go back to dashboard">
                ← Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
