export type NodeType =
  | 'service'
  | 'library'
  | 'repository'
  | 'database'
  | 'api'
  | 'server'
  | 'ip'
  | 'threat'
  | 'vulnerability'
  | 'root';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  position?: [number, number, number];
  metadata?: Record<string, unknown>;
  riskScore?: number;
  size?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AnalyzerNode {
  id: string;
  type: NodeType;
  risk: number;
  size: number;
}

export interface AnalyzerEdge {
  source: string;
  target: string;
}

export interface AnalyzerGraphData {
  nodes: AnalyzerNode[];
  edges: AnalyzerEdge[];
}

export interface SelectedNode extends GraphNode {
  connections: {
    incoming: string[];
    outgoing: string[];
  };
}