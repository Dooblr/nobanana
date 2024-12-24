import { useRef } from 'react'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'

interface PlayerProps {
  position: Vector3
  rotation: number // Y-axis rotation in radians
  movementSpeed: number
}

export function Player({ position, rotation, movementSpeed }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Update position based on player input (you can add input handling here)
    const forward = new Vector3(-Math.sin(rotation), 0, -Math.cos(rotation))
    meshRef.current.position.add(forward.multiplyScalar(movementSpeed * delta))
  })

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Player model - tetrahedron */}
      <mesh ref={meshRef} castShadow>
        <tetrahedronGeometry args={[0.5]} />
        <meshStandardMaterial 
          color="#44aaff"
          emissive="#2244ff"
          emissiveIntensity={0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Player light positioned above the player */}
      <pointLight
        position={[0, 2, 0]} // Adjust the Y position to be above the player
        color="#ffffff"
        intensity={1.5}
        distance={10}
        decay={2}
      />
    </group>
  )
} 