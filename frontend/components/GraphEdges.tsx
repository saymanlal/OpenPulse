'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';
import { EDGE_CONFIG } from '@/lib/constants';

export default function GraphEdges() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const nodePositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();
    nodes.forEach((node) => {
      positions.set(
        node.id,
        new THREE.Vector3(node.position[0], node.position[1], node.position[2])
      );
    });
    return positions;
  }, [nodes]);

  const lineGeometries = useMemo(() => {
    return edges
      .map((edge) => {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);

        if (!sourcePos || !targetPos) return null;

        const points = [sourcePos, targetPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return { geometry, edge };
      })
      .filter((item): item is { geometry: THREE.BufferGeometry; edge: typeof edges[0] } => 
        item !== null
      );
  }, [edges, nodePositions]);

  if (lineGeometries.length === 0) return null;

  return (
    <group>
      {lineGeometries.map(({ geometry, edge }) => (
        <line key={edge.id} geometry={geometry}>
          <lineBasicMaterial
            color={EDGE_CONFIG.baseColor}
            opacity={EDGE_CONFIG.opacity}
            transparent
            linewidth={EDGE_CONFIG.lineWidth}
          />
        </line>
      ))}
    </group>
  );
}