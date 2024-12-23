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

type Enemy = {
  id: number
  position: Vector3
  health: number
  createdAt: number
}

type Particle = {
  id: number
  position: Vector3
  velocity: Vector3
  color: string
  scale: number
  lifetime: number
  createdAt: number
}

const PROJECTILE_SPEED = 30 // meters per second
const PROJECTILE_MAX_DISTANCE = 100 // meters
const PROJECTILE_LIFETIME = 10000 // milliseconds
const PLAYER_HEIGHT = 1.8 // meters
const MOVEMENT_SPEED = 8 // Increased base speed
const MOVEMENT_ACCELERATION = 20 // How quickly we reach max speed
const MOVEMENT_DECELERATION = 10 // How quickly we slow down
const ROOM_SIZE = 20 // meters
const ROOM_HEIGHT = 8 // meters
const GRAVITY = 20 // meters per second squared
const JUMP_FORCE = 8 // meters per second
const GROUND_LEVEL = PLAYER_HEIGHT / 2 // Height where player is considered grounded
const ENEMY_SPAWN_INTERVAL = 10000 // 10 seconds
const ENEMY_SPEED = 2 // meters per second
const ENEMY_SIZE = 0.5 // meters
const WALL_SEGMENTS = 16 // For more detailed wall geometry
const WALL_PANEL_SIZE = 2.5 // Size of each wall panel
const WALL_DEPTH = 0.2 // Depth of wall geometric detail
const PLAYER_RADIUS = 0.5 // Collision radius for the player
const PLAYER_MAX_HEALTH = 100
const PLAYER_INVULNERABILITY_TIME = 1000 // 1 second of invulnerability after being hit
const ENEMY_DAMAGE = 20
const KNOCKBACK_FORCE = 15 // Force applied when hit by enemy
const PARTICLE_COUNT = 15
const PARTICLE_LIFETIME = 1000 // milliseconds
const PARTICLE_SPEED = 5
const PARTICLE_COLORS = ['#ff0000', '#ff00ff', '#00ffff', '#ffff00', '#ff8800']

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

function EnemyObject({ position }: { position: Vector3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE]} />
      <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.3} />
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
          color="#2244ff"
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial 
          color="#1a1a3a"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Enhanced Walls */}
      {[
        { position: [0, ROOM_HEIGHT/2, ROOM_SIZE/2], rotation: [0, 0, 0] },
        { position: [0, ROOM_HEIGHT/2, -ROOM_SIZE/2], rotation: [0, Math.PI, 0] },
        { position: [ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, -Math.PI/2, 0] },
        { position: [-ROOM_SIZE/2, ROOM_HEIGHT/2, 0], rotation: [0, Math.PI/2, 0] }
      ].map((wall, index) => (
        <group key={index} position={wall.position} rotation={wall.rotation}>
          {/* Main wall surface */}
          <mesh receiveShadow castShadow>
            <planeGeometry args={[ROOM_SIZE, ROOM_HEIGHT, WALL_SEGMENTS, WALL_SEGMENTS]} />
            <meshStandardMaterial
              color="#334466"
              metalness={0.4}
              roughness={0.6}
              map={wallTexture}
              normalScale={[0.2, 0.2]}
              aoMapIntensity={0.5}
            />
          </mesh>

          {/* Wall panels for depth */}
          {Array.from({ length: Math.floor(ROOM_SIZE/WALL_PANEL_SIZE) }).map((_, i) =>
            Array.from({ length: Math.floor(ROOM_HEIGHT/WALL_PANEL_SIZE) }).map((_, j) => (
              <mesh
                key={`panel-${i}-${j}`}
                position={[
                  (i * WALL_PANEL_SIZE) - (ROOM_SIZE/2) + (WALL_PANEL_SIZE/2),
                  (j * WALL_PANEL_SIZE) - (ROOM_HEIGHT/2) + (WALL_PANEL_SIZE/2),
                  -WALL_DEPTH/2
                ]}
                castShadow
              >
                <boxGeometry args={[WALL_PANEL_SIZE * 0.95, WALL_PANEL_SIZE * 0.95, WALL_DEPTH]} />
                <meshStandardMaterial
                  color="#2a3855"
                  metalness={0.6}
                  roughness={0.3}
                />
              </mesh>
            ))
          )}
        </group>
      ))}

      {/* Enhanced accent lighting strips */}
      {[0, 90, 180, 270].map((rotation, index) => (
        <group key={index} rotation={[0, rotation * Math.PI/180, 0]}>
          <mesh position={[ROOM_SIZE/2 - 0.1, ROOM_HEIGHT - 0.5, 0]}>
            <boxGeometry args={[0.1, 0.1, ROOM_SIZE]} />
            <meshBasicMaterial color="#88aaff" />
          </mesh>
          <pointLight
            position={[ROOM_SIZE/2 - 0.2, ROOM_HEIGHT - 0.5, 0]}
            intensity={1.0}
            distance={15}
            color="#88aaff"
          />
        </group>
      ))}

      {/* Enhanced central light */}
      <pointLight
        position={[0, ROOM_HEIGHT - 1, 0]}
        intensity={1.2}
        distance={ROOM_SIZE * 2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Additional ambient light for better overall visibility */}
      <ambientLight intensity={0.4} />

      {/* Add some colored rim lights for atmosphere */}
      <pointLight
        position={[ROOM_SIZE/2, 1, ROOM_SIZE/2]}
        intensity={0.5}
        distance={8}
        color="#ff4444"
      />
      <pointLight
        position={[-ROOM_SIZE/2, 1, -ROOM_SIZE/2]}
        intensity={0.5}
        distance={8}
        color="#4444ff"
      />
    </group>
  )
}

