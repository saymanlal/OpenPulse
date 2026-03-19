import type { GraphData, GraphEdge, GraphNode, NodeType } from '@/types/graph';

const NODE_TYPES: NodeType[] = ['library', 'api', 'service', 'database', 'server', 'repository'];
const DEMO_STORAGE_KEY = 'openpulse-demo-graph-v2';
const DEFAULT_DEMO_SEED = 16016;
const DEMO_NODE_COUNT = 120;
const CLUSTER_COUNT = 6;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickNodeType(random: () => number, clusterIndex: number): NodeType {
  return NODE_TYPES[(clusterIndex + Math.floor(random() * NODE_TYPES.length)) % NODE_TYPES.length];
}

function createClusterCenter(clusterIndex: number): [number, number, number] {
  const angle = (clusterIndex / CLUSTER_COUNT) * Math.PI * 2;
  return [
    Number((Math.cos(angle) * 10).toFixed(2)),
    Number((((clusterIndex % 3) - 1) * 3.6).toFixed(2)),
    Number((Math.sin(angle) * 10).toFixed(2)),
  ];
}

function createNode(
  clusterIndex: number,
  nodeIndex: number,
  random: () => number,
  center: [number, number, number],
): GraphNode {
  const angle = ((nodeIndex % 20) / 20) * Math.PI * 2;
  const radius = 1.8 + random() * 2.8;
  return {
    id: clusterIndex === 0 && nodeIndex === 0 ? 'demo/repository' : `pkg-${clusterIndex}-${nodeIndex}`,
    label: clusterIndex === 0 && nodeIndex === 0 ? 'demo/repository' : `pkg-${clusterIndex}-${nodeIndex}`,
    type: clusterIndex === 0 && nodeIndex === 0 ? 'repository' : pickNodeType(random, clusterIndex),
    position: [
      Number((center[0] + Math.cos(angle) * radius).toFixed(2)),
      Number((center[1] + (random() - 0.5) * 2.5).toFixed(2)),
      Number((center[2] + Math.sin(angle) * radius).toFixed(2)),
    ],
    riskScore: Number((0.18 + random() * 0.68).toFixed(2)),
    size: Number((1 + random() * 1.2).toFixed(2)),
    metadata: {
      cluster: clusterIndex,
      source: 'demo',
    },
  };
}

export function generateDemoDataset(seed: number = DEFAULT_DEMO_SEED): GraphData {
  const random = createSeededRandom(seed);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const clusterRoots: string[] = [];

  const nodesPerCluster = Math.floor(DEMO_NODE_COUNT / CLUSTER_COUNT);

  for (let clusterIndex = 0; clusterIndex < CLUSTER_COUNT; clusterIndex += 1) {
    const center = createClusterCenter(clusterIndex);
    for (let nodeIndex = 0; nodeIndex < nodesPerCluster; nodeIndex += 1) {
      const node = createNode(clusterIndex, nodeIndex, random, center);
      nodes.push(node);
      if (nodeIndex === 0) {
        clusterRoots.push(node.id);
      }
    }
  }

  clusterRoots.slice(1).forEach((targetId, index) => {
    edges.push({
      id: `backbone-${index}`,
      source: clusterRoots[0],
      target: targetId,
      weight: 1,
    });
  });

  for (let clusterIndex = 0; clusterIndex < CLUSTER_COUNT; clusterIndex += 1) {
    const clusterNodes = nodes.slice(clusterIndex * nodesPerCluster, (clusterIndex + 1) * nodesPerCluster);
    const rootId = clusterNodes[0].id;

    for (let index = 1; index < clusterNodes.length; index += 1) {
      const current = clusterNodes[index];
      const parent = clusterNodes[Math.max(0, index - 1 - (index % 3))];
      edges.push({
        id: `cluster-${clusterIndex}-${index}`,
        source: index % 4 === 0 ? rootId : parent.id,
        target: current.id,
        weight: 1,
      });
    }

    for (let index = 2; index < clusterNodes.length; index += 5) {
      edges.push({
        id: `cross-${clusterIndex}-${index}`,
        source: clusterNodes[index - 2].id,
        target: clusterNodes[index].id,
        weight: 0.6,
      });
    }
  }

  return { nodes, edges };
}

export function getOrCreateDemoDataset(): GraphData {
  if (typeof window === 'undefined') {
    return generateDemoDataset();
  }

  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GraphData;
      if (parsed.nodes?.length >= 100 && parsed.nodes?.length <= 150) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed cache and regenerate.
  }

  const generated = generateDemoDataset();
  persistDemoDataset(generated);
  return generated;
}

export function persistDemoDataset(data: GraphData): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
}
