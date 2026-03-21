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
      intensity: 0.8,  // Increased from 0.55
      color: '#ffffff',
    },
    directional: {
      intensity: 1.5,  // Increased from 1.2
      color: '#ffffff',
      position: [8, 14, 10] as [number, number, number],
    },
    point: {
      intensity: 2.0,  // Increased from 1.6
      color: '#3b82f6',
      position: [-10, 4, 12] as [number, number, number],
    },
  },
  grid: {
    size: 100,
    divisions: 20,
    colorCenterLine: '#334155',
    colorGrid: '#1e293b',
  },
  fog: {
    color: '#0b0f19',
    density: 0.04,
  },
  background: '#0b0f19',
} as const;

export const NODE_CONFIG = {
  baseSize: 1.2,  // Increased from 0.58 - MUCH BIGGER
  hoverScale: 1.3,
  selectedScale: 1.5,
  segments: 12,  // Increased from 7 - smoother spheres
  metalness: 0.3,
  roughness: 0.4,
  emissiveIntensity: 0.4,  // Increased from 0.18 - brighter glow
} as const;

export const EDGE_CONFIG = {
  baseColor: '#4b5563',  // Lighter gray
  activeColor: '#60a5fa',
  opacity: 0.5,  // Increased from 0.34 - more visible
} as const;

export const NODE_COLORS: Record<NodeType, string> = {
  service: '#10b981',      // green
  library: '#60a5fa',      // blue
  repository: '#a78bfa',   // purple
  database: '#f59e0b',     // amber
  api: '#22d3ee',          // cyan
  server: '#94a3b8',       // slate
  ip: '#fb7185',           // pink
  threat: '#ef4444',       // red
  vulnerability: '#f97316', // orange
};

export const PERFORMANCE = {
  maxNodes: 120,
  maxEdges: 240,
} as const;
