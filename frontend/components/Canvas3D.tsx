'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { SCENE_CONFIG } from '@/lib/constants';

// 🚨 Dynamically import Scene (prevents bundling issues)
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
});

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-500">
      Preparing 3D scene...
    </div>
  );
}

// 🚨 Simple error boundary (prevents full crash)
function ErrorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-red-400">
      Failed to load 3D scene.
    </div>
  );
}

export default function Canvas3D() {
  // 🚨 Hard browser guard (extra safety for Next 16)
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return (
      <div className="h-full w-full bg-slate-950">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{
              position: SCENE_CONFIG.camera.initialPosition,
              fov: SCENE_CONFIG.camera.fov,
              near: SCENE_CONFIG.camera.near,
              far: SCENE_CONFIG.camera.far,
            }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 1.5]}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>
    );
  } catch (err) {
    console.error('Canvas3D error:', err);
    return <ErrorFallback />;
  }
}