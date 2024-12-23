import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, Box } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { Vector3 } from 'three'
import './App.scss'
import * as THREE from 'three'

type Projectile = {
  id: number
  position: Vector3
  direction: Vector3
  createdAt: number
}

const PROJECTILE_SPEED = 30 // meters per second
const PROJECTILE_MAX_DISTANCE = 100 // meters
const PROJECTILE_LIFETIME = 10000 // milliseconds
const PLAYER_HEIGHT = 1.8 // meters
const MOVEMENT_SPEED = 5 // meters per second
const ROOM_SIZE = 20 // meters
const ROOM_HEIGHT = 8 // meters
const GRAVITY = 20 // meters per second squared
const JUMP_FORCE = 8 // meters per second
const GROUND_LEVEL = PLAYER_HEIGHT / 2 // Height where player is considered grounded

// Add texture creation
const wallTexture = new THREE.TextureLoader().load('/grid.png')
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
wallTexture.repeat.set(4, 2)

function ProjectileObject({ position, direction }: { position: Vector3, direction: Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.add(
      direction.clone().multiplyScalar(PROJECTILE_SPEED * delta)
    )
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05]} />
      <meshBasicMaterial color="#ff0" />
    </mesh>
  )
}

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial 
          color="#226"
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial 
          color="#114"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Walls */}
      {[
        { position: [0, ROOM_HEIGHT/2, ROOM_SIZE/2], rotation: [0, 0, 0] },
        { position: [0, ROOM_HEIGHT/2, -ROOM_SIZE/2], rotation: [0, Math.PI, 0] },
        { position: [ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, -Math.PI/2, 0] },
        { position: [-ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, Math.PI/2, 0] }
      ].map((wall, index) => (
        <mesh
          key={index}
          position={wall.position}
          rotation={wall.rotation}
          receiveShadow
        >
          <planeGeometry args={[ROOM_SIZE, ROOM_HEIGHT]} />
          <meshStandardMaterial
            color="#334"
            metalness={0.4}
            roughness={0.6}
            map={wallTexture}
          />
        </mesh>
      ))}

      {/* Accent lighting strips */}
      {[0, 90, 180, 270].map((rotation, index) => (
        <group key={index} rotation={[0, rotation * Math.PI/180, 0]}>
          <mesh position={[ROOM_SIZE/2 - 0.1, ROOM_HEIGHT - 0.5, 0]}>
            <boxGeometry args={[0.1, 0.1, ROOM_SIZE]} />
            <meshBasicMaterial color="#55f" />
          </mesh>
          <pointLight
            position={[ROOM_SIZE/2 - 0.2, ROOM_HEIGHT - 0.5, 0]}
            intensity={0.5}
            distance={10}
            color="#44f"
          />
        </group>
      ))}

      {/* Central light */}
      <pointLight
        position={[0, ROOM_HEIGHT - 1, 0]}
        intensity={0.8}
        distance={ROOM_SIZE * 1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  )
}

