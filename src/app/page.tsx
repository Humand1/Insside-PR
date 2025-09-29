'use client'

import { useState, useCallback } from 'react'
import DualFileUpload from '@/components/DualFileUpload'
import { Dashboard } from '@/components/Dashboard'
import { ProcessedData, UserSegmentation } from '@/lib/types'

export default function HomePage() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [userSegmentations, setUserSegmentations] = useState<UserSegmentation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDataProcessed = useCallback((data: ProcessedData, segmentations: UserSegmentation[]) => {
    setProcessedData(data)
    setUserSegmentations(segmentations)
    showToast('success', 'Archivos procesados exitosamente')
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    showToast('error', errorMessage)
  }, [])

  const handleWarning = useCallback((warningMessage: string) => {
    console.log('⚠️ Advertencia:', warningMessage)
    showToast('warning', warningMessage)
  }, [])

  const handleReset = useCallback(() => {
    setProcessedData(null)
    setUserSegmentations([])
    setError(null)
  }, [])

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const container = document.getElementById('toast-container')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `

    const iconColor = {
      success: 'text-success-400',
      error: 'text-danger-400',
      warning: 'text-warning-400'
    }[type]

    const icon = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
    }[type]

    toast.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 ${iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}" />
            </svg>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">${message}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    container.appendChild(toast)

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0')
      toast.classList.add('translate-x-0', 'opacity-100')
    }, 100)

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0')
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!processedData ? (
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white -mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  360° Performance Analytics
                </h1>
                <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
                  Transforma tus evaluaciones de desempeño en insights estratégicos con análisis inteligente y visualizaciones avanzadas
                </p>
                
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Procesamiento automático</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Análisis adaptable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Insights con IA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comienza tu análisis
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Sube tu archivo Excel de evaluaciones 360° y el archivo de segmentaciones de usuarios para obtener análisis detallados automáticamente. 
              Nuestro sistema detecta la estructura y genera insights valiosos con filtros dinámicos.
            </p>
          </div>

          <DualFileUpload 
            onDataProcessed={handleDataProcessed}
            onError={handleError}
            onWarning={handleWarning}
          />

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Detección Automática
              </h3>
              <p className="text-gray-600">
                Reconoce automáticamente diferentes tipos de evaluación: autoevaluación, descendente, ascendente y de pares.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Análisis Avanzado
              </h3>
              <p className="text-gray-600">
                Métricas de completitud, comparaciones por área, mapas de calor de talento y análisis de feedback.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Reportes Ejecutivos
              </h3>
              <p className="text-gray-600">
                Genera reportes profesionales en PDF con insights, recomendaciones y visualizaciones para la toma de decisiones.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-lg shadow-sm p-8 mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              ¿Cómo funciona?
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Sube evaluaciones</h4>
                <p className="text-sm text-gray-600">Arrastra tu Excel de evaluaciones 360°</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Sube segmentaciones</h4>
                <p className="text-sm text-gray-600">Arrastra tu Excel de usuarios con segmentaciones</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Procesamiento IA</h4>
                <p className="text-sm text-gray-600">Mapeamos datos y generamos insights</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Dashboard interactivo</h4>
                <p className="text-sm text-gray-600">Explora con filtros dinámicos y exporta</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard 
          data={processedData} 
          segmentations={userSegmentations}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
