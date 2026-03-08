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

        // Determine if edge is connected to selected or hovered node
        const isConnectedToSelected = 
          selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
        const isConnectedToHovered = 
          hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

        return { geometry, edge, isConnectedToSelected, isConnectedToHovered };
      })
      .filter((item): item is { 
        geometry: THREE.BufferGeometry; 
        edge: typeof edges[0];
        isConnectedToSelected: boolean;
        isConnectedToHovered: boolean;
      } => item !== null);
  }, [edges, nodePositions, selectedNodeId, hoveredNodeId]);

  if (lineGeometries.length === 0) return null;

  return (
    <group>
      {lineGeometries.map(({ geometry, edge, isConnectedToSelected, isConnectedToHovered }) => {
        let color = EDGE_CONFIG.baseColor;
        let opacity = EDGE_CONFIG.opacity;

        if (isConnectedToSelected) {
          color = EDGE_CONFIG.selectedColor;
          opacity = EDGE_CONFIG.selectedOpacity;
        } else if (isConnectedToHovered) {
          color = EDGE_CONFIG.hoveredColor;
          opacity = EDGE_CONFIG.hoveredOpacity;
        }

        return (
          <line key={edge.id} geometry={geometry}>
            <lineBasicMaterial
              color={color}
              opacity={opacity}
              transparent
              linewidth={EDGE_CONFIG.lineWidth}
            />
          </line>
        );
      })}
    </group>
  );
}