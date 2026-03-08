import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ForceSimulation3D } from '@/lib/forceSimulation';
import type { GraphNode, GraphEdge } from '@/types/graph';

interface UseForceSimulationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  enabled?: boolean;
  onUpdate?: (nodes: GraphNode[]) => void;
}

export function useForceSimulation({
  nodes,
  edges,
  enabled = true,
  onUpdate,
}: UseForceSimulationProps) {
  const simulationRef = useRef<ForceSimulation3D | null>(null);
  const tickCountRef = useRef(0);
  const maxTicks = 300; // Stop after 300 ticks

  useEffect(() => {
    if (nodes.length === 0 || !enabled) return;

    simulationRef.current = new ForceSimulation3D(nodes, edges);
    tickCountRef.current = 0;

    return () => {
      simulationRef.current = null;
    };
  }, [nodes, edges, enabled]);

  useFrame(() => {
    if (!simulationRef.current || !enabled || tickCountRef.current >= maxTicks) return;

    const shouldContinue = simulationRef.current.tick();
    
    if (shouldContinue) {
      const updatedNodes = simulationRef.current.getNodes();
      onUpdate?.(updatedNodes);
      tickCountRef.current++;
    } else {
      tickCountRef.current = maxTicks;
    }
  });

  return {
    restart: () => {
      if (simulationRef.current) {
        simulationRef.current.restart();
        tickCountRef.current = 0;
      }
    },
    stop: () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        tickCountRef.current = maxTicks;
      }
    },
  };
}