export const SCENE_CONFIG = {
    camera: {
      fov: 75,
      near: 0.1,
      far: 1000,
      initialPosition: [0, 0, 50] as [number, number, number],
    },
    controls: {
      enableDamping: true,
      dampingFactor: 0.05,
      rotateSpeed: 0.5,
      zoomSpeed: 0.8,
      minDistance: 10,
      maxDistance: 200,
      maxPolarAngle: Math.PI,
    },
    lighting: {
      ambient: {
        intensity: 0.4,
        color: '#ffffff',
      },
      directional: {
        intensity: 0.8,
        color: '#ffffff',
        position: [10, 10, 5] as [number, number, number],
      },
      point: {
        intensity: 0.6,
        color: '#4f46e5',
        position: [0, 10, 0] as [number, number, number],
      },
    },
    grid: {
      size: 100,
      divisions: 20,
      colorCenterLine: '#444444',
      colorGrid: '#222222',
    },
    background: '#0a0a0a',
  } as const;
  
  export const PERFORMANCE = {
    targetFPS: 60,
    maxNodes: 1000,
    maxEdges: 2000,
  } as const;