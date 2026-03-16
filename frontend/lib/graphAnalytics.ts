import type { GraphNode, GraphEdge } from '@/types/graph';

export interface CentralityScores {
  degree: number;
  betweenness: number;
  closeness: number;
  pageRank: number;
}

export interface DependencyMetrics {
  depth: number;
  directDependencies: number;
  totalDependencies: number;
  dependents: number;
}

export class GraphAnalytics {
  private nodes: GraphNode[];
  private edges: GraphEdge[];
  private adjacencyList: Map<string, Set<string>>;
  private reverseAdjacencyList: Map<string, Set<string>>;

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.buildAdjacencyLists();
  }

  private buildAdjacencyLists() {
    // Initialize
    this.nodes.forEach(node => {
      this.adjacencyList.set(node.id, new Set());
      this.reverseAdjacencyList.set(node.id, new Set());
    });

    // Build lists
    this.edges.forEach(edge => {
      this.adjacencyList.get(edge.source)?.add(edge.target);
      this.reverseAdjacencyList.get(edge.target)?.add(edge.source);
    });
  }

  /**
   * Calculate degree centrality (normalized)
   * Measures: How many connections does a node have?
   */
  calculateDegreeCentrality(nodeId: string): number {
    const outDegree = this.adjacencyList.get(nodeId)?.size || 0;
    const inDegree = this.reverseAdjacencyList.get(nodeId)?.size || 0;
    const totalDegree = outDegree + inDegree;
    
    // Normalize by maximum possible connections
    const maxConnections = (this.nodes.length - 1) * 2;
    return maxConnections > 0 ? totalDegree / maxConnections : 0;
  }

  /**
   * Calculate betweenness centrality (simplified)
   * Measures: How often does this node appear on shortest paths between others?
   */
  calculateBetweennessCentrality(nodeId: string): number {
    let betweenness = 0;
    const nodeCount = this.nodes.length;

    // For each pair of nodes (excluding the target node)
    this.nodes.forEach(source => {
      if (source.id === nodeId) return;

      const distances = this.bfsDistances(source.id);
      
      this.nodes.forEach(target => {
        if (target.id === nodeId || target.id === source.id) return;

        // Check if nodeId is on a shortest path from source to target
        const distSourceToNode = distances.get(nodeId) ?? Infinity;
        const distSourceToTarget = distances.get(target.id) ?? Infinity;
        const distNodeToTarget = this.bfsDistance(nodeId, target.id);

        if (distSourceToNode + distNodeToTarget === distSourceToTarget &&
            distSourceToTarget !== Infinity) {
          betweenness += 1;
        }
      });
    });

    // Normalize
    const maxBetweenness = (nodeCount - 1) * (nodeCount - 2);
    return maxBetweenness > 0 ? betweenness / maxBetweenness : 0;
  }

  /**
   * Calculate closeness centrality
   * Measures: How close is this node to all others?
   */
  calculateClosenessCentrality(nodeId: string): number {
    const distances = this.bfsDistances(nodeId);
    let totalDistance = 0;
    let reachableNodes = 0;

    distances.forEach((distance, targetId) => {
      if (targetId !== nodeId && distance !== Infinity) {
        totalDistance += distance;
        reachableNodes++;
      }
    });

    if (reachableNodes === 0) return 0;

    // Closeness is inverse of average distance
    const avgDistance = totalDistance / reachableNodes;
    return avgDistance > 0 ? 1 / avgDistance : 0;
  }

  /**
   * Calculate PageRank (simplified)
   * Measures: Importance based on incoming connections
   */
  calculatePageRank(nodeId: string, dampingFactor: number = 0.85, iterations: number = 20): number {
    const nodeCount = this.nodes.length;
    const ranks = new Map<string, number>();
    
    // Initialize all nodes with equal rank
    this.nodes.forEach(node => {
      ranks.set(node.id, 1 / nodeCount);
    });

    // Iterate
    for (let i = 0; i < iterations; i++) {
      const newRanks = new Map<string, number>();

      this.nodes.forEach(node => {
        let rank = (1 - dampingFactor) / nodeCount;

        // Add rank from incoming links
        const incomingNodes = this.reverseAdjacencyList.get(node.id) || new Set();
        incomingNodes.forEach(sourceId => {
          const sourceRank = ranks.get(sourceId) || 0;
          const sourceOutDegree = this.adjacencyList.get(sourceId)?.size || 1;
          rank += dampingFactor * (sourceRank / sourceOutDegree);
        });

        newRanks.set(node.id, rank);
      });

      ranks.clear();
      newRanks.forEach((rank, id) => ranks.set(id, rank));
    }

    return ranks.get(nodeId) || 0;
  }

  /**
   * Calculate all centrality scores for a node
   */
  calculateCentralityScores(nodeId: string): CentralityScores {
    return {
      degree: this.calculateDegreeCentrality(nodeId),
      betweenness: this.calculateBetweennessCentrality(nodeId),
      closeness: this.calculateClosenessCentrality(nodeId),
      pageRank: this.calculatePageRank(nodeId),
    };
  }

  /**
   * Calculate dependency depth (longest path from this node)
   */
  calculateDependencyDepth(nodeId: string): number {
    const visited = new Set<string>();
    
    const dfs = (currentId: string): number => {
      if (visited.has(currentId)) return 0;
      visited.add(currentId);

      const neighbors = this.adjacencyList.get(currentId) || new Set();
      if (neighbors.size === 0) return 0;

      let maxDepth = 0;
      neighbors.forEach(neighborId => {
        maxDepth = Math.max(maxDepth, 1 + dfs(neighborId));
      });

      return maxDepth;
    };

    return dfs(nodeId);
  }

  /**
   * Calculate dependency metrics
   */
  calculateDependencyMetrics(nodeId: string): DependencyMetrics {
    const directDeps = this.adjacencyList.get(nodeId)?.size || 0;
    const dependents = this.reverseAdjacencyList.get(nodeId)?.size || 0;
    
    // Calculate total dependencies (all reachable nodes)
    const visited = new Set<string>();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      const neighbors = this.adjacencyList.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }
    
    const totalDeps = visited.size - 1; // Exclude the node itself

    return {
      depth: this.calculateDependencyDepth(nodeId),
      directDependencies: directDeps,
      totalDependencies: totalDeps,
      dependents,
    };
  }

  /**
   * BFS to calculate distances from a source node
   */
  private bfsDistances(sourceId: string): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: string[] = [sourceId];
    distances.set(sourceId, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDistance = distances.get(current)!;

      const neighbors = this.adjacencyList.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDistance + 1);
          queue.push(neighbor);
        }
      });
    }

    // Set unreachable nodes to Infinity
    this.nodes.forEach(node => {
      if (!distances.has(node.id)) {
        distances.set(node.id, Infinity);
      }
    });

    return distances;
  }

  /**
   * BFS to calculate distance between two specific nodes
   */
  private bfsDistance(sourceId: string, targetId: string): number {
    if (sourceId === targetId) return 0;

    const visited = new Set<string>();
    const queue: [string, number][] = [[sourceId, 0]];
    visited.add(sourceId);

    while (queue.length > 0) {
      const [current, distance] = queue.shift()!;

      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (neighbor === targetId) {
          return distance + 1;
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, distance + 1]);
        }
      }
    }

    return Infinity;
  }

  /**
   * Get nodes sorted by a centrality metric
   */
  getRankedNodes(metric: keyof CentralityScores): Array<{node: GraphNode; score: number}> {
    const scores = this.nodes.map(node => ({
      node,
      score: this.calculateCentralityScores(node.id)[metric],
    }));

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Identify critical nodes (high centrality)
   */
  getCriticalNodes(threshold: number = 0.7): GraphNode[] {
    return this.nodes.filter(node => {
      const scores = this.calculateCentralityScores(node.id);
      const avgCentrality = (scores.degree + scores.betweenness + scores.closeness + scores.pageRank) / 4;
      return avgCentrality >= threshold;
    });
  }
}