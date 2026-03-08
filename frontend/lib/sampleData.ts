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

  // Generate nodes with random initial positions
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
      metadata: {
        index: i,
        createdAt: new Date().toISOString(),
      },
      riskScore: Math.random(),
    });
  }

  // Generate edges - each node connects to 1-3 others
  for (let i = 0; i < nodeCount; i++) {
    const connectionCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < connectionCount; j++) {
      const targetIndex = Math.floor(Math.random() * nodeCount);
      if (targetIndex !== i) {
        edges.push({
          id: `edge-${i}-${targetIndex}`,
          source: `node-${i}`,
          target: `node-${targetIndex}`,
          weight: Math.random(),
        });
      }
    }
  }

  return { nodes, edges };
}