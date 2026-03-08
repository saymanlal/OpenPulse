import { create } from 'zustand';
import type { GraphNode, GraphEdge, GraphData } from '@/types/graph';

interface GraphStore {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  
  setGraphData: (data: GraphData) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  
  setGraphData: (data: GraphData) => set({ 
    nodes: data.nodes, 
    edges: data.edges 
  }),
  
  setSelectedNode: (nodeId: string | null) => set({ 
    selectedNodeId: nodeId 
  }),
  
  setHoveredNode: (nodeId: string | null) => set({ 
    hoveredNodeId: nodeId 
  }),
  
  clearGraph: () => set({ 
    nodes: [], 
    edges: [], 
    selectedNodeId: null, 
    hoveredNodeId: null 
  }),
}));