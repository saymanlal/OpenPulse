'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

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
          camera={{ position: [0, 0, 10], fov: 75 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0a0a']} />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4f46e5" />
          </mesh>
        </Canvas>
      </Suspense>
    </div>
  );
}