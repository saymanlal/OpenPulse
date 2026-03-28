import type { NodeType } from '@/types/graph';

export const SCENE_CONFIG = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 2000,
    initialPosition: [0, 25, 50] as [number, number, number],
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    rotateSpeed: 0.6,
    zoomSpeed: 1.0,
    minDistance: 15,
    maxDistance: 300,
    maxPolarAngle: Math.PI * 0.85,
  },
  lighting: {
    ambient: {
      intensity: 2.2,
      color: '#ffffff',
    },
    directional: {
      intensity: 3.0,
      color: '#ffffff',
      position: [30, 40, 30] as [number, number, number],
    },
    point: {
      intensity: 2.5,
      color: '#8b5cf6',
      position: [0, 25, 0] as [number, number, number],
    },
  },
  grid: {
    size: 300,
    divisions: 40,
    colorCenterLine: '#334155',
    colorGrid: '#1e293b',
  },
  fog: {
    color: '#0f172a',
    density: 0.008,
  },
  background: '#0f172a',
} as const;

export const NODE_CONFIG = {
  baseSize: 1.0,
  hoverScale: 1.4,
  selectedScale: 1.7,
  segments: 16,
  metalness: 0.15,
  roughness: 0.25,
  emissiveIntensity: 0,
} as const;

export const EDGE_CONFIG = {
  baseColor: '#94a3b8',
  selectedColor: '#3b82f6',
  hoveredColor: '#60a5fa',
  dependencyColor: '#10b981',
  devDependencyColor: '#f59e0b',
  criticalColor: '#ef4444',
  opacity: 0.75,
  selectedOpacity: 1.0,
} as const;

export const NODE_COLORS: Record<NodeType, string> = {
  service:       '#22d3ee',
  library:       '#a78bfa',
  repository:    '#f472b6',
  database:      '#fbbf24',
  api:           '#34d399',
  server:        '#60a5fa',
  ip:            '#fb923c',
  threat:        '#f87171',
  vulnerability: '#e879f9',
};

export const ECOSYSTEM_COLORS: Record<string, string> = {
  npm:     '#f7df1e',
  python:  '#3b82f6',
  go:      '#00add8',
  rust:    '#f97316',
  unknown: '#94a3b8',
};

export const ECOSYSTEM_EMISSIVE: Record<string, string> = {
  npm:     '#3d3600',
  python:  '#0c1a3b',
  go:      '#00202a',
  rust:    '#2a1500',
  unknown: '#1e293b',
};

export const PERFORMANCE = {
  maxNodes: 500,
  maxEdges: 1000,
  simulationStepInterval: 1 / 60,
  maxSimulationTicks: 0,
} as const;