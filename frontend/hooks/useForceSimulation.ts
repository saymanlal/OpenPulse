import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ForceSimulation } from '@/lib/forceSimulation';
import { useGraphStore } from '@/stores/graphStore';
import { PERFORMANCE } from '@/lib/constants';
import type { GraphNode, GraphEdge } from '@/types/graph';

export function useForceSimulation(
  nodes?: GraphNode[],
  edges?: GraphEdge[],
  enabled: boolean = true
) {
  const simulationRef = useRef<ForceSimulation | null>(null);
  const tickCountRef = useRef(0);
  const frameAccumulatorRef = useRef(0);
  const updateNodePositions = useGraphStore((state) => state.updateNodePositions);

  const safeNodes = nodes ?? [];
  const safeEdges = edges ?? [];

  useEffect(() => {
    if (!enabled || safeNodes.length === 0) {
      simulationRef.current = null;
      return;
    }

    simulationRef.current = new ForceSimulation(safeNodes, safeEdges);
    tickCountRef.current = 0;
    frameAccumulatorRef.current = 0;

    return () => {
      simulationRef.current = null;
    };
  }, [enabled, safeNodes, safeEdges]);

  useFrame((_, delta) => {
    const simulation = simulationRef.current;
    if (!simulation || simulation.isStable()) return;

    frameAccumulatorRef.current += delta;
    if (frameAccumulatorRef.current < PERFORMANCE.simulationStepInterval) return;
    frameAccumulatorRef.current = 0;

    const updatedNodes = simulation.tick();
    if (updatedNodes.length === 0) return;

    const nextPositions = updatedNodes.reduce<Record<string, [number, number, number]>>((acc, node) => {
      acc[node.id] = node.position;
      return acc;
    }, {});

    updateNodePositions(nextPositions);

    tickCountRef.current += 1;
    if (tickCountRef.current >= PERFORMANCE.maxSimulationTicks) {
      simulationRef.current = null;
    }
  });
}
