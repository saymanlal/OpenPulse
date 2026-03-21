import type { NodeType } from '@/types/graph';

export const SCENE_CONFIG = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    initialPosition: [0, 25, 50] as [number, number, number],
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    rotateSpeed: 0.6,
    zoomSpeed: 1.0,
    minDistance: 15,
    maxDistance: 120,
    maxPolarAngle: Math.PI * 0.85,
  },
  lighting: {
    ambient: {
      intensity: 1.8,
      color: '#ffffff',
    },
    directional: {
      intensity: 2.5,
      color: '#ffffff',
      position: [30, 40, 30] as [number, number, number],
    },
    point: {
      intensity: 2.0,
      color: '#8b5cf6',
      position: [0, 25, 0] as [number, number, number],
    },
  },
  grid: {
    size: 150,
    divisions: 30,
    colorCenterLine: '#64748b',
    colorGrid: '#475569',
  },
  fog: {
    color: '#0f172a',
    density: 0.015,
  },
  background: '#0f172a',
} as const;

export const NODE_CONFIG = {
  baseSize: 0.6,
  hoverScale: 1.5,
  selectedScale: 1.8,
  segments: 16,
  metalness: 0.5,
  roughness: 0.2,
  emissiveIntensity: 0.8,
} as const;

export const EDGE_CONFIG = {
  baseColor: '#94a3b8',
  selectedColor: '#3b82f6',
  hoveredColor: '#60a5fa',
  dependencyColor: '#10b981',
  devDependencyColor: '#f59e0b',
  criticalColor: '#ef4444',
  opacity: 0.8,
  selectedOpacity: 1.0,
} as const;

// Vibrant distinct colors — matches screenshot palette
export const NODE_COLORS: Record<NodeType, string> = {
  service:       '#22d3ee',   // bright cyan
  library:       '#a78bfa',   // violet
  repository:    '#f472b6',   // pink
  database:      '#fbbf24',   // amber
  api:           '#34d399',   // emerald
  server:        '#60a5fa',   // blue
  ip:            '#fb923c',   // orange
  threat:        '#f87171',   // red/coral
  vulnerability: '#e879f9',   // fuchsia
};

// Emissive glow per type (darker variant)
export const NODE_EMISSIVE: Record<NodeType, string> = {
  service:       '#164e63',
  library:       '#4c1d95',
  repository:    '#831843',
  database:      '#78350f',
  api:           '#064e3b',
  server:        '#1e3a8a',
  ip:            '#7c2d12',
  threat:        '#7f1d1d',
  vulnerability: '#701a75',
};

export const PERFORMANCE = {
  maxNodes: 120,
  maxEdges: 240,
  simulationStepInterval: 1 / 60,
  maxSimulationTicks: 0,
} as const;