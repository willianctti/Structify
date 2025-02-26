'use client'

export function UserMenu() {
  return (
    <div className="relative group">
      <button className="flex items-center space-x-3 focus:outline-none">
        <div className="w-8 h-8 bg-neutral-200 rounded-full overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm font-medium">
            U
          </div>
        </div>
        <svg 
          className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-lg border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <a 
          href="/dashboard/profile" 
          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Perfil
        </a>
        <a 
          href="/dashboard/settings" 
          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Configurações
        </a>
        <div className="h-px bg-neutral-200 my-2"></div>
        <button 
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/auth/login'
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  )
}