'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import Scene from './Scene';
import { SCENE_CONFIG } from '@/lib/constants';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-gray-400 text-sm">Loading 3D scene...</div>
    </div>
  );
}

export default function Canvas3D() {
  return (
    <div className="w-full h-full bg-black">
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
          dpr={[1, 2]}
          shadows
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}