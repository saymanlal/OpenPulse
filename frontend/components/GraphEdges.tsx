'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

import { EDGE_CONFIG } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

export default function GraphEdges() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);

  const geometry = useMemo(() => {
    if (nodes.length === 0 || edges.length === 0) {
      return null;
    }

    const nodePositions = new Map(nodes.map((node) => [node.id, node.position]));
    const positions: number[] = [];
    const colors: number[] = [];
    const baseColor = new THREE.Color(EDGE_CONFIG.baseColor);
    const activeColor = new THREE.Color(EDGE_CONFIG.activeColor);

    edges.forEach((edge) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      if (!source || !target) {
        return;
      }

      positions.push(source[0], source[1], source[2], target[0], target[1], target[2]);
      const color =
        edge.source === selectedNodeId ||
        edge.target === selectedNodeId ||
        edge.source === hoveredNodeId ||
        edge.target === hoveredNodeId
          ? activeColor
          : baseColor;
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    });

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    nextGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return nextGeometry;
  }, [edges, hoveredNodeId, nodes, selectedNodeId]);

  if (!geometry) {
    return null;
  }

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial transparent opacity={EDGE_CONFIG.opacity} vertexColors />
    </lineSegments>
  );
}
