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
  const setGraphData = useGraphStore((s) => s.setGraphData);
  const setNodes     = useGraphStore((s) => s.setNodes);
  const { loadGraph } = useLoadGraphFromApi();
  const [initialized, setInitialized] = useState(false);
  const [isDemoMode,  setIsDemoMode]  = useState(false);
  const initRef = useRef(false);

  // One-time initialisation
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        await loadGraph();
        setIsDemoMode(false);
      } catch {
        const demo = getOrCreateDemoDataset();
        setGraphData(demo);
        setIsDemoMode(true);
      } finally {
        setInitialized(true);
      }
    })();
  }, [loadGraph, setGraphData]);

  // Evolution — runs ALWAYS every 3s (demo OR API data)
  useEffect(() => {
    if (!initialized) return;  // REMOVED isDemoMode check

    const id = window.setInterval(() => {
      const { nodes, edges } = useGraphStore.getState();
      const evolved = evolveDemoDataset({ nodes, edges });
      setNodes(evolved.nodes);
      
      // Only persist to localStorage in demo mode
      if (isDemoMode) {
        persistDemoDataset(evolved);
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [initialized, isDemoMode, setNodes]);  // Keep isDemoMode in deps for persist logic

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
