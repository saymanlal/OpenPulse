'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

export default function GraphNodes() {
  const nodes = useGraphStore((s) => s.nodes);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);

  const groupRef = useRef<THREE.Group>(null);

  const silverMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c0c0c0',
    metalness: 0.85,
    roughness: 0.25,
    emissive: '#111111',
    emissiveIntensity: 0.05
  }), []);

  const silverHoverMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0e0e0',
    metalness: 0.9,
    roughness: 0.2,
    emissive: '#222222',
    emissiveIntensity: 0.1
  }), []);

  const silverSelectedMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f5f5f5',
    metalness: 0.95,
    roughness: 0.15,
    emissive: '#ffd700',
    emissiveIntensity: 0.2
  }), []);

  const getMaterialForNode = (nodeId: string, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) return silverSelectedMaterial;
    if (isHovered) return silverHoverMaterial;
    return silverMaterial;
  };

  if (nodes.length === 0) return null;

  return (
    <group ref={groupRef}>
      {nodes.filter((node) => node.position !== undefined).map((node) => {
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const material = getMaterialForNode(node.id, isHovered, isSelected);
        const baseScale = NODE_CONFIG.baseSize * (node.size ?? 1);
        const scale = baseScale * (isSelected ? 1.2 : isHovered ? 1.1 : 1);
        const pos = node.position!;

        return (
          <mesh
            key={node.id}
            position={[pos[0], pos[1], pos[2]]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNode(node.id === selectedNodeId ? null : node.id);
            }}
            onPointerOver={() => setHoveredNode(node.id)}
            onPointerOut={() => setHoveredNode(null)}
          >
            <sphereGeometry args={[scale, NODE_CONFIG.segments, NODE_CONFIG.segments]} />
            <primitive object={material} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}