function ExplosionParticle({ position, velocity, color, scale }: Particle) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.add(velocity.clone().multiplyScalar(delta))
    meshRef.current.rotation.x += delta * 5
    meshRef.current.rotation.y += delta * 5
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[scale, scale, scale]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

function App() {
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [projectileId, setProjectileId] = useState(0)
  const controlsRef = useRef<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const playerPos = useRef(new Vector3(0, 2, 5))
  const currentVelocity = useRef(new Vector3())
  const targetVelocity = useRef(new Vector3())
  const verticalVelocity = useRef(0)
  const isGrounded = useRef(true)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [enemyId, setEnemyId] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH)
  const lastHitTime = useRef(0)
  const knockbackVelocity = useRef(new Vector3())
  const [particles, setParticles] = useState<Particle[]>([])
  const particleId = useRef(0)

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
      const speed = MOVEMENT_SPEED
      
      switch(e.code) {
        case 'KeyW':
          targetVelocity.current.z = -speed
          break
        case 'KeyS':
          targetVelocity.current.z = speed
          break
        case 'KeyA':
          targetVelocity.current.x = -speed
          break
        case 'KeyD':
          targetVelocity.current.x = speed
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
          targetVelocity.current.z = 0
          break
        case 'KeyA':
        case 'KeyD':
          targetVelocity.current.x = 0
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

  // Add function to create explosion
  const createExplosion = (position: Vector3) => {
    const newParticles: Particle[] = []
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random direction
      const angle = (Math.random() * Math.PI * 2)
      const upwardBias = Math.random() * 0.5 + 0.5 // Bias upward
      const velocity = new Vector3(
        Math.cos(angle) * PARTICLE_SPEED,
        upwardBias * PARTICLE_SPEED,
        Math.sin(angle) * PARTICLE_SPEED
      )

      newParticles.push({
        id: particleId.current++,
        position: position.clone(),
        velocity,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        scale: Math.random() * 0.2 + 0.1,
        lifetime: PARTICLE_LIFETIME,
        createdAt: performance.now()
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }

  // Modify the projectile update effect to create explosions
  useEffect(() => {
    let lastTime = performance.now()
    
    const updateProjectiles = () => {
      const currentTime = performance.now()
      lastTime = currentTime

      setProjectiles(prev => prev.filter(projectile => {
        // Check for enemy hits
        let hitEnemy = false
        setEnemies(enemies => enemies.filter(enemy => {
          const distance = projectile.position.distanceTo(enemy.position)
          if (distance < ENEMY_SIZE) {
            hitEnemy = true
            createExplosion(enemy.position) // Create explosion at enemy position
            return false
          }
          return true
        }))

        if (hitEnemy) return false
        // Remove projectile if it hit something
        if (currentTime - projectile.createdAt > PROJECTILE_LIFETIME) return false
        
        // Remove if too far
        const distance = projectile.position.distanceTo(playerPos.current)
        if (distance > PROJECTILE_MAX_DISTANCE) return false
        
        return true
      }))

      // Update particles
      setParticles(prev => prev.filter(particle => {
        const age = currentTime - particle.createdAt
        return age < particle.lifetime
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
        
        // Smoothly interpolate current velocity towards target velocity
        currentVelocity.current.lerp(targetVelocity.current, MOVEMENT_ACCELERATION * deltaTime)
        
        // Apply deceleration when no input
        if (targetVelocity.current.x === 0) {
          currentVelocity.current.x *= Math.max(0, 1 - MOVEMENT_DECELERATION * deltaTime)
        }
        if (targetVelocity.current.z === 0) {
          currentVelocity.current.z *= Math.max(0, 1 - MOVEMENT_DECELERATION * deltaTime)
        }

        // Apply knockback deceleration
        knockbackVelocity.current.multiplyScalar(Math.max(0, 1 - MOVEMENT_DECELERATION * 2 * deltaTime))

        // Create movement vector
        const movement = new Vector3()
        
        // Add forward/backward movement
        if (currentVelocity.current.z !== 0) {
          movement.add(forward.multiplyScalar(-currentVelocity.current.z * deltaTime))
        }
        
        // Add left/right movement
        if (currentVelocity.current.x !== 0) {
          movement.add(right.multiplyScalar(currentVelocity.current.x * deltaTime))
        }
        
        // Add vertical movement from gravity and jumping
        movement.y = verticalVelocity.current * deltaTime

        // Add knockback movement
        movement.add(knockbackVelocity.current.clone().multiplyScalar(deltaTime))

        // Apply movement with clamping
        const newPosition = playerPos.current.clone().add(movement)
        playerPos.current.copy(clampPosition(newPosition))

        // Ground check
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

  // Add enemy spawning system
  useEffect(() => {
    const spawnEnemy = () => {
      // Random position along room edges
      const side = Math.floor(Math.random() * 4)
      const pos = new Vector3()
      const offset = ROOM_SIZE / 2 - 1

      switch(side) {
        case 0: pos.set(offset, GROUND_LEVEL, Math.random() * ROOM_SIZE - offset); break
        case 1: pos.set(-offset, GROUND_LEVEL, Math.random() * ROOM_SIZE - offset); break
        case 2: pos.set(Math.random() * ROOM_SIZE - offset, GROUND_LEVEL, offset); break
        case 3: pos.set(Math.random() * ROOM_SIZE - offset, GROUND_LEVEL, -offset); break
      }

      setEnemies(prev => [...prev, {
        id: enemyId,
        position: pos,
        health: 1,
        createdAt: performance.now()
      }])
      setEnemyId(prev => prev + 1)
    }

    const interval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL)
    return () => clearInterval(interval)
  }, [enemyId])

  // Update enemy positions and check for projectile hits
  useEffect(() => {
    let lastTime = performance.now()

    const updateEnemies = () => {
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      setEnemies(prev => prev.map(enemy => {
        // Move towards player
        const directionToPlayer = playerPos.current.clone().sub(enemy.position).normalize()
        const newPosition = enemy.position.clone().add(
          directionToPlayer.multiplyScalar(ENEMY_SPEED * deltaTime)
        )

        // Check collision with player
        const distanceToPlayer = newPosition.distanceTo(playerPos.current)
        if (distanceToPlayer < (PLAYER_RADIUS + ENEMY_SIZE/2)) {
          // Only apply damage if player is not in invulnerability period
          if (currentTime - lastHitTime.current > PLAYER_INVULNERABILITY_TIME) {
            setPlayerHealth(prev => Math.max(0, prev - ENEMY_DAMAGE))
            lastHitTime.current = currentTime

            // Apply knockback
            const knockbackDirection = playerPos.current.clone()
              .sub(enemy.position)
              .normalize()
              .multiplyScalar(KNOCKBACK_FORCE)
            knockbackVelocity.current.copy(knockbackDirection)
          }
        }

        return { ...enemy, position: newPosition }
      }))

      requestAnimationFrame(updateEnemies)
    }

    const animationFrame = requestAnimationFrame(updateEnemies)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <div className="game-container">
      <Canvas 
        camera={{ fov: 75 }}
        shadows
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputEncoding: THREE.sRGBEncoding
        }}
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

        {/* Enemies */}
        {enemies.map(enemy => (
          <EnemyObject
            key={enemy.id}
            position={enemy.position}
          />
        ))}

        {/* Projectiles */}
        {projectiles.map(projectile => (
          <ProjectileObject
            key={projectile.id}
            position={projectile.position}
            direction={projectile.direction}
          />
        ))}

        {/* Explosion Particles */}
        {particles.map(particle => (
          <ExplosionParticle key={particle.id} {...particle} />
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

      {/* Health Display */}
      {isLocked && (
        <div className="health-display">
          Health: {playerHealth}
        </div>
      )}
    </div>
  )
}

export default App
