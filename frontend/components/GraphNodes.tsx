'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';
import { NODE_COLORS, NODE_CONFIG } from '@/lib/constants';

export default function GraphNodes() {
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    hoveredRef.current = hoveredNodeId;
  }, [hoveredNodeId]);

  const colorArray = useMemo(() => {
    const colors = new Float32Array(nodes.length * 3);

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const color = new THREE.Color(NODE_COLORS[node.type]);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return colors;
  }, [nodes]);

  const updateInstanceMatrices = () => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const isSelected = node.id === selectedRef.current;
      const isHovered = node.id === hoveredRef.current;

      const scale = isSelected
        ? NODE_CONFIG.size * 1.5
        : isHovered
          ? NODE_CONFIG.size * 1.3
          : NODE_CONFIG.size;

      tempObject.position.set(node.position[0], node.position[1], node.position[2]);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame(() => {
    updateInstanceMatrices();
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    const instanceId = event.instanceId;
    if (instanceId === undefined || instanceId >= nodes.length) return;

    const clickedNode = nodes[instanceId];
    setSelectedNode(clickedNode.id === selectedNodeId ? null : clickedNode.id);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    const instanceId = event.instanceId;
    if (instanceId === undefined || instanceId >= nodes.length) return;

    setHoveredNode(nodes[instanceId].id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredNode(null);
    document.body.style.cursor = 'default';
  };

  if (nodes.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, NODE_CONFIG.segments, NODE_CONFIG.segments]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshStandardMaterial
        vertexColors
        metalness={NODE_CONFIG.metalness}
        roughness={NODE_CONFIG.roughness}
        emissive="#101010"
        emissiveIntensity={NODE_CONFIG.emissiveIntensity}
      />
    </instancedMesh>
  );
}
