'use client';

import { useEffect, useState } from 'react';
import { SCENE_CONFIG } from '@/lib/constants';
import {
  evolveDemoDataset,
  getOrCreateDemoDataset,
  persistDemoDataset,
} from '@/lib/sampleData';
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const initializeGraph = async () => {
      if (initialized) return;

      try {
        await loadGraph();
        setIsDemoMode(false);
      } catch {
        const fallbackData = getOrCreateDemoDataset();
        setGraphData(fallbackData);
        setIsDemoMode(true);
      } finally {
        setInitialized(true);
      }
    };

    initializeGraph();
  }, [initialized, loadGraph, setGraphData]);

  useEffect(() => {
    if (!initialized || !isDemoMode) {
      return;
    }

    const interval = window.setInterval(() => {
      const current = useGraphStore.getState();
      if (current.nodes.length !== 200 || current.edges.length !== 400) {
        return;
      }

      const evolved = evolveDemoDataset({
        nodes: current.nodes,
        edges: current.edges,
      });

      current.setGraphData(evolved);
      persistDemoDataset(evolved);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [initialized, isDemoMode]);

  useForceSimulation(nodes, edges, initialized);

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
