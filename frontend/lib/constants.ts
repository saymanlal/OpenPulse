import type { NodeType } from '@/types/graph';

export const SCENE_CONFIG = {
  camera: {
    fov: 52,
    near: 0.1,
    far: 1000,
    initialPosition: [0, 6, 34] as [number, number, number],
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.08,
    rotateSpeed: 0.5,
    zoomSpeed: 0.85,
    minDistance: 12,
    maxDistance: 90,
    maxPolarAngle: Math.PI * 0.92,
  },
  lighting: {
    ambient: {
      intensity: 0.55,
      color: '#dbeafe',
    },
    directional: {
      intensity: 1.2,
      color: '#ffffff',
      position: [8, 14, 10] as [number, number, number],
    },
    point: {
      intensity: 1.6,
      color: '#2563eb',
      position: [-10, 4, 12] as [number, number, number],
    },
  },
  fog: {
    color: '#0b0f19',
    density: 0.04,
  },
  background: '#0b0f19',
} as const;

export const NODE_CONFIG = {
  baseSize: 0.58,
  hoverScale: 1.22,
  selectedScale: 1.38,
  segments: 7,
  metalness: 0.18,
  roughness: 0.42,
  emissiveIntensity: 0.18,
} as const;

export const EDGE_CONFIG = {
  baseColor: '#334155',
  activeColor: '#60a5fa',
  opacity: 0.34,
} as const;

export const NODE_COLORS: Record<NodeType, string> = {
  service: '#10b981',
  library: '#60a5fa',
  repository: '#a78bfa',
  database: '#f59e0b',
  api: '#22d3ee',
  server: '#94a3b8',
  ip: '#fb7185',
  threat: '#ef4444',
  vulnerability: '#f97316',
};

export const PERFORMANCE = {
  maxNodes: 120,
  maxEdges: 240,
} as const;
