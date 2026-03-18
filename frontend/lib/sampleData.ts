import type { GraphData, GraphNode, NodeType } from '@/types/graph';

const NODE_TYPES: NodeType[] = [
  'service',
  'library',
  'repository',
  'database',
  'api',
  'server',
  'ip',
  'threat',
  'vulnerability',
];

const DEMO_STORAGE_KEY = 'openpulse-demo-graph-v1';
const DEFAULT_DEMO_SEED = 15015;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickNodeType(random: () => number): NodeType {
  return NODE_TYPES[Math.floor(random() * NODE_TYPES.length)];
}

function randomPosition(random: () => number, radius: number): [number, number, number] {
  return [
    (random() - 0.5) * radius,
    (random() - 0.5) * radius,
    (random() - 0.5) * radius,
  ];
}

export function generateSampleGraph(nodeCount: number = 20): GraphData {
  const random = createSeededRandom(Date.now());
  const nodes: GraphNode[] = [];
  const edges: GraphData['edges'] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: pickNodeType(random),
      position: randomPosition(random, 20),
      riskScore: Number(random().toFixed(3)),
      metadata: {
        index: i,
        generatedFor: 'manual-demo',
      },
    });
  }

  while (edges.length < Math.max(nodeCount, Math.floor(nodeCount * 2))) {
    const sourceIndex = Math.floor(random() * nodeCount);
    const targetIndex = Math.floor(random() * nodeCount);

    if (sourceIndex === targetIndex) {
      continue;
    }

    const edgeKey = `${sourceIndex}-${targetIndex}`;
    if (edgeSet.has(edgeKey)) {
      continue;
    }

    edgeSet.add(edgeKey);
    edges.push({
      id: `edge-${sourceIndex}-${targetIndex}`,
      source: `node-${sourceIndex}`,
      target: `node-${targetIndex}`,
      weight: Number((0.2 + random() * 0.8).toFixed(3)),
    });
  }

  return { nodes, edges };
}

export function generateDemoDataset(seed: number = DEFAULT_DEMO_SEED): GraphData {
  const nodeCount = 200;
  const edgeCount = 400;
  const random = createSeededRandom(seed);
  const nodes: GraphNode[] = [];
  const edges: GraphData['edges'] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: pickNodeType(random),
      position: randomPosition(random, 30),
      riskScore: Number(random().toFixed(3)),
      metadata: {
        index: i,
        generatedAt: 'phase-15',
      },
    });
  }

  while (edges.length < edgeCount) {
    const sourceIndex = Math.floor(random() * nodeCount);
    const targetIndex = Math.floor(random() * nodeCount);

    if (sourceIndex === targetIndex) {
      continue;
    }

    const edgeKey = `${sourceIndex}-${targetIndex}`;
    if (edgeSet.has(edgeKey)) {
      continue;
    }

    edgeSet.add(edgeKey);
    edges.push({
      id: `edge-${edges.length}`,
      source: `node-${sourceIndex}`,
      target: `node-${targetIndex}`,
      weight: Number((0.1 + random() * 0.9).toFixed(3)),
    });
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
      if (parsed.nodes?.length === 200 && parsed.edges?.length === 400) {
        return parsed;
      }
    }
  } catch {
    // ignore malformed cache and regenerate
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

export function evolveDemoDataset(current: GraphData): GraphData {
  const nodes = current.nodes.map((node, index) => {
    if (index % 6 !== 0) {
      return node;
    }

    const [x, y, z] = node.position;
    const jitter = 0.35;
    const nextRisk = node.riskScore ?? 0.5;

    return {
      ...node,
      position: [
        Number((x + (Math.random() - 0.5) * jitter).toFixed(3)),
        Number((y + (Math.random() - 0.5) * jitter).toFixed(3)),
        Number((z + (Math.random() - 0.5) * jitter).toFixed(3)),
      ],
      riskScore: Number(
        Math.min(1, Math.max(0, nextRisk + (Math.random() - 0.5) * 0.06)).toFixed(3)
      ),
    };
  });

  return { nodes, edges: current.edges };
}
