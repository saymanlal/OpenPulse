import type { GraphNode, GraphEdge } from '@/types/graph';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async health(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  // Graph Data
  async getGraphData(): Promise<GraphData> {
    const response = await fetch(`${this.baseUrl}/api/graph/data`);
    if (!response.ok) throw new Error('Failed to fetch graph data');
    return response.json();
  }

  async createGraphData(data: GraphData): Promise<GraphData> {
    const response = await fetch(`${this.baseUrl}/api/graph/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create graph data');
    return response.json();
  }

  async clearGraphData(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/graph/data`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear graph data');
    return response.json();
  }

  // Nodes
  async getNodes(): Promise<GraphNode[]> {
    const response = await fetch(`${this.baseUrl}/api/graph/nodes`);
    if (!response.ok) throw new Error('Failed to fetch nodes');
    return response.json();
  }

  async createNode(node: GraphNode): Promise<GraphNode> {
    const response = await fetch(`${this.baseUrl}/api/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    });
    if (!response.ok) throw new Error('Failed to create node');
    return response.json();
  }

  async updateNode(nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    const response = await fetch(`${this.baseUrl}/api/graph/nodes/${nodeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update node');
    return response.json();
  }

  async deleteNode(nodeId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/graph/nodes/${nodeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete node');
    return response.json();
  }

  // Edges
  async getEdges(): Promise<GraphEdge[]> {
    const response = await fetch(`${this.baseUrl}/api/graph/edges`);
    if (!response.ok) throw new Error('Failed to fetch edges');
    return response.json();
  }

  async createEdge(edge: GraphEdge): Promise<GraphEdge> {
    const response = await fetch(`${this.baseUrl}/api/graph/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edge),
    });
    if (!response.ok) throw new Error('Failed to create edge');
    return response.json();
  }

  async deleteEdge(edgeId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/graph/edges/${edgeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete edge');
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();