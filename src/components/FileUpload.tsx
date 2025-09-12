'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
  error: string | null
}

export function FileUpload({ onFileUpload, isProcessing, error }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      onFileUpload(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isProcessing
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-danger-300 bg-danger-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            {isProcessing ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg 
                className={`w-16 h-16 ${
                  error ? 'text-danger-400' : 
                  isDragActive ? 'text-primary-500' : 'text-gray-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            {isProcessing ? (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Procesando archivo...
                </p>
                <p className="text-sm text-gray-600">
                  Analizando estructura y generando insights
                </p>
              </div>
            ) : error ? (
              <div>
                <p className="text-lg font-medium text-danger-900 mb-2">
                  Error al procesar archivo
                </p>
                <p className="text-sm text-danger-600 mb-4">
                  {error}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.reload()
                  }}
                  className="btn-primary btn-sm"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive 
                    ? 'Suelta el archivo aquí...' 
                    : 'Arrastra tu archivo Excel aquí'
                  }
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  o haz clic para seleccionar un archivo
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <span>Formatos soportados:</span>
                  <span className="badge badge-gray">.xlsx</span>
                  <span className="badge badge-gray">.xls</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="progress-bar">
              <div className="progress-fill-primary w-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 text-center">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          ¿Qué tipos de archivo puedo subir?
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Archivos Excel (.xlsx, .xls) con evaluaciones 360°</p>
          <p>• Múltiples hojas con diferentes tipos de evaluación</p>
          <p>• Estructura flexible - nuestro sistema se adapta automáticamente</p>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Tipos de evaluación detectados automáticamente:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-gray-700">Autoevaluación</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-gray-700">Descendente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            <span className="text-gray-700">Ascendente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">De pares</span>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="text-sm">
          <p className="font-medium text-blue-900 mb-1">Seguridad y privacidad</p>
          <p className="text-blue-700">
            Tus datos se procesan localmente en tu navegador. No se almacenan en servidores externos 
            y toda la información permanece completamente privada y segura.
          </p>
        </div>
      </div>
    </div>
  )
}