function App() {
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [projectileId, setProjectileId] = useState(0)
  const controlsRef = useRef<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const playerPos = useRef(new Vector3(0, 2, 5))
  const velocity = useRef(new Vector3())
  const verticalVelocity = useRef(0)
  const isGrounded = useRef(true)

  const clampPosition = (position: Vector3) => {
    const halfRoom = ROOM_SIZE / 2 - 0.5 // 0.5 margin to prevent touching walls
    position.x = Math.max(-halfRoom, Math.min(halfRoom, position.x))
    position.z = Math.max(-halfRoom, Math.min(halfRoom, position.z))
    position.y = Math.max(0.1, Math.min(ROOM_HEIGHT - 0.1, position.y)) // Keep within floor and ceiling
    return position
  }

  useEffect(() => {
    const handleMovement = (e: KeyboardEvent) => {
      if (!isLocked) return
      const speed = MOVEMENT_SPEED * 0.016 // Approximate for 60fps
      
      switch(e.code) {
        case 'KeyW':
          velocity.current.z = -speed
          break
        case 'KeyS':
          velocity.current.z = speed
          break
        case 'KeyA':
          velocity.current.x = -speed
          break
        case 'KeyD':
          velocity.current.x = speed
          break
        case 'Space':
          if (isGrounded.current) {
            verticalVelocity.current = JUMP_FORCE
            isGrounded.current = false
          }
          break
      }
    }

    const handleMovementStop = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW':
        case 'KeyS':
          velocity.current.z = 0
          break
        case 'KeyA':
        case 'KeyD':
          velocity.current.x = 0
          break
        case 'KeyQ':
        case 'KeyE':
          velocity.current.y = 0
          break
      }
    }

    window.addEventListener('keydown', handleMovement)
    window.addEventListener('keyup', handleMovementStop)
    return () => {
      window.removeEventListener('keydown', handleMovement)
      window.removeEventListener('keyup', handleMovementStop)
    }
  }, [isLocked])

  useEffect(() => {
    const handleClick = () => {
      if (!isLocked || !controlsRef.current) return
      
      const direction = new Vector3()
      controlsRef.current.getDirection(direction)
      
      // Offset projectile start position to be at "gun" level
      const position = playerPos.current.clone()
      position.y -= 0.2 // Slightly below eye level

      setProjectiles(prev => [...prev, {
        id: projectileId,
        position,
        direction: direction.normalize(), // Ensure normalized for consistent speed
        createdAt: performance.now()
      }])
      setProjectileId(prev => prev + 1)
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [isLocked, projectileId])

  // Update projectile positions and handle cleanup
  useEffect(() => {
    let lastTime = performance.now()
    
    const updateProjectiles = () => {
      const currentTime = performance.now()
      lastTime = currentTime

      setProjectiles(prev => prev.filter(projectile => {
        // Remove if too old
        if (currentTime - projectile.createdAt > PROJECTILE_LIFETIME) return false
        
        // Remove if too far
        const distance = projectile.position.distanceTo(playerPos.current)
        if (distance > PROJECTILE_MAX_DISTANCE) return false
        
        return true
      }))

      requestAnimationFrame(updateProjectiles)
    }

    const animationFrame = requestAnimationFrame(updateProjectiles)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  // Update player position with proper camera-relative movement
  useEffect(() => {
    let lastTime = performance.now()

    const updateLoop = () => {
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000 // Convert to seconds
      lastTime = currentTime

      if (isLocked && controlsRef.current) {
        const camera = controlsRef.current.getObject()
        
        // Apply gravity
        verticalVelocity.current -= GRAVITY * deltaTime
        
        // Get camera direction
        const cameraDirection = new Vector3()
        camera.getWorldDirection(cameraDirection)
        
        // Calculate forward and right vectors
        const forward = cameraDirection.clone()
        forward.y = 0
        forward.normalize()
        
        const right = new Vector3()
        right.crossVectors(forward, new Vector3(0, 1, 0))
        
        // Create movement vector
        const movement = new Vector3()
        
        // Add forward/backward movement
        if (velocity.current.z !== 0) {
          movement.add(forward.multiplyScalar(-velocity.current.z))
        }
        
        // Add left/right movement
        if (velocity.current.x !== 0) {
          movement.add(right.multiplyScalar(velocity.current.x))
        }
        
        // Add vertical movement from gravity and jumping
        movement.y = verticalVelocity.current * deltaTime

        // Apply movement with clamping
        const newPosition = playerPos.current.clone().add(movement)
        playerPos.current.copy(clampPosition(newPosition))

        // Check if grounded after movement
        if (playerPos.current.y <= GROUND_LEVEL) {
          playerPos.current.y = GROUND_LEVEL
          verticalVelocity.current = 0
          isGrounded.current = true
        }

        camera.position.copy(playerPos.current)
      }
      requestAnimationFrame(updateLoop)
    }
    updateLoop()
  }, [isLocked])

  return (
    <div className="game-container">
      <Canvas 
        camera={{ fov: 75 }}
        shadows
      >
        <color attach="background" args={['#000420']} />
        <fog attach="fog" args={['#000420', 5, ROOM_SIZE]} />
        
        <PointerLockControls 
          ref={controlsRef}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />
        
        <ambientLight intensity={0.2} />
        
        <Room />

        {/* Projectiles */}
        {projectiles.map(projectile => (
          <ProjectileObject
            key={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
          />
        ))}
      </Canvas>

      {/* Crosshair */}
      {isLocked && (
        <div className="crosshair" />
      )}

      {!isLocked && (
        <div className="start-prompt">
          Click to play
        </div>
      )}
    </div>
  )
}

export default App
