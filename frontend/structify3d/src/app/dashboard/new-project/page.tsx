'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function NewProjectPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ name: projectName }),
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar projeto')
      }

      const data = await response.json()
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-8 group transition-colors"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-light">Voltar</span>
          </button>
          
          <h1 className="text-4xl font-light text-neutral-800 dark:text-neutral-100 mb-2">
            Novo Projeto
          </h1>
          <div className="h-1 w-24 bg-neutral-800 dark:bg-neutral-100 mb-6" />
          <p className="text-neutral-600 dark:text-neutral-400 font-light text-lg">
            Dê o primeiro passo para criar seu espaço ideal
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-8 border border-neutral-200 dark:border-neutral-700">
          <form onSubmit={handleCreateProject} className="space-y-8">
            <div>
              <label 
                htmlFor="projectName" 
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Nome do Projeto
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
                         focus:ring-2 focus:ring-neutral-800 dark:focus:ring-neutral-400 
                         focus:border-transparent outline-none transition-all
                         placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                placeholder="Ex: Casa de Praia"
                required
              />
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 font-light">
                Escolha um nome que identifique facilmente seu projeto
              </p>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 
                         hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg
                         text-sm font-medium hover:bg-neutral-900 dark:hover:bg-neutral-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-neutral-800 dark:focus:ring-neutral-400
                         transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                    <span>Criando...</span>
                  </div>
                ) : (
                  'Criar Projeto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}