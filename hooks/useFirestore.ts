'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCollection<T extends DocumentData>(
  path: string,
  constraints: QueryConstraint[] = [],
  options: { 
    limit?: number; 
    pageSize?: number;
    fields?: string[]; // Field projection for select()
    debounceMs?: number; // Debounce time in milliseconds
  } = {},
  deps: unknown[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const unsubRef = useRef<() => void>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the query setup
    const debounceMs = options.debounceMs || 0;
    debounceTimerRef.current = setTimeout(() => {
      if (unsubRef.current) {
        unsubRef.current();
      }

      setLoading(true);
      setError(null);

      // Build query with optional limit
      // Note: Field projection (select) not available in this Firebase version
      // Field filtering will be done client-side if options.fields is provided
      const allConstraints = [...constraints];
      if (options.limit) {
        allConstraints.push(limit(options.limit));
      }
      const q = query(collection(db, path), ...allConstraints);
      
      const unsub = onSnapshot(q, 
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          } as unknown as T));
          
          // Update pagination state
          if (snapshot.docs.length > 0) {
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            // Check if there are more documents
            setHasMore(snapshot.docs.length === (options.limit || options.pageSize || 25));
          } else {
            setHasMore(false);
          }
          
          setData(docs);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );

      unsubRef.current = unsub;
    }, debounceMs);

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [path, JSON.stringify(constraints), JSON.stringify(options), JSON.stringify(deps)]);

  const refetch = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
    }
    setLoading(true);
    setHasMore(true);
    setLastDoc(null);
    
    const allConstraints = [...constraints];
    if (options.limit) {
      allConstraints.push(limit(options.limit));
    }
    const q = query(collection(db, path), ...allConstraints);
    const unsub = onSnapshot(q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as unknown as T));
        
        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === (options.limit || options.pageSize || 25));
        } else {
          setHasMore(false);
        }
        
        setData(docs);
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );
    unsubRef.current = unsub;
  }, [path, JSON.stringify(constraints), JSON.stringify(options)]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !lastDoc || loading) return;
    
    setLoading(true);
    
    const allConstraints = [...constraints, orderBy('__name__'), startAfter(lastDoc)];
    if (options.limit) {
      allConstraints.push(limit(options.limit));
    }
    // Note: select() not available in this Firebase version
    
    // Use getDocs for one-time fetch instead of onSnapshot for pagination
    const { getDocs, query: queryFn } = await import('firebase/firestore');
    const q = queryFn(collection(db, path), ...allConstraints);
    const snapshot = await getDocs(q);
    
    const newDocs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as unknown as T));
    
    if (snapshot.docs.length > 0) {
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === (options.limit || options.pageSize || 25));
    } else {
      setHasMore(false);
    }
    
    setData(prev => [...prev, ...newDocs]);
    setLoading(false);
  }, [path, JSON.stringify(constraints), JSON.stringify(options), lastDoc, hasMore, loading]);

  return { data, loading, error, refetch, loadMore, hasMore, lastDoc };
}

export function useDocument<T extends DocumentData>(
  path: string,
  docId: string | null,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubRef = useRef<() => void>(null);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
    }

    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, path, docId);
    
    const unsub = onSnapshot(docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [path, docId, JSON.stringify(deps)]);

  return { data, loading, error };
}