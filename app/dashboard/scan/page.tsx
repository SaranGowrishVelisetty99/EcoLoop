'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft, Camera, Loader2, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScanResult {
  detectedObject?: string;
  materialType?: string;
  conditionAssessment?: string;
  confidenceScore?: number;
  suggestions?: Array<{ id?: string; title?: string; description?: string; estimatedCo2SavedKg?: number }>;
}

export default function ScanPage() {
  const [user, setUser] = useState<null | { uid: string }>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => setUser(currentUser ? { uid: currentUser.uid } : null));
    return () => unsub();
  }, []);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(img.src);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Unable to process the selected image.'));
    });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) {
      setError('Please sign in before scanning.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress('Analyzing image with nvidia nim…');
    setScanResult(null);
    setScanId(null);

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageDataUrl, fileName: file.name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Scan analysis did not complete.');
      }

      const data = await response.json();
      const result = data.result;
      if (result) {
        setScanResult(result);
        if (data.scanId) setScanId(data.scanId);
        setProgress('Analysis completed. Results saved automatically.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
          </Button>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Scanner</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Capture a discarded item and generate an upcycling blueprint.</h1>
          <p className="mt-2 text-slate-200/85">The image is analyzed via NVIDIA NIM and results are saved to Firestore with your user ID and timestamp.</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Upload photo</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-brand-400/40 bg-brand-500/8 px-4 py-14 text-center hover:bg-brand-500/12">
                <Camera className="text-brand-100" size={30} />
                <span className="mt-3 text-lg font-semibold text-white">Drag in a photo or choose a file</span>
                <span className="mt-1 text-sm text-slate-300">PNG, JPG, WEBP up to the Firebase Storage limit.</span>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              <Button className="w-full" onClick={() => inputRef.current?.click()} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 animate-spin" size={16}/> Uploading…</> : 'Choose image'}
              </Button>
              {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}
              <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">{progress || 'Choose an image to analyze it before saving any results.'}</p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle>Live analysis result</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              {scanResult ? (
                <>
                  <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{scanResult.detectedObject || 'Item analysis pending'}</p>
                        <p className="text-sm text-slate-300">{scanResult.materialType || 'Material type pending'}</p>
                      </div>
                      <Badge>{scanResult.confidenceScore ? `${Math.round(scanResult.confidenceScore * 100)}% confidence` : 'Processing'}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-200/85">{scanResult.conditionAssessment || 'OpenRouter is evaluating item condition.'}</p>
                  </article>

                  <div className="space-y-3">
                    {(scanResult.suggestions ?? []).map((suggestion, index) => (
                      <article key={suggestion.id || `${scanId || 'temp'}-sug-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">{suggestion.title || 'Upcycling blueprint'}</h3>
                          <Badge>{suggestion.estimatedCo2SavedKg ? `${suggestion.estimatedCo2SavedKg.toFixed(1)} kg CO₂` : 'Impact pending'}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-200/85">{suggestion.description || 'Blueprint description will appear once the model completes the evaluation.'}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-slate-200/85">
                  <Sparkles className="text-brand-400" size={20} />
                  <p className="mt-3">No scan result yet. Upload an image to start the analysis and update this panel live.</p>
                </article>
              )}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
