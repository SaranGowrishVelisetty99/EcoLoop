'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
  const progressAnnouncerRef = useRef<HTMLDivElement>(null);

  const announceProgress = (message: string) => {
    if (progressAnnouncerRef.current) {
      progressAnnouncerRef.current.textContent = message;
    }
  };

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
      announceProgress('Error: Please sign in before scanning.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress('Analyzing image with nvidia nim…');
    announceProgress('Analyzing image with NVIDIA NIM.');
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
        announceProgress('Analysis completed. Results saved automatically.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error.';
      setError(errorMessage);
      announceProgress(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(135deg,#03110d_0%,#071c17_45%,#020617_100%)] text-slate-100">
      <div ref={progressAnnouncerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl" role="banner">
          <Button variant="outline" className="mb-4" onClick={() => window.location.href = '/dashboard'} aria-label="Go back to dashboard">
            <span className="inline-flex items-center gap-2"><ArrowLeft size={16} aria-hidden="true" /> Back to dashboard</span>
          </Button>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-100">Scanner</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Capture a discarded item and generate an upcycling blueprint.</h1>
          <p className="mt-2 text-slate-200/85">The image is analyzed via NVIDIA NIM and results are saved to Firestore with your user ID and timestamp.</p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]" aria-labelledby="upload-heading">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle id="upload-heading">Upload photo</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleUpload}
                  aria-describedby="file-upload-hint"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-brand-400/40 bg-brand-500/8 px-4 py-14 text-center hover:bg-brand-500/12 transition-colors focus-within:ring-2 focus-within:ring-brand-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); }}}
                  aria-label="Drag and drop or click to select an image file"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-brand-400', 'bg-brand-500/20'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-brand-400', 'bg-brand-500/20'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-brand-400', 'bg-brand-500/20');
                    if (e.dataTransfer.files && e.dataTransfer.files[0] && inputRef.current) {
                      inputRef.current.files = e.dataTransfer.files;
                      handleUpload({ target: inputRef.current } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                >
                  <Camera className="text-brand-100" size={30} aria-hidden="true" />
                  <span className="mt-3 text-lg font-semibold text-white">Drag in a photo or choose a file</span>
                  <span id="file-upload-hint" className="mt-1 text-sm text-slate-300">PNG, JPG, WEBP up to the Firebase Storage limit.</span>
                </label>
              </div>
              <Button
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                aria-label={loading ? 'Upload in progress' : 'Open file picker to choose an image'}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} aria-hidden="true" />
                    Uploading…
                  </>
                ) : (
                  'Choose image'
                )}
              </Button>
              {error ? (
                <p
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              ) : null}
              <p
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                aria-live="polite"
                aria-atomic="true"
              >
                {progress || 'Choose an image to analyze it before saving any results.'}
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4"><CardTitle id="results-heading">Live analysis result</CardTitle></CardHeader>
            <CardContent className="p-0 space-y-4" aria-live="polite" aria-labelledby="results-heading">
              {scanResult ? (
                <>
                  <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-4" aria-labelledby="detected-object-heading">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 id="detected-object-heading" className="text-lg font-semibold text-white">{scanResult.detectedObject || 'Item analysis pending'}</h2>
                        <p className="text-sm text-slate-300">{scanResult.materialType || 'Material type pending'}</p>
                      </div>
                      <Badge aria-label={scanResult.confidenceScore ? `${Math.round(scanResult.confidenceScore * 100)}% confidence` : 'Processing'}>{scanResult.confidenceScore ? `${Math.round(scanResult.confidenceScore * 100)}% confidence` : 'Processing'}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-200/85">{scanResult.conditionAssessment || 'OpenRouter is evaluating item condition.'}</p>
                  </article>

                  <div className="space-y-3" role="list" aria-label="Upcycling suggestions">
                    {(scanResult.suggestions ?? []).map((suggestion, index) => (
                      <article key={suggestion.id || `${scanId || 'temp'}-sug-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-4" role="listitem">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">{suggestion.title || 'Upcycling blueprint'}</h3>
                          <Badge aria-label={suggestion.estimatedCo2SavedKg ? `${suggestion.estimatedCo2SavedKg.toFixed(1)} kg CO₂ saved` : 'Impact pending'}>{suggestion.estimatedCo2SavedKg ? `${suggestion.estimatedCo2SavedKg.toFixed(1)} kg CO₂` : 'Impact pending'}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-200/85">{suggestion.description || 'Blueprint description will appear once the model completes the evaluation.'}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-slate-200/85" aria-live="polite">
                  <Sparkles className="text-brand-400" size={20} aria-hidden="true" />
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
