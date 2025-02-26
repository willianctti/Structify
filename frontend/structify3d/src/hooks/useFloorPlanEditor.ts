'use client'

import { RefObject, useEffect, useRef, useState, useCallback } from 'react'

interface Point {
  x: number
  y: number
}

interface Wall {
  start: Point
  end: Point
}

interface Door {
  position: Point
  rotation: number
  width: number
  direction: 'inside' | 'outside'
}

interface Window {
  position: Point
  rotation: number
  width: number
}

type Tool = 'wall' | 'door' | 'window' | 'select'

const SNAP_DISTANCE = 15    

export function useFloorPlanEditor(canvasRef: RefObject<HTMLCanvasElement>) {
  const [selectedTool, setSelectedTool] = useState<Tool>('wall')
  const [walls, setWalls] = useState<Wall[]>([])
  const [doors, setDoors] = useState<Door[]>([])
  const [windows, setWindows] = useState<Window[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const startPointRef = useRef<Point | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [snapPoint, setSnapPoint] = useState<Point | null>(null)

  const findSnapPoint = useCallback((currentPoint: Point): Point => {
    let bestPoint: Point = { ...currentPoint }
    let minDistance = SNAP_DISTANCE

    walls.forEach(wall => {
      [wall.start, wall.end].forEach(point => {
        const dx = point.x - currentPoint.x
        const dy = point.y - currentPoint.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < minDistance) {
          minDistance = distance
          bestPoint = { ...point }
        }
      })
    })

    return bestPoint
  }, [walls])

  const findWallSnap = useCallback((point: Point): { 
    wall: Wall | null
    point: Point | null
    rotation: number 
  } => {
    let closestWall: Wall | null = null
    let closestPoint: Point | null = null
    let minDistance = SNAP_DISTANCE
    let wallRotation = 0

    walls.forEach(wall => {
      const wallVector = {
        x: wall.end.x - wall.start.x,
        y: wall.end.y - wall.start.y
      }
      
      const wallLength = Math.sqrt(wallVector.x * wallVector.x + wallVector.y * wallVector.y)
      
      if (wallLength === 0) return 
      
      const wallNormal = {
        x: wallVector.x / wallLength,
        y: wallVector.y / wallLength
      }
      
      const pointVector = {
        x: point.x - wall.start.x,
        y: point.y - wall.start.y
      }
      
      const projection = (pointVector.x * wallNormal.x + pointVector.y * wallNormal.y)
      
      const projectedPoint: Point = {
        x: wall.start.x + wallNormal.x * projection,
        y: wall.start.y + wallNormal.y * projection
      }
      
      const distance = Math.sqrt(
        Math.pow(point.x - projectedPoint.x, 2) + 
        Math.pow(point.y - projectedPoint.y, 2)
      )

      const buffer = 20
      if (
        projection >= -buffer && 
        projection <= wallLength + buffer && 
        distance < minDistance
      ) {
        minDistance = distance
        closestWall = wall
        closestPoint = projectedPoint
        wallRotation = Math.atan2(wallVector.y, wallVector.x)
      }
    })

    return { 
      wall: closestWall, 
      point: closestPoint, 
      rotation: wallRotation 
    }
  }, [walls])

  const drawAll = useCallback(() => {
    const context = contextRef.current
    const canvas = canvasRef.current
    if (!context || !canvas) return

    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()

    walls.forEach(wall => {
      context.beginPath()
      context.moveTo(wall.start.x, wall.start.y)
      context.lineTo(wall.end.x, wall.end.y)
      context.lineWidth = 2
      context.strokeStyle = '#000000'
      context.stroke()
    })

    doors.forEach(door => {
      context.beginPath()
      context.arc(door.position.x, door.position.y, 5, 0, Math.PI * 2)
      context.fillStyle = '#4CAF50'
      context.fill()

      const radius = 15
      const startAngle = door.rotation + (door.direction === 'inside' ? 0 : Math.PI)
      const endAngle = startAngle + Math.PI
      
      context.beginPath()
      context.arc(door.position.x, door.position.y, radius, startAngle, endAngle)
      context.strokeStyle = '#4CAF50'
      context.lineWidth = 2
      context.stroke()
    })

    windows.forEach(window => {
      const size = 10
      context.save()
      context.translate(window.position.x, window.position.y)
      context.rotate(window.rotation)
      
      context.beginPath()
      context.rect(-size/2, -size/2, size, size)
      context.fillStyle = '#2196F3'
      context.fill()
      
      context.beginPath()
      context.moveTo(-size/2, 0)
      context.lineTo(size/2, 0)
      context.moveTo(0, -size/2)
      context.lineTo(0, size/2)
      context.strokeStyle = '#ffffff'
      context.lineWidth = 1
      context.stroke()
      
      context.restore()
    })

    if (snapPoint) {
      context.beginPath()
      context.arc(snapPoint.x, snapPoint.y, 5, 0, Math.PI * 2)
      context.fillStyle = '#ff0000'
      context.fill()
    }
  }, [walls, doors, windows, snapPoint, canvasRef])

  const handleDoorClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedDoorIndex = doors.findIndex(door => {
      const dx = door.position.x - x
      const dy = door.position.y - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < 20
    })

    if (clickedDoorIndex !== -1) {
      setDoors(prevDoors => prevDoors.map((door, index) => {
        if (index === clickedDoorIndex) {
          return {
            ...door,
            direction: door.direction === 'inside' ? 'outside' : 'inside'
          }
        }
        return door
      }))
    }
  }, [doors, canvasRef])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    if (selectedTool === 'select') {
      handleDoorClick(e)
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width/2
    const y = e.clientY - rect.top - rect.height/2

    setIsDrawing(true)

    if (selectedTool === 'wall') {
      startPointRef.current = { x, y }
    } else if (selectedTool === 'door' || selectedTool === 'window') {
      const { point, rotation } = findWallSnap({ x, y })
      
      if (point) {
        if (selectedTool === 'door') {
          setDoors(prevDoors => [...prevDoors, {
            position: point,
            rotation: rotation,
            width: 40,
            direction: 'inside'
          }])
        } else {
          setWindows(prevWindows => [...prevWindows, {
            position: point,
            rotation: rotation,
            width: 40
          }])
        }
      }
    }
  }, [selectedTool, findWallSnap, handleDoorClick, canvasRef])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width/2
    const y = e.clientY - rect.top - rect.height/2
    const currentPoint = { x, y }

    if (selectedTool === 'door' || selectedTool === 'window') {
      const { point } = findWallSnap(currentPoint)
      if (point) {
        drawAll()
        const context = contextRef.current
        if (context) {
          context.beginPath()
          context.arc(point.x, point.y, 5, 0, Math.PI * 2)
          context.fillStyle = '#4CAF50'
          context.fill()
        }
      }
    }

    const newSnapPoint = findSnapPoint(currentPoint)
    setSnapPoint(newSnapPoint)

    if (!isDrawing || !startPointRef.current) return

    drawAll()

    const context = contextRef.current
    if (context) {
      context.beginPath()
      context.moveTo(startPointRef.current.x, startPointRef.current.y)
      context.lineTo(newSnapPoint.x, newSnapPoint.y)
      context.stroke()
    }
  }, [selectedTool, isDrawing, findWallSnap, findSnapPoint, drawAll, canvasRef])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPointRef.current || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentPoint: Point = {
      x: e.clientX - rect.left - rect.width/2,
      y: e.clientY - rect.top - rect.height/2
    }

    const endPoint: Point = snapPoint || currentPoint

    if (
      isNaN(startPointRef.current.x) || 
      isNaN(startPointRef.current.y) || 
      isNaN(endPoint.x) || 
      isNaN(endPoint.y)
    ) {
      console.error('Coordenadas inválidas detectadas')
      setIsDrawing(false)
      startPointRef.current = null
      setSnapPoint(null)
      return
    }

    const dx = endPoint.x - startPointRef.current.x
    const dy = endPoint.y - startPointRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 5) {
      const newWall: Wall = {
        start: { 
          x: startPointRef.current.x,
          y: startPointRef.current.y
        },
        end: { 
          x: endPoint.x,
          y: endPoint.y
        }
      }

      if (
        Object.values(newWall.start).every(v => !isNaN(v)) && 
        Object.values(newWall.end).every(v => !isNaN(v))
      ) {
        setWalls(prev => [...prev, newWall])
      } else {
        console.error('Tentativa de criar parede com coordenadas inválidas')
      }
    }

    setIsDrawing(false)
    startPointRef.current = null
    setSnapPoint(null)
    drawAll()
  }, [isDrawing, snapPoint, drawAll, canvasRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return

      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      
      const context = canvas.getContext('2d')
      if (!context) return

      context.translate(canvas.width / 2, canvas.height / 2)
      
      context.strokeStyle = '#000000'
      context.lineWidth = 2
      contextRef.current = context
      drawAll()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawAll, canvasRef])

  return {
    selectedTool,
    setSelectedTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    walls,
    doors,
    windows,
    setWalls,
    setDoors,
    setWindows
  }
}