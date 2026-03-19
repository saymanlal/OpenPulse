'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { SCENE_CONFIG } from '@/lib/constants';
import { getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';

// 🚨 isolate sub-components too (prevents deep SSR leaks)
import dynamic from 'next/dynamic';

const CameraController = dynamic(() => import('./CameraController'), { ssr: false });
const GraphEdges = dynamic(() => import('./GraphEdges'), { ssr: false });
const GraphNodes = dynamic(() => import('./GraphNodes'), { ssr: false });

export default function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useGraphStore((state) => state.nodes);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);

  const { scene } = useThree();

  // 🚨 guard against unexpected execution context
  if (typeof window === 'undefined') return null;

  // ✅ Fog setup (safe)
  useEffect(() => {
    if (!scene) return;

    scene.fog = new THREE.FogExp2(
      SCENE_CONFIG.fog.color,
      SCENE_CONFIG.fog.density
    );

    return () => {
      if (scene) scene.fog = null;
    };
  }, [scene]);

  // ✅ Demo data init (safe)
  useEffect(() => {
    if (nodes && nodes.length > 0) return;

    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setGraphData(demo);
  }, [nodes, setGraphData]);

  // ✅ Animation loop (safe)
  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  return (
    <>
      <CameraController />

      {/* Background */}
      <color attach="background" args={[SCENE_CONFIG.background]} />

      {/* Lights */}
      <ambientLight
        intensity={SCENE_CONFIG.lighting.ambient.intensity}
        color={SCENE_CONFIG.lighting.ambient.color}
      />

      <directionalLight
        intensity={SCENE_CONFIG.lighting.directional.intensity}
        color={SCENE_CONFIG.lighting.directional.color}
        position={SCENE_CONFIG.lighting.directional.position}
      />

      <pointLight
        intensity={SCENE_CONFIG.lighting.point.intensity}
        color={SCENE_CONFIG.lighting.point.color}
        position={SCENE_CONFIG.lighting.point.position}
      />

      {/* Graph */}
      <group
        ref={groupRef}
        onPointerMissed={() => setSelectedNode(null)}
      >
        <GraphEdges />
        <GraphNodes />
      </group>
    </>
  );
}