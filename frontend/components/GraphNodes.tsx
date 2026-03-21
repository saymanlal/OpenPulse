'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { NODE_COLORS, NODE_EMISSIVE, NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';
import type { NodeType } from '@/types/graph';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export default function GraphNodes() {
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nodeLookupRef = useRef(nodes);
  const activeStateRef = useRef({ selectedNodeId, hoveredNodeId });

  useEffect(() => { nodeLookupRef.current = nodes; }, [nodes]);
  useEffect(() => { activeStateRef.current = { selectedNodeId, hoveredNodeId }; }, [hoveredNodeId, selectedNodeId]);

  const baseScales = useMemo(
    () => nodes.map((node) => NODE_CONFIG.baseSize * (node.size ?? 1)),
    [nodes],
  );

  // Set initial positions + per-type colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    nodes.forEach((node, i) => {
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(baseScales[i]);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const hex = NODE_COLORS[node.type as NodeType] ?? '#6b7280';
      mesh.setColorAt(i, tempColor.set(hex));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [baseScales, nodes]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.getElapsedTime();
    const { selectedNodeId: selId, hoveredNodeId: hovId } = activeStateRef.current;

    nodeLookupRef.current.forEach((node, i) => {
      const isSelected = node.id === selId;
      const isHovered = node.id === hovId;

      const pulse = isSelected ? 1 + Math.sin(elapsed * 3.5) * 0.08 : 1;
      const scale =
        baseScales[i] *
        (isSelected ? NODE_CONFIG.selectedScale : isHovered ? NODE_CONFIG.hoverScale : 1) *
        pulse;

      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // Color: bright white when selected, lighter when hovered, type color otherwise
      const hex = isSelected
        ? '#ffffff'
        : isHovered
          ? lighten(NODE_COLORS[node.type as NodeType] ?? '#6b7280')
          : (NODE_COLORS[node.type as NodeType] ?? '#6b7280');

      mesh.setColorAt(i, tempColor.set(hex));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const getNode = (e: ThreeEvent<MouseEvent | PointerEvent>) => {
    const id = e.instanceId;
    return id !== undefined ? nodeLookupRef.current[id] ?? null : null;
  };

  if (nodes.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onClick={(e) => {
        e.stopPropagation();
        const node = getNode(e);
        if (!node) return;
        setSelectedNode(node.id === selectedNodeId ? null : node.id);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        const node = getNode(e);
        if (!node) return;
        setHoveredNode(node.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, NODE_CONFIG.segments, NODE_CONFIG.segments]} />
      <meshStandardMaterial
        vertexColors
        metalness={NODE_CONFIG.metalness}
        roughness={NODE_CONFIG.roughness}
        emissive="#ffffff"
        emissiveIntensity={NODE_CONFIG.emissiveIntensity}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// Lighten a hex color by blending toward white
function lighten(hex: string, amount = 0.4): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return `#${c.getHexString()}`;
}