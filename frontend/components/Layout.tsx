'use client';

import Canvas3D from './Canvas3D';
import Header from './Header';
import Inspector from './Inspector';

function ControlsPanel() {
  return (
    <aside className="flex h-full flex-col gap-4 border-r border-slate-900 bg-slate-950/92 p-4 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Controls</h2>
        <p className="mt-1 text-sm text-slate-400">Simple actions for the live demo experience.</p>
      </div>

      <div className="space-y-3 text-sm text-slate-300">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Camera</div>
          <p className="mt-2 text-slate-300">Drag to orbit, scroll to zoom, and click nodes to lock focus.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Graph</div>
          <p className="mt-2 text-slate-300">Repository nodes anchor the center while dependency clusters fan outward.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Fallback</div>
          <p className="mt-2 text-slate-300">If GitHub analysis fails, OpenPulse automatically renders a deterministic demo graph.</p>
        </div>
      </div>
    </aside>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        <ControlsPanel />
        <section className="relative min-h-[62vh] border-y border-slate-900 lg:border-y-0 lg:border-x">
          <Canvas3D />
        </section>
        <Inspector />
      </main>
    </div>
  );
}
