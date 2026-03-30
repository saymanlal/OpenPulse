'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';

const WHITE_COLOR = new THREE.Color('#ffffff');
const DEPENDS_ON_COLOR = new THREE.Color('#34d399');
const USED_BY_COLOR = new THREE.Color('#fb923c');
const HOVER_COLOR = new THREE.Color('#94a3b8');

export default function GraphEdges() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);

  const nodePositionLookup = useMemo(() => {
    const lookup = new Map<string, [number, number, number]>();
    for (const node of nodes) {
      if (node.position) {
        lookup.set(node.id, node.position);
      }
    }
    return lookup;
  }, [nodes]);

  const { allEdgesGeometry, selectedEdgesGeometry } = useMemo(() => {
    if (edges.length === 0) return { allEdgesGeometry: null, selectedEdgesGeometry: null };

    const allPositions = new Float32Array(edges.length * 6);
    const allColors = new Float32Array(edges.length * 6);

    const selectedEdges: { source: [number,number,number], target: [number,number,number], color: THREE.Color }[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const source = nodePositionLookup.get(edge.source);
      const target = nodePositionLookup.get(edge.target);
      if (!source || !target) continue;

      const base = i * 6;
      allPositions[base]     = source[0]; allPositions[base + 1] = source[1]; allPositions[base + 2] = source[2];
      allPositions[base + 3] = target[0]; allPositions[base + 4] = target[1]; allPositions[base + 5] = target[2];

      allColors[base]     = WHITE_COLOR.r;
      allColors[base + 1] = WHITE_COLOR.g;
      allColors[base + 2] = WHITE_COLOR.b;
      allColors[base + 3] = WHITE_COLOR.r;
      allColors[base + 4] = WHITE_COLOR.g;
      allColors[base + 5] = WHITE_COLOR.b;

      const isOutgoing = edge.source === selectedNodeId;
      const isIncoming = edge.target === selectedNodeId;
      const isHoverConn = hoveredNodeId !== null && (edge.source === hoveredNodeId || edge.target === hoveredNodeId) && !selectedNodeId;

      if (isOutgoing) {
        selectedEdges.push({ source, target, color: DEPENDS_ON_COLOR });
      } else if (isIncoming) {
        selectedEdges.push({ source, target, color: USED_BY_COLOR });
      } else if (isHoverConn) {
        selectedEdges.push({ source, target, color: HOVER_COLOR });
      }
    }

    const allGeo = new THREE.BufferGeometry();
    allGeo.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
    allGeo.setAttribute('color', new THREE.BufferAttribute(allColors, 3));

    let selectedGeo: THREE.BufferGeometry | null = null;
    if (selectedEdges.length > 0) {
      const vPositions = new Float32Array(selectedEdges.length * 6);
      const vColors = new Float32Array(selectedEdges.length * 6);
      selectedEdges.forEach(({ source, target, color }, i) => {
        const b = i * 6;
        vPositions[b]     = source[0]; vPositions[b + 1] = source[1]; vPositions[b + 2] = source[2];
        vPositions[b + 3] = target[0]; vPositions[b + 4] = target[1]; vPositions[b + 5] = target[2];
        vColors[b]     = color.r; vColors[b + 1] = color.g; vColors[b + 2] = color.b;
        vColors[b + 3] = color.r; vColors[b + 4] = color.g; vColors[b + 5] = color.b;
      });
      selectedGeo = new THREE.BufferGeometry();
      selectedGeo.setAttribute('position', new THREE.BufferAttribute(vPositions, 3));
      selectedGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));
    }

    return { allEdgesGeometry: allGeo, selectedEdgesGeometry: selectedGeo };
  }, [edges, nodePositionLookup, selectedNodeId, hoveredNodeId]);

  return (
    <>
      {allEdgesGeometry && (
        <lineSegments geometry={allEdgesGeometry} frustumCulled={false}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.12}
            linewidth={1}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {selectedEdgesGeometry && (
        <lineSegments geometry={selectedEdgesGeometry} frustumCulled={false} renderOrder={1}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.7}
            linewidth={2}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  );
}