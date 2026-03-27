'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGraphStore } from '@/stores/graphStore';

const HIDDEN_COLOR = new THREE.Color('#000000');
const DEPENDS_ON_COLOR = new THREE.Color('#34d399');  // green - outgoing (this node depends on)
const USED_BY_COLOR = new THREE.Color('#fb923c');      // orange - incoming (others depend on this)
const HOVER_COLOR = new THREE.Color('#94a3b8');        // subtle gray for hover only

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

  // Split into two layers: hidden (all) + visible (selected connections)
  const { hiddenGeometry, visibleGeometry } = useMemo(() => {
    if (edges.length === 0) return { hiddenGeometry: null, visibleGeometry: null };

    // All edges - invisible unless selected/hovered
    const allPositions = new Float32Array(edges.length * 6);
    const allColors = new Float32Array(edges.length * 6);

    // Only connected edges with color
    const connectedEdges: { source: [number,number,number], target: [number,number,number], color: THREE.Color }[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const source = nodePositionLookup.get(edge.source);
      const target = nodePositionLookup.get(edge.target);
      if (!source || !target) continue;

      const base = i * 6;
      allPositions[base]     = source[0]; allPositions[base + 1] = source[1]; allPositions[base + 2] = source[2];
      allPositions[base + 3] = target[0]; allPositions[base + 4] = target[1]; allPositions[base + 5] = target[2];

      // Determine color
      const isOutgoing = edge.source === selectedNodeId;  // this node → dependency
      const isIncoming = edge.target === selectedNodeId;  // dependency → this node
      const isHoverConn = hoveredNodeId !== null && (edge.source === hoveredNodeId || edge.target === hoveredNodeId) && !selectedNodeId;

      let color = HIDDEN_COLOR;
      if (isOutgoing) {
        color = DEPENDS_ON_COLOR;
        connectedEdges.push({ source, target, color });
      } else if (isIncoming) {
        color = USED_BY_COLOR;
        connectedEdges.push({ source, target, color });
      } else if (isHoverConn) {
        color = HOVER_COLOR;
      }

      allColors[base]     = color.r; allColors[base + 1] = color.g; allColors[base + 2] = color.b;
      allColors[base + 3] = color.r; allColors[base + 4] = color.g; allColors[base + 5] = color.b;
    }

    const hiddenGeo = new THREE.BufferGeometry();
    hiddenGeo.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
    hiddenGeo.setAttribute('color', new THREE.BufferAttribute(allColors, 3));

    // Highlighted edges as separate thicker geometry
    let visibleGeo: THREE.BufferGeometry | null = null;
    if (connectedEdges.length > 0) {
      const vPositions = new Float32Array(connectedEdges.length * 6);
      const vColors = new Float32Array(connectedEdges.length * 6);
      connectedEdges.forEach(({ source, target, color }, i) => {
        const b = i * 6;
        vPositions[b]     = source[0]; vPositions[b + 1] = source[1]; vPositions[b + 2] = source[2];
        vPositions[b + 3] = target[0]; vPositions[b + 4] = target[1]; vPositions[b + 5] = target[2];
        vColors[b]     = color.r; vColors[b + 1] = color.g; vColors[b + 2] = color.b;
        vColors[b + 3] = color.r; vColors[b + 4] = color.g; vColors[b + 5] = color.b;
      });
      visibleGeo = new THREE.BufferGeometry();
      visibleGeo.setAttribute('position', new THREE.BufferAttribute(vPositions, 3));
      visibleGeo.setAttribute('color', new THREE.BufferAttribute(vColors, 3));
    }

    return { hiddenGeometry: hiddenGeo, visibleGeometry: visibleGeo };
  }, [edges, nodePositionLookup, selectedNodeId, hoveredNodeId]);

  return (
    <>
      {/* All edges - fully transparent when no selection */}
      {hiddenGeometry && (
        <lineSegments geometry={hiddenGeometry} frustumCulled={false}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={selectedNodeId || hoveredNodeId ? 0.12 : 0}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {/* Highlighted edges on top */}
      {visibleGeometry && (
        <lineSegments geometry={visibleGeometry} frustumCulled={false} renderOrder={1}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  );
}
