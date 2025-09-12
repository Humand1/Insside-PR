import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '360° Performance Analytics Dashboard',
  description: 'Análisis inteligente de evaluaciones de desempeño 360° con insights avanzados y visualizaciones interactivas',
  keywords: ['evaluación 360', 'performance', 'analytics', 'dashboard', 'recursos humanos', 'talento'],
  authors: [{ name: 'Performance Analytics Team' }],
  robots: 'index, follow',
  openGraph: {
    title: '360° Performance Analytics Dashboard',
    description: 'Análisis inteligente de evaluaciones de desempeño 360°',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: '360° Performance Analytics Dashboard',
    description: 'Análisis inteligente de evaluaciones de desempeño 360°',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="h-full bg-gray-50 antialiased">
        <div className="min-h-full">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">
                      360° Performance Analytics
                    </h1>
                  </div>
                  <div className="hidden md:block ml-4">
                    <p className="text-sm text-gray-600">
                      Dashboard inteligente de evaluaciones de desempeño
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Sistema activo</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">
                    © 2024 360° Performance Analytics. Todos los derechos reservados.
                  </p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Datos seguros</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Procesamiento rápido</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>IA integrada</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                  <p className="text-xs text-gray-500">
                    Desarrollado con Next.js, TypeScript y Tailwind CSS
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <a 
                      href="#" 
                      className="hover:text-primary-600 transition-colors"
                      aria-label="Documentación"
                    >
                      Documentación
                    </a>
                    <a 
                      href="#" 
                      className="hover:text-primary-600 transition-colors"
                      aria-label="Soporte"
                    >
                      Soporte
                    </a>
                    <a 
                      href="#" 
                      className="hover:text-primary-600 transition-colors"
                      aria-label="Política de privacidad"
                    >
                      Privacidad
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* Loading overlay for better UX */}
        <div id="loading-overlay" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="loading-spinner"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Procesando archivo...</p>
              <p className="text-xs text-gray-600">Esto puede tomar unos momentos</p>
            </div>
          </div>
        </div>

        {/* Toast notifications container */}
        <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2"></div>

        {/* Global error boundary fallback */}
        <div id="error-boundary" className="hidden fixed inset-0 bg-gray-50 z-40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-danger-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Algo salió mal
            </h3>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
