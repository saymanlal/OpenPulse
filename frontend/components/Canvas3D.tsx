'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { SCENE_CONFIG } from '../lib/constants';
import Scene from './Scene';

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black text-sm text-slate-500">
      Preparing 3D scene...
    </div>
  );
}

export default function Canvas3D() {
  return (
    <div className="h-full w-full bg-black">
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
}
