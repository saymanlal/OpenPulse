import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ForceSimulation } from '@/lib/forceSimulation';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphNode, GraphEdge } from '@/types/graph';

export function useForceSimulation(
  nodes?: GraphNode[],
  edges?: GraphEdge[],
  enabled: boolean = true
) {
  const simulationRef = useRef<ForceSimulation | null>(null);
  const tickCountRef = useRef(0);
  const updateNodePosition = useGraphStore((state) => state.updateNodePosition);

  const safeNodes = nodes ?? [];
  const safeEdges = edges ?? [];

  useEffect(() => {
    if (!enabled || safeNodes.length === 0) return;

    simulationRef.current = new ForceSimulation(safeNodes, safeEdges);
    tickCountRef.current = 0;

    return () => {
      simulationRef.current = null;
    };
  }, [safeNodes.length, safeEdges.length, enabled]);

  useFrame(() => {
    const simulation = simulationRef.current;

    if (!simulation || simulation.isStable()) return;

    const updatedNodes = simulation.tick();

    if (!updatedNodes || updatedNodes.length === 0) return;

    updatedNodes.forEach((node) => {
      updateNodePosition(node.id, node.position);
    });

    tickCountRef.current++;

    if (tickCountRef.current > 300) {
      simulationRef.current = null;
    }

    tickCountRef.current++;
  });
}