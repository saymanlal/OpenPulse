'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

const WHITE = '#ffffff';
const HOVER = '#f0f9ff';
const GOLD = '#fbbf24';

export default function GraphNodes() {
  const nodes = useGraphStore((s) => s.nodes);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setHoveredNode = useGraphStore((s) => s.setHoveredNode);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nodeLookupRef = useRef(nodes);
  const activeStateRef = useRef({ selectedNodeId, hoveredNodeId });

  useEffect(() => {
    nodeLookupRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    activeStateRef.current = { selectedNodeId, hoveredNodeId };
  }, [selectedNodeId, hoveredNodeId]);

  const baseScales = useMemo(
    () => nodes.map((n) => NODE_CONFIG.baseSize * (n.size ?? 1)),
    [nodes],
  );

  // Initialize nodes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    nodes.forEach((node, i) => {
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(baseScales[i]);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, tempColor.set(WHITE));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes, baseScales]);

  // Animation loop
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.getElapsedTime();
    const { selectedNodeId: selId, hoveredNodeId: hovId } =
      activeStateRef.current;

    nodeLookupRef.current.forEach((node, i) => {
      const selected = node.id === selId;
      const hovered = !selected && node.id === hovId;

      const pulse = selected
        ? 1 + Math.sin(elapsed * 3.5) * 0.15
        : 1;

      const scale =
        baseScales[i] *
        (selected
          ? NODE_CONFIG.selectedScale
          : hovered
          ? NODE_CONFIG.hoverScale
          : 1) *
        pulse;

      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);

      const color = selected ? GOLD : hovered ? HOVER : WHITE;
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
      frustumCulled={false}
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
    >
      <sphereGeometry
        args={[1, NODE_CONFIG.segments, NODE_CONFIG.segments]}
      />

      {/* PERFECT MATERIAL FOR GRAPH VISUALIZATION */}
      <meshPhongMaterial
        vertexColors
        shininess={80}
      />
    </instancedMesh>
  );
}