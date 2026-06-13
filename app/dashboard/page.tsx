'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { Leaf, Recycle, Sparkles, TimerReset, FolderOpen, CheckCircle, Award, Trophy, User, Calculator, type LucideIcon } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanListItem } from '@/components/dashboard/ScanListItem';
import { ProjectListItem } from '@/components/dashboard/ProjectListItem';

interface ScanDoc {
  id: string;
  detectedObject?: string;
  materialType?: string;
  conditionAssessment?: string;
  confidenceScore?: number;
  createdAt?: { seconds?: number };
  imageUrl?: string;
  suggestions?: Array<{ id?: string; estimatedCo2SavedKg?: number; title?: string }>;
}

interface ProjectDoc {
  id: string;
  scanId: string;
  suggestionId?: string;
  status?: 'saved' | 'in_progress' | 'completed';
  updatedAt?: { seconds?: number };
  startedAt?: { seconds?: number };
  completedAt?: { seconds?: number } | null;
  suggestionTitle?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const scansQuery = query(collection(db, 'scans'), where('userId', '==', userId));
    const scanUnsub = onSnapshot(scansQuery, (snapshot) => {
      const nextScans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ScanDoc));
      setScans(nextScans);
    });

    const projectsQuery = query(collection(db, 'userProjects'), where('userId', '==', userId));
    const projectUnsub = onSnapshot(projectsQuery, (snapshot) => {
      const nextProjects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProjectDoc));
      setProjects(nextProjects);
    });

    const userRef = doc(db, 'users', userId);
    const userUnsub = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserPoints(data.points || 0);
        setUsername(data.username || data.uid?.slice(0, 8) || 'User');
      } else {
        setUserPoints(0);
        setUsername('User');
      }
    });

    return () => {
      scanUnsub();
      projectUnsub();
      userUnsub();
    };
  }, [userId]);

  const projectsWithTitles =   useMemo(() => {
    return projects.map((project) => {
      const scan = scans.find((s) => s.id === project.scanId);
      const suggestion = scan?.suggestions?.find((s) => s.id === project.suggestionId) ?? scan?.suggestions?.[0];
      return {
        ...project,
        suggestionTitle: suggestion?.title || `Project ${project.id.slice(0, 6)}`,
      };
    });
  }, [projects, scans]);

  const availableProjects = projectsWithTitles.filter((p) => p.status === 'saved');
  const activeProjects = projectsWithTitles.filter((p) => p.status === 'in_progress');
  const completedProjects = projectsWithTitles.filter((p) => p.status === 'completed');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/auth');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const deleteScan = async (scanId: string) => {
    if (!confirm('Delete this scan and all its related projects?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/scan/${scanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete scan');
      router.refresh();
    } catch (e) {
      console.error('Delete scan failed:', e);
      alert('Failed to delete scan');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/project/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      router.refresh();
    } catch (e) {
      console.error('Delete project failed:', e);
      alert('Failed to delete project');
    }
  };

  const totals = useMemo(() => {
    const itemsSaved = scans.length;
    const co2Saved = scans.reduce((sum, scan) => {
      const suggestionSavings = (scan.suggestions ?? []).reduce((acc, suggestion) => acc + (suggestion.estimatedCo2SavedKg ?? 0), 0);
      return sum + suggestionSavings;
    }, 0);
    const availableProjects = projects.filter((project) => project.status === 'saved').length;
    const activeProjects = projects.filter((project) => project.status === 'in_progress').length;
    const completedProjects = projects.filter((project) => project.status === 'completed').length;
    return { itemsSaved, co2Saved, availableProjects, activeProjects, completedProjects, points: userPoints };
  }, [projects, scans, userPoints]);

  if (!userId) {
    return (
      <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100 p-8">
        <Card className="mx-auto max-w-3xl p-8 text-center" role="region" aria-label="Sign in required">
          <Leaf className="mx-auto text-brand-400" size={30} aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold text-white">Sign in to view your upcycling dashboard.</h1>
          <p className="mt-2 text-slate-200/80">Authentication is required to load your scans, project progress, and sustainability metrics.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.href = '/auth'}>Go to sign-in</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/scan'}>Open scanner</Button>
          </div>
        </Card>
      </main>
    );
  }

  const summaryCards: Array<{ label: string; value: string | number; icon: LucideIcon }> = [
    { label: 'Items saved', value: totals.itemsSaved, icon: Recycle },
    { label: 'CO₂ reduced (kg)', value: totals.co2Saved.toFixed(1), icon: Leaf },
    { label: 'Available projects', value: totals.availableProjects, icon: FolderOpen },
    { label: 'Active projects', value: totals.activeProjects, icon: Sparkles },
    { label: 'Completed projects', value: totals.completedProjects, icon: CheckCircle },
    { label: 'Points earned', value: totals.points, icon: Award },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl" role="banner">
          <div>
            <p className="text-xs tracking-[0.18em] text-brand-100">EcoLoop dashboard</p>
            {username && <p className="mt-1 text-sm text-brand-400 font-medium">Welcome, {username}</p>}
            <h1 className="text-3xl font-semibold text-white">Track scans, projects, and carbon mitigation.</h1>
          </div>
          <nav aria-label="Dashboard navigation" className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/scan')}>New scan</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/carbon')}>
              <Calculator className="mr-2" size={16} aria-hidden="true" />Carbon Footprint
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/leaderboard')}>
              <Trophy className="mr-2" size={16} aria-hidden="true" />Leaderboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/account')}>
              <User className="mr-2" size={16} aria-hidden="true" />Account
            </Button>
            <Button onClick={handleSignOut}>Sign out</Button>
          </nav>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">Summary statistics</h2>
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <CardHeader className="p-0 pb-3">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-sm uppercase tracking-[0.18em]">{label}</span>
                  <Icon className="text-brand-400" size={18} aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-3xl font-semibold text-white" aria-label={`${label}: ${value}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]" aria-labelledby="projects-heading">
          <h2 id="projects-heading" className="sr-only">Project sections</h2>
            <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Recent scan history</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              {scans.length ? scans.slice(0, 6).map((scan) => (
                <ScanListItem key={scan.id} scan={scan} onDelete={deleteScan} />
              )) : <p className="text-slate-300">No scan records yet. Start a scan to generate your first upcycling blueprint.</p>}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Available Projects</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              {availableProjects.length ? availableProjects.map((project) => (
                <ProjectListItem key={project.id} project={project} status="saved" onDelete={deleteProject} />
              )) : <p className="text-slate-300">No available projects.</p>}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Active Projects</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              {activeProjects.length ? activeProjects.map((project) => (
                <ProjectListItem key={project.id} project={project} status="in_progress" onDelete={deleteProject} />
              )) : <p className="text-slate-300">No active projects.</p>}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Completed Projects</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              {completedProjects.length ? completedProjects.map((project) => (
                <ProjectListItem key={project.id} project={project} status="completed" onDelete={deleteProject} />
              )) : <p className="text-slate-300">No completed projects yet.</p>}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="sr-only">How this works</h2>
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle>How this works</CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid gap-4 text-sm text-slate-200 md:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">1. Capture an image, upload it to Firebase Storage, and queue the analysis.</article>
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">2. OpenRouter returns a structured JSON blueprint with repair steps and expected CO₂ savings.</article>
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">3. Save projects in Firestore and monitor progress from one clean dashboard.</article>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
