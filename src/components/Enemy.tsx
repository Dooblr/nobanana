import { useRef } from 'react'
import { Vector3 } from 'three'

interface EnemyProps {
  position: Vector3
  lastHitTime?: number // Track when enemy was last hit
}

export function EnemyObject({ position, lastHitTime }: EnemyProps) {
  const isFlashing = lastHitTime && performance.now() - lastHitTime < ENEMY_FLASH_DURATION;

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE]} />
        <meshStandardMaterial 
          color={isFlashing ? '#ffffff' : '#ff4444'} 
          emissive={isFlashing ? '#ffffff' : '#ff0000'}
          emissiveIntensity={isFlashing ? 0.8 : 0.3} 
        />
      </mesh>

      {/* Enemy point light */}
      <pointLight
        color="#ff4444"
        intensity={ENEMY_LIGHT_INTENSITY}
        distance={4}
        decay={2}
      />
    </group>
  );
} 