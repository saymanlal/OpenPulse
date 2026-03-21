'use client';

import { useEffect, useRef, useState } from 'react';
import { SCENE_CONFIG } from '@/lib/constants';
import { evolveDemoDataset, getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';
import { useLoadGraphFromApi } from '@/hooks/useApiGraph';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';

export default function Scene() {
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const setNodes = useGraphStore((state) => state.setNodes);
  const { loadGraph } = useLoadGraphFromApi();
  const [initialized, setInitialized] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeGraph = async () => {
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
  }, [loadGraph, setGraphData]);

  // Evolution: update ONLY node positions, never touch selectedNodeId
  useEffect(() => {
    if (!initialized || !isDemoMode) return;

    const interval = window.setInterval(() => {
      const state = useGraphStore.getState();
      // No minimum node count - works for any number of nodes
      const evolved = evolveDemoDataset({
        nodes: state.nodes,
        edges: state.edges,
      });
      // Use setNodes instead of setGraphData so selectedNodeId is preserved
      setNodes(evolved.nodes);
      persistDemoDataset(evolved);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [initialized, isDemoMode, setNodes]);

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