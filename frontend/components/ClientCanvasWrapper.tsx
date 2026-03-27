'use client';

import dynamic from 'next/dynamic';

// Fully isolate Canvas3D from SSR
const Canvas3D = dynamic(() => import('./Canvas3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-sm text-slate-500">
      Loading 3D Engine...
    </div>
  ),
});

export default function ClientCanvasWrapper() {
  return <Canvas3D />;
}