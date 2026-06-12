'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScanDoc, ProjectDoc } from '@/types';

export function useUserScans(userId: string | null) {
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setScans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const scansQuery = query(collection(db, 'scans'), where('userId', '==', userId));
    const unsub = onSnapshot(scansQuery, {
      next: (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ScanDoc));
        setScans(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [userId]);

  return { scans, loading, error };
}

export function useUserProjects(userId: string | null) {
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const projectsQuery = query(collection(db, 'userProjects'), where('userId', '==', userId));
    const unsub = onSnapshot(projectsQuery, {
      next: (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProjectDoc));
        setProjects(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [userId]);

  return { projects, loading, error };
}

export function useUserPoints(userId: string | null) {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setPoints(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          setPoints(snapshot.data().points || 0);
        } else {
          setPoints(0);
        }
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [userId]);

  return { points, loading, error };
}