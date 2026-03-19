'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { SCENE_CONFIG } from '@/lib/constants';
import { getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';

import CameraController from './CameraController';
import GraphEdges from './GraphEdges';
import GraphNodes from './GraphNodes';

export default function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useGraphStore((state) => state.nodes);
  const setGraphData = useGraphStore((state) => state.setGraphData);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2(SCENE_CONFIG.fog.color, SCENE_CONFIG.fog.density);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(() => {
    if (nodes.length > 0) {
      return;
    }
    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setGraphData(demo);
  }, [nodes.length, setGraphData]);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  return (
    <>
      <CameraController />
      <color attach="background" args={[SCENE_CONFIG.background]} />
      <ambientLight intensity={SCENE_CONFIG.lighting.ambient.intensity} color={SCENE_CONFIG.lighting.ambient.color} />
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
      <group ref={groupRef} onPointerMissed={() => setSelectedNode(null)}>
        <GraphEdges />
        <GraphNodes />
      </group>
    </>
  );
}
