import Link from 'next/link';
import { ArrowRight, Leaf, Recycle, ShieldCheck, type LucideIcon } from 'lucide-react';

export default function Home() {
  const impactCards: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Waste diverted', value: '26 items', icon: Recycle },
    { label: 'Verified projects', value: '9 active', icon: ShieldCheck },
    { label: 'Scan confidence', value: '92% avg', icon: Leaf },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(135deg,#04110d_0%,#071b17_45%,#020617_100%)] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-10 lg:px-10">
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-3 text-lg font-semibold tracking-[0.18em] text-brand-100 uppercase">EcoLoop</div>
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <Link href="/auth" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">Sign up or Sign in</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-slate-950 font-semibold hover:bg-brand-400">Open dashboard <ArrowRight size={16}/></Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-100">AI-powered upcycling • Firebase-native</div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-6xl">Turn discarded items into actionable, lower-carbon upcycling plans.</h1>
            <p className="max-w-xl text-lg text-slate-200/90">Upload a photo, let the multimodal engine classify material and condition, and generate ideas that can reduce landfill waste and carbon footprint.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/scan" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-semibold text-slate-950 hover:bg-brand-400">Start scanning</Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10">View projects</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Live analysis', 'OpenRouter multimodal evaluation with JSON output enforcement'],
                ['Firebase sync', 'Photos in Storage and scan records in Firestore'],
                ['Sustainability metrics', 'CO₂ savings and project progress tracking'],
              ].map(([title, copy]) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl">
                  <h2 className="text-sm uppercase tracking-[0.18em] text-brand-100">{title}</h2>
                  <p className="mt-3 text-sm text-slate-200/85">{copy}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between text-sm text-slate-200">
              <div>
                <p className="text-slate-400">Today’s impact</p>
                <h2 className="text-3xl font-semibold text-white">48 kg CO₂ saved</h2>
              </div>
              <Leaf className="text-brand-400" size={28} />
            </div>
            <div className="mt-6 space-y-4">
              {impactCards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="text-xl font-semibold text-white">{value}</p>
                  </div>
                  <Icon className="text-brand-400" size={22} aria-hidden="true" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
