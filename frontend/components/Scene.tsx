'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../lib/constants';
import { evolveDemoDataset, getOrCreateDemoDataset, persistDemoDataset } from '../lib/sampleData';
import { useGraphStore } from '../stores/graphStore';
import { useLoadGraphFromApi } from '../hooks/useApiGraph';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';

export default function Scene() {
  const setGraphData = useGraphStore((s) => s.setGraphData);
  const setNodes = useGraphStore((s) => s.setNodes);
  const { loadGraph } = useLoadGraphFromApi();
  const [initialized, setInitialized] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const initRef = useRef(false);

  // One-time initialisation
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        await loadGraph();
        setIsDemoMode(false);
      } catch (error) {
        console.warn('API failed, loading demo dataset', error);
        const demo = getOrCreateDemoDataset();
        setGraphData(demo);
        setIsDemoMode(true);
      } finally {
        setInitialized(true);
      }
    })();
  }, [loadGraph, setGraphData]);

  // Evolution
  useEffect(() => {
    if (!initialized) return;

    const id = window.setInterval(() => {
      const { nodes, edges } = useGraphStore.getState();
      if (nodes.length > 0) {
        const evolved = evolveDemoDataset({ nodes, edges });
        setNodes(evolved.nodes);
        
        if (isDemoMode) {
          persistDemoDataset(evolved);
        }
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [initialized, isDemoMode, setNodes]);

  return (
    <>
      <CameraController />
      
      {/* Dark background */}
      <color attach="background" args={['#0a0a0a']} />
      
      {/* Basic lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, 5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      
      {/* AXIS HELPER - This will show red(X), green(Y), blue(Z) lines to help debug */}
      <axesHelper args={[8]} />
      
      {/* MAIN GRID - LARGE SIZE for wide coverage */}
      <gridHelper 
        args={[80, 80, '#ffffff', '#888888']} 
        position={[0, -0.5, 0]} 
      />
      
      {/* Secondary grid - even larger for reference */}
      <gridHelper 
        args={[120, 120, '#666666', '#333333']} 
        position={[0, -0.8, 0]} 
      />
      
      {/* Tertiary grid - for outer boundary reference */}
      <gridHelper 
        args={[160, 160, '#444444', '#222222']} 
        position={[0, -1, 0]} 
      />
      
      {/* Graph components */}
      <GraphEdges />
      <GraphNodes />
    </>
  );
}