'use client';

import Header from './Header';
import Inspector from './Inspector';
import ClientCanvasWrapper from './ClientCanvasWrapper';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main
        className="grid flex-1"
        style={{ marginTop: '57px', height: 'calc(100vh - 57px)', gridTemplateColumns: 'minmax(0,1fr) 340px' }}
      >
        <section className="relative">
          <ClientCanvasWrapper />
        </section>
        <Inspector />
      </main>
    </div>
  );
}