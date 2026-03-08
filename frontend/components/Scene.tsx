'use client';

import { useEffect } from 'react';
import { SCENE_CONFIG } from '@/lib/constants';
import { generateSampleGraph } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';

export default function Scene() {
  const setGraphData = useGraphStore((state) => state.setGraphData);

  useEffect(() => {
    const sampleData = generateSampleGraph(20);
    setGraphData(sampleData);
  }, [setGraphData]);

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

      <GraphNodes />
    </>
  );
}