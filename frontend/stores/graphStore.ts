import { create } from 'zustand';
import type { GraphData, GraphEdge, GraphNode } from '@/types/graph';

interface GraphStore {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  setGraphData: (data: GraphData) => void;
  setGraphDataPreserveSelection: (data: GraphData) => void;
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  updateNodePosition: (nodeId: string, position: [number, number, number]) => void;
  updateNodePositions: (positions: Record<string, [number, number, number]>) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hoveredNodeId: null,

  // Full reset - use only on initial load
  setGraphData: (data: GraphData) =>
    set({
      nodes: data.nodes,
      edges: data.edges,
      selectedNodeId: null,
      hoveredNodeId: null,
    }),

  // Use this for evolution updates - keeps inspector open
  setGraphDataPreserveSelection: (data: GraphData) =>
    set((state) => ({
      nodes: data.nodes,
      edges: data.edges,
      selectedNodeId: state.selectedNodeId,
      hoveredNodeId: state.hoveredNodeId,
    })),

  // Update only positions - preserves all selection state
  setNodes: (nodes: GraphNode[]) => set({ nodes }),

  setEdges: (edges: GraphEdge[]) => set({ edges }),

  setSelectedNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),

  setHoveredNode: (nodeId: string | null) => set({ hoveredNodeId: nodeId }),

  updateNodePosition: (nodeId: string, position: [number, number, number]) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node,
      ),
    })),

  updateNodePositions: (positions: Record<string, [number, number, number]>) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const next = positions[node.id];
        return next ? { ...node, position: next } : node;
      }),
    })),

  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      hoveredNodeId: null,
    }),
}));