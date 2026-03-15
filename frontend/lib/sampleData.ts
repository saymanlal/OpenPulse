import type { GraphData, NodeType } from '@/types/graph';

const NODE_TYPES: NodeType[] = [
  'service',
  'library',
  'repository',
  'database',
  'api',
  'server',
];

export function generateSampleGraph(nodeCount: number = 20): GraphData {
  const nodes = [];
  const edges = [];
  const edgeSet = new Set<string>(); // Track unique edges

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)],
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ] as [number, number, number],
      riskScore: Math.random(),
      metadata: {
        index: i,
        createdAt: new Date().toISOString(),
      },
    });
  }

  // Generate edges (ensure unique)
  const edgesPerNode = Math.floor((nodeCount * 2.5) / nodeCount); // ~2.5 edges per node on average
  
  for (let i = 0; i < nodeCount; i++) {
    const numEdges = Math.floor(Math.random() * edgesPerNode) + 1;
    
    for (let j = 0; j < numEdges; j++) {
      const target = Math.floor(Math.random() * nodeCount);
      if (target !== i) {
        // Create sorted edge key to avoid duplicates (A->B and B->A are same)
        const edgeKey = [i, target].sort((a, b) => a - b).join('-');
        
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: `edge-${i}-${target}`,
            source: `node-${i}`,
            target: `node-${target}`,
            weight: Math.random(),
          });
        }
      }
    }
  }

  return { nodes, edges };
}