import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface ProjectileProps {
  position: Vector3;
  direction: Vector3;
  onHit: (position: Vector3) => void;
}

export function Projectile({ position, direction, onHit }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Move the projectile
    const movement = direction.clone().multiplyScalar(PROJECTILE_SPEED * delta);
    meshRef.current.position.add(movement);

    // Check for collisions with enemies (you can pass enemies as props)
    // Example collision detection logic
    // if (collisionDetected) {
    //   onHit(meshRef.current.position);
    // }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[PROJECTILE_RADIUS]} />
      <meshBasicMaterial color="#ff0" />
    </mesh>
  );
} 