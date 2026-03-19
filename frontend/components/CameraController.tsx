import { OrbitControls } from '@react-three/drei';

import { SCENE_CONFIG } from '@/lib/constants';

export default function CameraController() {
  return (
    <OrbitControls
      enableDamping={SCENE_CONFIG.controls.enableDamping}
      dampingFactor={SCENE_CONFIG.controls.dampingFactor}
      rotateSpeed={SCENE_CONFIG.controls.rotateSpeed}
      zoomSpeed={SCENE_CONFIG.controls.zoomSpeed}
      minDistance={SCENE_CONFIG.controls.minDistance}
      maxDistance={SCENE_CONFIG.controls.maxDistance}
      maxPolarAngle={SCENE_CONFIG.controls.maxPolarAngle}
      makeDefault
    />
  );
}
