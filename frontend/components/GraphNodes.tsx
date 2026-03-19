'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { NODE_COLORS, NODE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

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

  useEffect(() => {
    nodeLookupRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    activeStateRef.current = { selectedNodeId, hoveredNodeId };
  }, [hoveredNodeId, selectedNodeId]);

  const baseScales = useMemo(() => nodes.map((node) => NODE_CONFIG.baseSize * (node.size ?? 1)), [nodes]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    nodes.forEach((node, index) => {
      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(baseScales[index]);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
      mesh.setColorAt(index, tempColor.set(NODE_COLORS[node.type]));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [baseScales, nodes]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();
    const activeState = activeStateRef.current;

    nodeLookupRef.current.forEach((node, index) => {
      const baseScale = baseScales[index];
      const isSelected = node.id === activeState.selectedNodeId;
      const isHovered = node.id === activeState.hoveredNodeId;
      const pulse = isSelected ? 1 + Math.sin(elapsed * 3.5) * 0.06 : isHovered ? 1.08 : 1;
      const scale = baseScale * (isSelected ? NODE_CONFIG.selectedScale : isHovered ? NODE_CONFIG.hoverScale : 1) * pulse;

      tempObject.position.set(...node.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  const getNodeFromEvent = (event: ThreeEvent<MouseEvent | PointerEvent>) => {
    const instanceId = event.instanceId;
    if (instanceId === undefined) {
      return null;
    }
    return nodeLookupRef.current[instanceId] ?? null;
  };

  if (nodes.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onClick={(event) => {
        event.stopPropagation();
        const node = getNodeFromEvent(event);
        if (!node) {
          return;
        }
        setSelectedNode(node.id === selectedNodeId ? null : node.id);
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        const node = getNodeFromEvent(event);
        if (!node) {
          return;
        }
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
        emissive="#08111f"
        emissiveIntensity={NODE_CONFIG.emissiveIntensity}
      />
    </instancedMesh>
  );
}
