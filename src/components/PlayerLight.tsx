import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';

const PlayerLight = ({ playerPos }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.set(playerPos.current.x, playerPos.current.y + 2, playerPos.current.z);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color="#ffffff"
      intensity={1.5}
      distance={10}
      decay={2}
    />
  );
};

export default PlayerLight; 