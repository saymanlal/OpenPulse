'use client';

import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SCENE_CONFIG } from '@/lib/constants';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export default function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera]}
      enableDamping={SCENE_CONFIG.controls.enableDamping}
      dampingFactor={SCENE_CONFIG.controls.dampingFactor}
      rotateSpeed={SCENE_CONFIG.controls.rotateSpeed}
      zoomSpeed={SCENE_CONFIG.controls.zoomSpeed}
      minDistance={SCENE_CONFIG.controls.minDistance}
      maxDistance={SCENE_CONFIG.controls.maxDistance}
      maxPolarAngle={SCENE_CONFIG.controls.maxPolarAngle}
      target={[0, 0, 0]}
    />
  );
}
