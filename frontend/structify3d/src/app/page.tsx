'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/auth/register')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-50">
      <div className="w-16 h-16 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
    </div>
  )
}
