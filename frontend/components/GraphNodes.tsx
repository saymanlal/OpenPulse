'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// 🎯 Colors
const SILVER_DEFAULT = new THREE.Color('#9CA3AF'); // darker metallic grey
const GOLD_HOVER = new THREE.Color('#FFD700');  // bright shiny silver

export default function GraphNodes() {
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nodeLookupRef = useRef(nodes);
  const activeStateRef = useRef({ selectedNodeId, hoveredNodeId });

  useEffect(() => {
    nodeLookupRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    activeStateRef.current = { selectedNodeId, hoveredNodeId };
  }, [hoveredNodeId, selectedNodeId]);

  const baseScales = useMemo(
    () => nodes.map((node) => NODE_CONFIG.baseSize * (node.size ?? 1)),
    [nodes]
  );

  // 🔹 Initial setup
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    nodes.forEach((node, index) => {
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(baseScales[index]);
      tempObject.updateMatrix();

      mesh.setMatrixAt(index, tempObject.matrix);

      // Default silver
      mesh.setColorAt(index, tempColor.copy(SILVER_DEFAULT));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [baseScales, nodes]);

  // 🔥 Animation loop
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.getElapsedTime();
    const activeState = activeStateRef.current;

    nodeLookupRef.current.forEach((node, index) => {
      const baseScale = baseScales[index];
      const isSelected = node.id === activeState.selectedNodeId;
      const isHovered = node.id === activeState.hoveredNodeId;

      const pulse = isSelected
        ? 1 + Math.sin(elapsed * 3.5) * 0.06
        : isHovered
          ? 1.1
          : 1;

      const scale =
        baseScale *
        (isSelected
          ? NODE_CONFIG.selectedScale
          : isHovered
            ? NODE_CONFIG.hoverScale
            : 1) *
        pulse;

      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);

      // 🎯 ONLY hovered/selected node becomes gold
      if (isHovered || isSelected) {
        mesh.setColorAt(index, tempColor.copy(GOLD_HOVER));
      } else {
        mesh.setColorAt(index, tempColor.copy(SILVER_DEFAULT));
      }
    });

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    // ✨ Glow boost (global emissive hack)
    const anyHovered = activeState.hoveredNodeId !== null;

    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.emissiveIntensity = anyHovered ? 1.5 : 0.2;
    }
  });

  const getNodeFromEvent = (
    event: ThreeEvent<MouseEvent | PointerEvent>
  ) => {
    const instanceId = event.instanceId;
    if (instanceId === undefined) return null;
    return nodeLookupRef.current[instanceId] ?? null;
  };

  if (nodes.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      frustumCulled={false}
      onClick={(event) => {
        event.stopPropagation();
        const node = getNodeFromEvent(event);
        if (!node) return;
        setSelectedNode(node.id === selectedNodeId ? null : node.id);
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        const node = getNodeFromEvent(event);
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

      {/* ✨ Material tuned for metallic + glow */}
      <meshStandardMaterial
        vertexColors
        metalness={0.9}   // high metallic = realistic silver
        roughness={0.25}  // low roughness = shiny surface
        emissive="#ffffff"
        emissiveIntensity={0.05} 
      />
    </instancedMesh>
  );
}