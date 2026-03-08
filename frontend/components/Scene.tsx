'use client';

import { SCENE_CONFIG } from '@/lib/constants';
import CameraController from './CameraController';

export default function Scene() {
  return (
    <>
      <CameraController />

      <color attach="background" args={[SCENE_CONFIG.background]} />

      <ambientLight 
        intensity={SCENE_CONFIG.lighting.ambient.intensity} 
        color={SCENE_CONFIG.lighting.ambient.color}
      />
      
      <directionalLight
        intensity={SCENE_CONFIG.lighting.directional.intensity}
        color={SCENE_CONFIG.lighting.directional.color}
        position={SCENE_CONFIG.lighting.directional.position}
        castShadow
      />
      
      <pointLight
        intensity={SCENE_CONFIG.lighting.point.intensity}
        color={SCENE_CONFIG.lighting.point.color}
        position={SCENE_CONFIG.lighting.point.position}
      />

      <gridHelper
        args={[
          SCENE_CONFIG.grid.size,
          SCENE_CONFIG.grid.divisions,
          SCENE_CONFIG.grid.colorCenterLine,
          SCENE_CONFIG.grid.colorGrid,
        ]}
      />

      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </>
  );
}