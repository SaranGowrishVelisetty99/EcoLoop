'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Target, Flag, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CarbonFootprintGoal, CarbonFootprintResult } from '@/types';
import { auth } from '@/lib/firebase';

interface CarbonFootprintGoalsProps {
  currentFootprint?: CarbonFootprintResult | null;
  userId: string;
}

export function CarbonFootprintGoals({ currentFootprint, userId }: CarbonFootprintGoalsProps) {
  const [goals, setGoals] = useState<CarbonFootprintGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ targetReductionPercentage: 20, targetMonths: 12 });
  const [announcement, setAnnouncement] = useState<string>('');
  const [idToken, setIdToken] = useState<string | null>(null);

  // Listen for auth state changes to get fresh ID token
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsub();
  }, []);

  const getAuthHeaders = (): HeadersInit => {
    if (!idToken) {
      console.warn('[CarbonGoals] No ID token available');
      return {};
    }
    console.log('[CarbonGoals] Got ID token, length:', idToken.length);
    return { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (!userId || !idToken) return;
    
    const loadGoals = async () => {
      try {
        const headers = getAuthHeaders();
        console.log('[CarbonGoals] Headers:', Object.keys(headers));
        const res = await fetch(`/api/carbon-goals?_t=${Date.now()}`, {
          cache: 'no-store',
          headers,
        });
        console.log('[CarbonGoals] Response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('[CarbonGoals] API response:', data);
          setGoals(data.goals || []);
        } else {
          console.error('[CarbonGoals] API error:', res.status);
          const errorText = await res.text();
          console.error('[CarbonGoals] Error response:', errorText);
          setGoals([]);
        }
      } catch (e) {
        console.error('Failed to load goals:', e);
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadGoals();
  }, [userId, idToken]);

  const handleCreateGoal = async () => {
    if (!currentFootprint) {
      alert('Please calculate your carbon footprint first before creating a goal.');
      return;
    }
    if (!idToken) {
      alert('Authentication token not available. Please refresh the page.');
      return;
    }
    try {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + newGoal.targetMonths);
      
      const headers: HeadersInit = { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' };
      const res = await fetch('/api/carbon-goals', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({
          targetReductionPercentage: newGoal.targetReductionPercentage,
          targetDate: targetDate.toISOString(),
          baselineTotalKgCo2: currentFootprint.totalKgCo2PerYear,
        }),
      });
      console.log('[CarbonGoals] Create response status:', res.status);
      const data = await res.json();
      console.log('[CarbonGoals] Create response data:', data);
      if (res.ok) {
        setGoals(prev => [...prev, data.goal]);
        setShowForm(false);
        setNewGoal({ targetReductionPercentage: 20, targetMonths: 12 });
        setAnnouncement(`Goal created: ${newGoal.targetReductionPercentage}% reduction target over ${newGoal.targetMonths} months`);
      } else {
        console.error('Create goal failed:', data);
        alert(data.error || 'Failed to create goal');
      }
    } catch (e) {
      console.error('Failed to create goal:', e);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goalToDelete = goals.find(g => g.id === goalId);
    if (!idToken) {
      alert('Authentication token not available. Please refresh the page.');
      return;
    }
    try {
      const headers: HeadersInit = { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' };
      const res = await fetch(`/api/carbon-goals/${goalId}`, { 
        method: 'DELETE',
        cache: 'no-store',
        headers,
      });
      console.log('[CarbonGoals] Delete response status:', res.status);
      const data = await res.json();
      console.log('[CarbonGoals] Delete response data:', data);
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
        if (goalToDelete) {
          setAnnouncement(`Goal deleted: ${goalToDelete.targetReductionPercentage ?? 0}% reduction target`);
        }
      } else {
        console.error('Delete goal failed:', data);
        alert(data.error || 'Failed to delete goal');
      }
    } catch (e) {
      console.error('Failed to delete goal:', e);
    }
  };

  const getGoalProgress = (goal: { baselineTotalKgCo2: number; targetReductionPercentage: number }) => {
    if (!currentFootprint) return 0;
    const reduction = goal.baselineTotalKgCo2 - currentFootprint.totalKgCo2PerYear;
    const targetReduction = goal.baselineTotalKgCo2 * (goal.targetReductionPercentage / 100);
    return Math.min(100, Math.max(0, (reduction / targetReduction) * 100));
  };

  const getGoalStatus = (goal: { baselineTotalKgCo2: number; targetReductionPercentage: number; targetDate: string | Date }) => {
    const progress = getGoalProgress(goal);
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const isExpired = now > targetDate;
    
    if (progress >= 100) return { label: 'Achieved', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' };
    if (isExpired) return { label: 'Expired', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' };
    return { label: 'In Progress', icon: Clock, color: 'text-brand-400', bg: 'bg-brand-500/20 border-brand-500/30' };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 pb-4"><CardTitle>Carbon Reduction Goals</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-20 bg-white/5 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">{announcement}</div>
      <CardHeader className="p-0 pb-4 flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <Target className="text-brand-400" size={24} />
          Reduction Goals
        </CardTitle>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Flag className="mr-2" size={16} /> Add Goal
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateGoal(); }} className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="targetReduction" className="text-sm text-slate-300">Target Reduction (%)</label>
                <Input
                  id="targetReduction"
                  type="number"
                  min="5"
                  max="50"
                  value={newGoal.targetReductionPercentage}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetReductionPercentage: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-900/50 border-white/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="targetMonths" className="text-sm text-slate-300">Timeframe (months)</label>
                <Input
                  id="targetMonths"
                  type="number"
                  min="3"
                  max="36"
                  value={newGoal.targetMonths}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetMonths: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-900/50 border-white/10"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Create Goal</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {goals.length === 0 && !showForm && (
          <div className="text-center py-8 text-slate-400">
            <Target className="mx-auto text-slate-600" size={48} />
            <p className="mt-4 text-lg">No reduction goals yet</p>
            <p className="mt-2 text-sm">Set a target to track your progress toward a lower carbon footprint</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
              <Flag className="mr-2" size={16} /> Set Your First Goal
            </Button>
          </div>
        )}

        {goals.map((goal: CarbonFootprintGoal) => {
          const baseline = goal.baselineTotalKgCo2 ?? goal.baselineTotalKgCO2 ?? goal.baseline ?? 0;
          const targetReductionPct = goal.targetReductionPercentage ?? goal.targetReduction ?? 0;
          const progress = getGoalProgress({ ...goal, baselineTotalKgCo2: baseline, targetReductionPercentage: targetReductionPct });
          const status = getGoalStatus({ ...goal, baselineTotalKgCo2: baseline, targetReductionPercentage: targetReductionPct });
          const StatusIcon = status.icon;
          const targetDate = new Date(goal.targetDate);
          const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={goal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-white">{targetReductionPct}% reduction target</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                      <StatusIcon className="inline mr-1" size={10} aria-hidden="true" /> {status.label}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Goal progress: ${progress.toFixed(0)}% complete`}>
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {progress.toFixed(0)}% complete · {daysLeft > 0 ? `${daysLeft} days left` : 'Target date passed'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteGoal(goal.id)} aria-label={`Delete goal: ${targetReductionPct}% reduction target`}>
                  <X size={16} aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3 text-sm text-slate-400">
                <div>Baseline: {baseline.toLocaleString()} kg CO₂</div>
                <div>Target: {Math.round(baseline * (1 - targetReductionPct / 100)).toLocaleString()} kg CO₂</div>
                <div>Due: {targetDate.toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}