'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

const tempObject = new THREE.Object3D();
const tempColor  = new THREE.Color();

// Shining white for all non-selected nodes
const WHITE_GLOW = '#ffffff';
// Golden glow for selected node
const GOLDEN_GLOW = '#fbbf24';
// Brighter white for hover
const HOVER_GLOW = '#f0f9ff';

export default function GraphNodes() {
  const nodes           = useGraphStore((s) => s.nodes);
  const selectedNodeId  = useGraphStore((s) => s.selectedNodeId);
  const hoveredNodeId   = useGraphStore((s) => s.hoveredNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setHoveredNode  = useGraphStore((s) => s.setHoveredNode);

  const meshRef        = useRef<THREE.InstancedMesh>(null);
  const nodeLookupRef  = useRef(nodes);
  const activeStateRef = useRef({ selectedNodeId, hoveredNodeId });

  useEffect(() => { nodeLookupRef.current = nodes; }, [nodes]);
  useEffect(() => {
    activeStateRef.current = { selectedNodeId, hoveredNodeId };
  }, [selectedNodeId, hoveredNodeId]);

  const baseScales = useMemo(
    () => nodes.map((n) => NODE_CONFIG.baseSize * (n.size ?? 1)),
    [nodes],
  );

  // Initialize positions + white color whenever nodes array changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    nodes.forEach((node, i) => {
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(baseScales[i]);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
      // All nodes start white
      mesh.setColorAt(i, tempColor.set(WHITE_GLOW));
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
      const isHovered  = !isSelected && node.id === hovId;

      // Pulse scale for selected node
      const pulse = isSelected ? 1 + Math.sin(elapsed * 3.5) * 0.12 : 1;
      const scale = baseScales[i]
        * (isSelected ? NODE_CONFIG.selectedScale : isHovered ? NODE_CONFIG.hoverScale : 1)
        * pulse;

      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // ONLY selected → golden. Hovered → bright white. All others → white.
      const color = isSelected
        ? GOLDEN_GLOW
        : isHovered
          ? HOVER_GLOW
          : WHITE_GLOW;

      mesh.setColorAt(i, tempColor.set(color));
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
        metalness={0.6}
        roughness={0.2}
        emissive="#ffffff"
        emissiveIntensity={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
