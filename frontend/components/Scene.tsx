'use client';

import { useEffect, useState } from 'react';
import { SCENE_CONFIG } from '@/lib/constants';
import { generateSampleGraph } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';
import { useForceSimulation } from '@/hooks/useForceSimulation';
import { useLoadGraphFromApi } from '@/hooks/useApiGraph';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';

export default function Scene() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const { loadGraph } = useLoadGraphFromApi();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeGraph = async () => {
      if (initialized) return;
      
      try {
        // Try to load from API first
        await loadGraph();
        console.log('Graph loaded from API');
      } catch (err) {
        // If API fails, load demo data
        console.log('API not available, loading demo data');
        const sampleData = generateSampleGraph(20);
        setGraphData(sampleData);
      } finally {
        setInitialized(true);
      }
    };

    initializeGraph();
  }, [initialized, loadGraph, setGraphData]);

  useForceSimulation({
    nodes,
    edges,
    enabled: initialized,
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