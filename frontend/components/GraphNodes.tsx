'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';
import { NODE_CONFIG, NODE_COLORS } from '@/lib/constants';

export default function GraphNodes() {
  const nodes = useGraphStore((state) => state.nodes);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const colorArray = useMemo(() => {
    const colors = new Float32Array(nodes.length * 3);
    nodes.forEach((node, i) => {
      const color = tempColor.set(NODE_COLORS[node.type]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    return colors;
  }, [nodes, tempColor]);

  useFrame(() => {
    if (!meshRef.current) return;

    nodes.forEach((node, i) => {
      tempObject.position.set(node.position[0], node.position[1], node.position[2]);
      tempObject.scale.setScalar(NODE_CONFIG.size);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (nodes.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
      <sphereGeometry args={[1, NODE_CONFIG.segments, NODE_CONFIG.segments]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial
        vertexColors
        metalness={NODE_CONFIG.metalness}
        roughness={NODE_CONFIG.roughness}
        emissive="#ffffff"
        emissiveIntensity={NODE_CONFIG.emissiveIntensity}
      />
    </instancedMesh>
  );
}