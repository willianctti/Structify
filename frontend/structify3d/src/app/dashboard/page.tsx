'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Ruler, Building2, Calendar } from 'lucide-react'

interface Project {
  id: number
  name: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch(`${API_URL}/projects`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        })

        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }

        if (!response.ok) {
          throw new Error('Erro ao carregar projetos')
        }

        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Erro ao carregar projetos:', error)
        setError('Não foi possível carregar seus projetos')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-light">Carregando seus projetos...</p>
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
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-neutral-800 dark:text-neutral-100 mb-2">Meus Projetos</h1>
          <div className="h-1 w-24 bg-neutral-800 dark:bg-neutral-100 mb-6" />
          <p className="text-neutral-600 dark:text-neutral-400 font-light text-lg">
            Transforme suas ideias em espaços extraordinários
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/new-project')}
          className="mb-12 group relative overflow-hidden bg-neutral-800 dark:bg-neutral-700 text-white px-8 py-4 rounded-md text-sm font-medium hover:bg-neutral-900 dark:hover:bg-neutral-600 transition-all duration-300"
        >
          <div className="flex items-center space-x-3">
            <Plus size={20} />
            <span>Novo Projeto</span>
          </div>
          <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        </button>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-12 text-center border border-neutral-100 dark:border-neutral-700">
            <Building2 size={48} className="mx-auto mb-4 text-neutral-400 dark:text-neutral-500" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 font-light text-lg">
              Comece sua jornada criando seu primeiro projeto
            </p>
            <button
              onClick={() => router.push('/dashboard/new-project')}
              className="bg-neutral-800 dark:bg-neutral-700 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-neutral-900 dark:hover:bg-neutral-600 transition-all duration-300"
            >
              Criar Primeiro Projeto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/project/${project.id}/editor`)}
                className="group bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-neutral-100 dark:border-neutral-700 hover:border-neutral-200 dark:hover:border-neutral-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <Ruler size={24} className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-300 transition-colors" />
                  <div className="flex items-center text-neutral-400 dark:text-neutral-500 text-sm">
                    <Calendar size={16} className="mr-2" />
                    {new Date(project.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <h3 className="text-xl font-light text-neutral-800 dark:text-neutral-100 mb-2 group-hover:text-neutral-900 dark:group-hover:text-white">
                  {project.name}
                </h3>
                <div className="h-1 w-12 bg-neutral-200 dark:bg-neutral-700 group-hover:bg-neutral-800 dark:group-hover:bg-neutral-300 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}