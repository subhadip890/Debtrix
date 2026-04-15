import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'

function WireframeGeometry() {
  const meshRef = useRef()

  // Slowly rotate the mesh
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.05
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[5.5, 1]} />
      <meshStandardMaterial
        color="#d98a5e"
        wireframe={true}
        transparent={true}
        opacity={0.15}
        emissive="#fcb086"
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

function FloatingRing() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.08
      meshRef.current.rotation.y = clock.getElapsedTime() * -0.05
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[9, 0.02, 16, 100]} />
      <meshBasicMaterial color="#d98a5e" transparent={true} opacity={0.15} />
    </mesh>
  )
}

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        background: '#000000',
        pointerEvents: 'none',
      }}
    >
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <fog attach="fog" args={['#000000', 10, 30]} />
        <ambientLight intensity={0.5} />
        
        <Stars 
          radius={50} 
          depth={50} 
          count={800} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5} 
        />
        
        <WireframeGeometry />
        <FloatingRing />
      </Canvas>
    </div>
  )
}
