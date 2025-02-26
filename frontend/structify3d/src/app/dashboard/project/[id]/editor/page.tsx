'use client'

import { RefObject, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useFloorPlanEditor } from '@/hooks/useFloorPlanEditor'
import FloorPlan3DViewer from '@/components/FloorPlan3DViewer'
import { ArrowLeft, Ruler, DoorOpen, AppWindow, MousePointer2, Save, Eraser } from 'lucide-react'
import ImageAnalyzer from '@/components/ImageAnalyzer'
import { Wall } from '@/types/floorplan'
import { LucideIcon } from 'lucide-react'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://structify3d-backend.willianctti.workers.dev'

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}

function ToolButton({ icon: Icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors
        ${active ? 'bg-neutral-800 text-white dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
    >
      <Icon size={24} />
      <span className="text-xs">{label}</span>
    </button>
  )
}

export default function ProjectEditor({ params }: PageProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { id } = use(params)

  const {
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
  } = useFloorPlanEditor(canvasRef as RefObject<HTMLCanvasElement>)

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true)
        setError('')
        
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch(`${API_URL}/projects/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        })

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token')
            router.push('/auth/login')
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data) {
          setProjectName(data.name)
          setWalls(data.walls || [])
          setDoors(data.doors || [])
          setWindows(data.windows || [])
        } else {
          throw new Error('Dados do projeto inválidos')
        }
      } catch (error) {
        console.error('Erro ao carregar projeto:', error)
        setError('Erro ao carregar o projeto. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadProject()
    }
  }, [router, id, setWalls, setDoors, setWindows])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const projectData = {
        name: projectName,
        walls: walls,
        doors: doors,
        windows: windows
      }

      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(projectData),
        mode: 'cors'
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      alert('Projeto salvo com sucesso!')

    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      alert('Erro ao salvar o projeto. Tente novamente.')
    }
  }

  const handleWallsDetected = (detectedWalls: Wall[]) => {
    setWalls(prevWalls => [...prevWalls, ...detectedWalls])
  }

  const handleClearCanvas = () => {
    setWalls([])
    setDoors([])
    setWindows([])

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-light">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 overflow-y-auto">
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm h-14">
        <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span>{projectName}</span>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClearCanvas}
              className="btn-secondary flex items-center gap-2"
            >
              <Eraser size={20} />
              <span>Limpar</span>
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save size={20} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 max-w-[1400px] mx-auto">
          <div className="flex h-[600px]">
            <div className="w-20 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 p-3 flex flex-col items-center space-y-4">
              <ToolButton
                icon={MousePointer2}
                label="Selecionar"
                active={selectedTool === 'select'}
                onClick={() => setSelectedTool('select')}
              />
              <ToolButton
                icon={Ruler}
                label="Parede"
                active={selectedTool === 'wall'}
                onClick={() => setSelectedTool('wall')}
              />
              <ToolButton
                icon={DoorOpen}
                label="Porta"
                active={selectedTool === 'door'}
                onClick={() => setSelectedTool('door')}
              />
              <ToolButton
                icon={AppWindow}
                label="Janela"
                active={selectedTool === 'window'}
                onClick={() => setSelectedTool('window')}
              />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex flex-col h-full">
                <div className="h-[60px] border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                  <ImageAnalyzer onWallsDetected={handleWallsDetected} />
                </div>

                <div className="flex-1 relative bg-[#f5f5f5] dark:bg-neutral-950">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-[250px] border-t border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
            <div className="h-full p-2">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-inner h-full">
                <FloorPlan3DViewer
                  walls={walls}
                  doors={doors}
                  windows={windows}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}