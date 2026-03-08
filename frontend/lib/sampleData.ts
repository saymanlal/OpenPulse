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

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const radius = 15 + Math.random() * 10;
    const height = (Math.random() - 0.5) * 10;

    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)],
      position: [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ] as [number, number, number],
      metadata: {
        index: i,
        createdAt: new Date().toISOString(),
      },
      riskScore: Math.random(),
    });
  }

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