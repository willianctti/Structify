import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from '@/components/UserMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
        <nav className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/dashboard" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded flex items-center justify-center">
                    <span className="text-white dark:text-neutral-900 text-lg font-light">S</span>
                  </div>
                  <span className="text-neutral-900 dark:text-white text-lg font-light tracking-tight">
                    Structify<span className="text-neutral-400 dark:text-neutral-500">3D</span>
                  </span>
                </a>
              </div>

              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                <a 
                  href="/dashboard" 
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-3 py-2 text-sm font-light transition-colors"
                >
                  Projetos
                </a>
                <a 
                  href="/dashboard/templates" 
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-3 py-2 text-sm font-light transition-colors"
                >
                  Templates
                </a>
                <a 
                  href="/dashboard/settings" 
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-3 py-2 text-sm font-light transition-colors"
                >
                  Configurações
                </a>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-light">
                © 2024 Structify3D. Todos os direitos reservados.
              </div>
              <div className="flex space-x-6">
                <a href="/terms" className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 text-sm font-light transition-colors">
                  Termos
                </a>
                <a href="/privacy" className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 text-sm font-light transition-colors">
                  Privacidade
                </a>
                <a href="/contact" className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 text-sm font-light transition-colors">
                  Contato
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}