'use client'

import { RefObject, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useFloorPlanEditor } from '@/hooks/useFloorPlanEditor'
import FloorPlan3DViewer from '@/components/FloorPlan3DViewer'
import { ArrowLeft, Ruler, DoorOpen, AppWindow, MousePointer2, Save } from 'lucide-react'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://structify3d-backend.willianctti.workers.dev'

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
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-2 transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {loading ? 'Carregando...' : projectName}
              </span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="px-4 py-2 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg 
                         hover:bg-neutral-900 dark:hover:bg-neutral-600 
                         flex items-center space-x-2 transition-colors"
              onClick={handleSave}
              disabled={loading}
            >
              <Save size={20} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg h-full flex overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="w-20 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 p-3 flex flex-col items-center space-y-4">
            <button 
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                selectedTool === 'select' 
                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              onClick={() => setSelectedTool('select')}
              title="Selecionar"
            >
              <MousePointer2 size={24} />
            </button>
            
            <button 
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                selectedTool === 'wall' 
                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              onClick={() => setSelectedTool('wall')}
              title="Desenhar parede"
            >
              <Ruler size={24} />
            </button>
            
            <button 
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                selectedTool === 'door' 
                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              onClick={() => setSelectedTool('door')}
              title="Adicionar porta"
            >
              <DoorOpen size={24} />
            </button>
            
            <button 
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                selectedTool === 'window' 
                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              onClick={() => setSelectedTool('window')}
              title="Adicionar janela"
            >
              <AppWindow size={24} />
            </button>
          </div>

          <div className="flex-1 flex">
            <div className="w-1/2 p-4 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-inner h-full">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-lg cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
              </div>
            </div>

            <div className="w-1/2 p-4 bg-neutral-100 dark:bg-neutral-900">
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