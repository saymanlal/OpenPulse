'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '@/lib/constants';
import { evolveDemoDataset, getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';
import { useLoadGraphFromApi } from '@/hooks/useApiGraph';
import CameraController from './CameraController';
import GraphNodes from './GraphNodes';
import GraphEdges from './GraphEdges';

// Custom animated star field component
const StarField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    const animate = () => {
      if (pointsRef.current) {
        pointsRef.current.rotation.y += 0.0005;
        pointsRef.current.rotation.x += 0.0003;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);
  
  const starPositions = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 2000;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500 - 200;
  }
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1500}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.5}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Floating particles component
const FloatingParticles = () => {
  const particlePositions = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 400;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 300 - 100;
  }
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#cbd5e1"
        size={0.15}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Pulsing light component
const PulsingLight = () => {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useEffect(() => {
    let frameId: number;
    const pulse = () => {
      if (lightRef.current) {
        const time = Date.now() * 0.002;
        const intensity = 0.5 + Math.sin(time) * 0.25;
        lightRef.current.intensity = intensity;
      }
      frameId = requestAnimationFrame(pulse);
    };
    pulse();
    return () => cancelAnimationFrame(frameId);
  }, []);
  
  return <pointLight ref={lightRef} color="#ffffff" intensity={0.6} position={[3, 4, 3]} />;
};

// Glowing ring component
const GlowingRing = ({ radius, color, opacity, yOffset }: { radius: number; color: string; opacity: number; yOffset: number }) => {
  return (
    <mesh position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.3, radius + 0.3, 64]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Helper ring for visual reference
const HelperRing = ({ radius, yOffset }: { radius: number; yOffset: number }) => {
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, yOffset, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.25} />
    </line>
  );
};

// Ground plane for shadow and reference
const GroundPlane = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <shadowMaterial transparent opacity={0.3} color="#000000" />
    </mesh>
  );
};

export default function Scene() {
  const setGraphData = useGraphStore((s) => s.setGraphData);
  const setNodes = useGraphStore((s) => s.setNodes);
  const { loadGraph } = useLoadGraphFromApi();
  const [initialized, setInitialized] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const initRef = useRef(false);
  
  const nodes = useGraphStore((s) => s.nodes);
  
  // Calculate approximate bounds to adjust grid size dynamically
  const maxNodeDistance = useRef(20);
  useEffect(() => {
    if (nodes.length > 0) {
      let maxDist = 0;
      nodes.forEach(node => {
        if (node.position) {
          const dist = Math.sqrt(
            node.position.x ** 2 + 
            node.position.z ** 2
          );
          maxDist = Math.max(maxDist, dist);
        }
      });
      maxNodeDistance.current = Math.max(25, maxDist * 1.5);
    }
  }, [nodes]);

  const gridSize = maxNodeDistance.current;
  const gridDivisions = Math.min(40, Math.floor(gridSize / 1.2));

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

  // Evolution — runs ALWAYS every 3s (demo OR API data)
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
      
      {/* Dark grey background */}
      <color attach="background" args={['#0a0a0a']} />
      
      {/* Light fog for depth */}
      <fogExp2 attach="fog" args={['#0a0a0a', 0.002]} />

      {/* Enhanced lighting */}
      <ambientLight intensity={0.5} color="#ffffff" />
      
      {/* Main directional light from above */}
      <directionalLight
        intensity={1.5}
        color="#ffffff"
        position={[10, 15, 8]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Fill light from below */}
      <directionalLight
        intensity={0.7}
        color="#94a3b8"
        position={[0, -8, 0]}
      />
      
      {/* Back rim light */}
      <directionalLight
        intensity={1.0}
        color="#ffffff"
        position={[-8, 6, -10]}
      />
      
      {/* Front fill light */}
      <directionalLight
        intensity={0.8}
        color="#cbd5e1"
        position={[5, 5, 12]}
      />
      
      {/* Side lights */}
      <pointLight intensity={0.8} color="#e2e8f0" position={[10, 5, 5]} />
      <pointLight intensity={0.7} color="#94a3b8" position={[-8, 4, 6]} />
      <pointLight intensity={0.7} color="#cbd5e1" position={[6, 3, -8]} />
      
      {/* Central glow */}
      <pointLight intensity={1.0} color="#ffffff" position={[0, 3, 0]} distance={40} decay={1.5} />
      
      {/* Animated pulsing light */}
      <PulsingLight />

      {/* Ground plane for shadows */}
      <GroundPlane />

      {/* MAIN GRID - Positioned at y=0 for visibility */}
      <gridHelper
        args={[gridSize * 2.2, gridDivisions, '#ffffff', '#6b7280']}
        position={[0, -1.5, 0]}
      />
      
      {/* Secondary grid with different color for depth */}
      <gridHelper
        args={[gridSize * 3, Math.floor(gridDivisions * 1.2), '#cbd5e1', '#4b5563']}
        position={[0, -1.8, 0]}
      />
      
      {/* Reference grid at node level */}
      <gridHelper
        args={[gridSize * 1.8, Math.floor(gridDivisions * 0.8), '#ffffff', '#9ca3af']}
        position={[0, -0.5, 0]}
      />

      {/* Ground reference rings */}
      <HelperRing radius={gridSize * 0.5} yOffset={-1.2} />
      <HelperRing radius={gridSize * 0.8} yOffset={-1.2} />
      <HelperRing radius={gridSize * 1.1} yOffset={-1.2} />
      <HelperRing radius={gridSize * 1.4} yOffset={-1.2} />
      <HelperRing radius={gridSize * 1.7} yOffset={-1.2} />

      {/* Decorative rings */}
      <GlowingRing radius={gridSize * 0.3} color="#ffffff" opacity={0.2} yOffset={-1.2} />
      <GlowingRing radius={gridSize * 0.6} color="#94a3b8" opacity={0.15} yOffset={-1.2} />
      <GlowingRing radius={gridSize * 0.9} color="#cbd5e1" opacity={0.12} yOffset={-1.2} />

      {/* Star field */}
      <StarField />
      
      {/* Floating particles */}
      <FloatingParticles />

      {/* Graph components */}
      <GraphEdges />
      <GraphNodes />
    </>
  );
}