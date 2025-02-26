'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, useGLTF, useTexture } from '@react-three/drei'
import { useEffect, useMemo, Suspense, useState } from 'react'
import * as THREE from 'three'

type Props = {
  walls: Array<{
    start: { x: number, y: number }
    end: { x: number, y: number }
  }>
  doors: Array<{
    position: { x: number, y: number }
    rotation: number
    width: number
    direction: 'inside' | 'outside'
  }>
  windows: Array<{
    position: { x: number, y: number }
    rotation: number
    width: number
  }>
}

function DoorModel({ 
  position, 
  rotation, 
  direction 
}: { 
  position: [number, number, number]
  rotation: number
  direction: 'inside' | 'outside'
}) {
  const { scene } = useGLTF('/models/furniture/door.glb')
  
  const doorRotation = direction === 'inside' 
    ? rotation + Math.PI / 2 
    : rotation - Math.PI / 2

  return (
    <primitive 
      object={scene} 
      position={[position[0], 0.7, position[2]]}
      rotation={[0, doorRotation, 0]}
      scale={0.006}
    />
  )
}

function WindowModel({ position, rotation }: { position: [number, number, number], rotation: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[1, 1.2, 0.1]} />
      <meshStandardMaterial color="#a8c8ff" transparent opacity={0.5} />
    </mesh>
  )
}

function Doors({ doors }: { doors: Props['doors'] }) {
  return (
    <>
      {doors.map((door, index) => (
        <Suspense key={index} fallback={null}>
          <DoorModel 
            position={[
              door.position.x / 50, 
              0,
              door.position.y / 50
            ]}
            rotation={door.rotation}
            direction={door.direction}
          />
        </Suspense>
      ))}
    </>
  )
}

function Windows({ windows }: { windows: Props['windows'] }) {
  return (
    <>
      {windows.map((window, index) => (
        <Suspense key={index} fallback={null}>
          <WindowModel
            position={[window.position.x / 50, 1.25, window.position.y / 50]}
            rotation={window.rotation}
          />
        </Suspense>
      ))}
    </>
  )
}

function Walls({ walls }: { walls: Props['walls'] }) {
  const wallGeometries = useMemo(() => {
    return walls.map((wall) => {
      const start = new THREE.Vector3(wall.start.x / 50, 0, wall.start.y / 50)
      const end = new THREE.Vector3(wall.end.x / 50, 0, wall.end.y / 50)
      
      const direction = end.clone().sub(start)
      const length = direction.length()
      
      const geometry = new THREE.BoxGeometry(length, 2.5, 0.1)
      
      const angle = Math.atan2(direction.z, direction.x)
      
      const center = start.clone().add(direction.multiplyScalar(0.5))
      
      return {
        geometry,
        position: center,
        rotation: angle
      }
    })
  }, [walls])

  return (
    <>
      {wallGeometries.map((wall, index) => (
        <mesh
          key={index}
          position={[wall.position.x, 1.25, wall.position.z]}
          rotation={[0, wall.rotation, 0]}
        >
          <boxGeometry args={[wall.geometry.parameters.width, 2.5, 0.1]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}
    </>
  )
}

function Floor() {
  return (
    <group>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#b08968"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      <gridHelper 
        args={[20, 20, "#999999", "#cccccc"]}
        position={[0, 0.001, 0]}
        material-opacity={0.15}
        material-transparent={true}
      />
    </group>
  )
}

export default function FloorPlan3DViewer({ walls, doors, windows }: Props) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [10, 10, 10],
          fov: 45
        }}
        shadows
      >
        <color attach="background" args={['#f8f9fa']} />
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
        />
        <hemisphereLight 
          intensity={0.5} 
        />

        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={true}
          minDistance={2}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          enablePan={true}
          panSpeed={1.5}
          rotateSpeed={0.8}
          zoomSpeed={1.2}
        />
        
        <Floor />
        <Walls walls={walls} />
        <Doors doors={doors} />
        <Windows windows={windows} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/floor/wooden_floor.glb')