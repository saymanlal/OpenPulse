'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';
import { EDGE_CONFIG } from '@/lib/constants';

export default function GraphEdges() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);

  const nodePositionLookup = useMemo(() => {
    const lookup = new Map<string, [number, number, number]>();
    for (const node of nodes) {
      lookup.set(node.id, node.position);
    }
    return lookup;
  }, [nodes]);

  const edgeGeometry = useMemo(() => {
    if (edges.length === 0) return null;

    const positions = new Float32Array(edges.length * 6);
    const colors = new Float32Array(edges.length * 6);

    const baseColor = new THREE.Color(EDGE_CONFIG.baseColor);
    const selectedColor = new THREE.Color(EDGE_CONFIG.selectedColor);
    const hoveredColor = new THREE.Color(EDGE_CONFIG.hoveredColor);

    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];
      const source = nodePositionLookup.get(edge.source);
      const target = nodePositionLookup.get(edge.target);

      if (!source || !target) continue;

      const base = i * 6;
      positions[base] = source[0];
      positions[base + 1] = source[1];
      positions[base + 2] = source[2];
      positions[base + 3] = target[0];
      positions[base + 4] = target[1];
      positions[base + 5] = target[2];

      const isConnectedToSelected =
        selectedNodeId !== null &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);

      const isConnectedToHovered =
        hoveredNodeId !== null &&
        (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

      const edgeColor = isConnectedToSelected
        ? selectedColor
        : isConnectedToHovered
          ? hoveredColor
          : baseColor;

      colors[base] = edgeColor.r;
      colors[base + 1] = edgeColor.g;
      colors[base + 2] = edgeColor.b;
      colors[base + 3] = edgeColor.r;
      colors[base + 4] = edgeColor.g;
      colors[base + 5] = edgeColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [edges, hoveredNodeId, nodePositionLookup, selectedNodeId]);

  if (!edgeGeometry) return null;

  return (
    <lineSegments geometry={edgeGeometry} frustumCulled={false}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={EDGE_CONFIG.opacity}
      />
    </lineSegments>
  );
}
