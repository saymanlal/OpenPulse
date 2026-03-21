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
  baseSize: 0.6,  // Much smaller
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
  dependencyColor: '#10b981',  // Green for normal deps
  devDependencyColor: '#f59e0b',  // Amber for dev deps
  criticalColor: '#ef4444',  // Red for critical path
  opacity: 0.8,
  selectedOpacity: 1.0,
} as const;

export const NODE_COLORS: Record<NodeType, string> = {
  service: '#10b981',      // Emerald green
  library: '#3b82f6',      // Blue
  repository: '#a78bfa',   // Purple
  database: '#f59e0b',     // Amber
  api: '#06b6d4',          // Cyan
  server: '#64748b',       // Slate gray
  ip: '#ec4899',           // Pink
  threat: '#ef4444',       // Red
  vulnerability: '#f97316', // Orange
};

export const PERFORMANCE = {
  maxNodes: 120,
  maxEdges: 240,
  simulationStepInterval: 1 / 60,
  maxSimulationTicks: 0,
} as const;
