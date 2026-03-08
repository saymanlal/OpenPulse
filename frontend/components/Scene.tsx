'use client';

import { useEffect, useState } from 'react';
import { SCENE_CONFIG } from '@/lib/constants';
import { generateSampleGraph } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';
import { useForceSimulation } from '@/hooks/useForceSimulation';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';

export default function Scene() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const [simulationEnabled, setSimulationEnabled] = useState(true);

  useEffect(() => {
    const sampleData = generateSampleGraph(20);
    setGraphData(sampleData);
    const timer = setTimeout(() => {
      setSimulationEnabled(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [setGraphData]);

  useForceSimulation({
    nodes,
    edges,
    enabled: simulationEnabled,
    onUpdate: (updatedNodes) => {
      setGraphData({ nodes: updatedNodes, edges });
    },
  });

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

      <GraphEdges />
      <GraphNodes />
    </>
  );
}