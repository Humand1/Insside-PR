'use client'

import { useMemo, useState } from 'react'
import { ProcessedData, EvaluationType } from '@/lib/types'
import type { UserSegmentation } from '@/lib/types'
import { createAnalytics } from '@/lib/analytics'
import { createPDFExporterNew } from '@/lib/pdfExportNew'

interface DashboardProps {
  data: ProcessedData
  segmentations: UserSegmentation[]
  onReset: () => void
}

export function Dashboard({ data, segmentations, onReset }: DashboardProps) {
  // Estados para filtros tipo slicers
  const [selectedEvaluationTypes, setSelectedEvaluationTypes] = useState<Set<EvaluationType>>(new Set())
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [searchEmployee, setSearchEmployee] = useState<string>('')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  
  // Estados para segmentaciones dinámicas
  const [selectedSubAreas, setSelectedSubAreas] = useState<Set<string>>(new Set())
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  
  // Estado para el drawer de filtros
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  // Función para cerrar el drawer con animación
  const closeDrawer = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsFiltersOpen(false)
      setIsClosing(false)
    }, 300) // Duración de la animación de salida
  }
  
  // Extraer segmentaciones disponibles de los datos
  const availableSegmentations = useMemo(() => {
    const subAreas = new Set<string>()
    const locations = new Set<string>()
    
    segmentations.forEach(user => {
      if (user.subArea) subAreas.add(user.subArea)
      if (user.location) locations.add(user.location)
    })
    
    return {
      subAreas: Array.from(subAreas).sort(),
      locations: Array.from(locations).sort()
    }
  }, [segmentations])
  
         // Obtener tipos de evaluación que realmente tienen datos
         const availableEvaluationTypes = useMemo(() => {
           const typesWithData = [...new Set(data.evaluations.map(e => e.type))]
           return [
             { value: 'autoevaluacion', label: 'Autoevaluación', color: 'bg-blue-500' },
             { value: 'descendente', label: 'Descendente', color: 'bg-green-500' },
             { value: 'ascendente', label: 'Ascendente', color: 'bg-orange-500' },
             { value: 'pares', label: 'Entre pares', color: 'bg-purple-500' }
           ].filter(type => typesWithData.includes(type.value as EvaluationType))
         }, [data.evaluations])

  // Filtrar datos según los filtros seleccionados
  const filteredData = useMemo(() => {
    let filteredEvaluations = data.evaluations
    let filteredEmployees = data.employees

    // Filtrar por tipos de evaluación seleccionados
    if (selectedEvaluationTypes.size > 0) {
      filteredEvaluations = filteredEvaluations.filter(evaluation => 
        selectedEvaluationTypes.has(evaluation.type)
      )
    }

    // Filtrar por áreas seleccionadas
    if (selectedAreas.size > 0) {
      filteredEvaluations = filteredEvaluations.filter(evaluation => 
        selectedAreas.has(evaluation.evaluatedArea)
      )
      filteredEmployees = filteredEmployees.filter(emp => 
        selectedAreas.has(emp.area)
      )
    }

    // Filtrar por sub-áreas seleccionadas (usando segmentaciones)
    if (selectedSubAreas.size > 0) {
      const usersInSubAreas = segmentations
        .filter(user => user.subArea && selectedSubAreas.has(user.subArea))
        .map(user => user.id)
      
      filteredEvaluations = filteredEvaluations.filter(evaluation => 
        usersInSubAreas.includes(evaluation.evaluatedId) || 
        usersInSubAreas.includes(evaluation.evaluatedName)
      )
      filteredEmployees = filteredEmployees.filter(emp => 
        usersInSubAreas.includes(emp.email) || 
        usersInSubAreas.includes(emp.name)
      )
    }

    // Filtrar por ubicaciones seleccionadas (usando segmentaciones)
    if (selectedLocations.size > 0) {
      const usersInLocations = segmentations
        .filter(user => user.location && selectedLocations.has(user.location))
        .map(user => user.id)
      
      filteredEvaluations = filteredEvaluations.filter(evaluation => 
        usersInLocations.includes(evaluation.evaluatedId) || 
        usersInLocations.includes(evaluation.evaluatedName)
      )
      filteredEmployees = filteredEmployees.filter(emp => 
        usersInLocations.includes(emp.email) || 
        usersInLocations.includes(emp.name)
      )
    }

    // Filtrar por empleados seleccionados
    if (selectedEmployees.size > 0) {
      filteredEvaluations = filteredEvaluations.filter(evaluation => 
        selectedEmployees.has(evaluation.evaluatedName)
      )
      filteredEmployees = filteredEmployees.filter(emp => 
        selectedEmployees.has(emp.name)
      )
    }

    // Filtrar por búsqueda de empleado (solo para mostrar opciones, no para filtrar datos)
    const searchFilteredEmployees = searchEmployee 
      ? filteredEmployees.filter(emp => 
          emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
        )
      : filteredEmployees

    return {
      ...data,
      evaluations: filteredEvaluations,
      employees: filteredEmployees,
      searchFilteredEmployees
    }
  }, [data, segmentations, selectedEvaluationTypes, selectedAreas, selectedSubAreas, selectedLocations, selectedEmployees, searchEmployee])

  const analytics = useMemo(() => {
    const analyticsEngine = createAnalytics(filteredData)
    return analyticsEngine.generateAnalytics()
  }, [filteredData])

  const handleExportPDF = async () => {
    try {
      const activeFilters = {
        evaluationTypes: Array.from(selectedEvaluationTypes),
        areas: Array.from(selectedAreas),
        employees: Array.from(selectedEmployees)
      }
      const exporter = createPDFExporterNew(data, analytics, filteredData, analytics, activeFilters)
      await exporter.exportDashboard()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showToast('error', 'Error al generar PDF')
    }
  }

  const handleExportExecutiveReport = async () => {
    try {
      const activeFilters = {
        evaluationTypes: Array.from(selectedEvaluationTypes),
        areas: Array.from(selectedAreas),
        employees: Array.from(selectedEmployees)
      }
      const exporter = createPDFExporterNew(data, analytics, filteredData, analytics, activeFilters)
      await exporter.exportExecutiveReport()
    } catch (error) {
      console.error('Error exporting executive report:', error)
      showToast('error', 'Error al generar reporte ejecutivo')
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    const container = document.getElementById('toast-container')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `

    const iconColor = {
      success: 'text-success-400',
      error: 'text-danger-400'
    }[type]

    const icon = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
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
    <div className="space-y-8" data-dashboard="true">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard de Análisis 360°
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis completo de {data.metadata.totalEmployees} empleados y {data.metadata.totalEvaluations} evaluaciones
              {data.metadata.evaluationTypes.length > 1 && (
                <span className="block text-sm text-gray-500 mt-1">
                  Tipos de evaluación: {data.metadata.evaluationTypes.map(type => {
                    const labels = {
                      autoevaluacion: 'Autoevaluación',
                      descendente: 'Descendente', 
                      ascendente: 'Ascendente',
                      pares: 'Entre Pares'
                    };
                    return labels[type as keyof typeof labels] || type;
                  }).join(', ')}
                </span>
              )}
            </p>
          </div>
          
                 <div className="flex items-center space-x-3">
                   <button
                     onClick={() => setIsFiltersOpen(true)}
                     className="btn-outline btn-sm flex items-center space-x-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                     </svg>
                     <span>Filtros</span>
                     {(selectedEvaluationTypes.size > 0 || selectedAreas.size > 0 || selectedSubAreas.size > 0 || selectedLocations.size > 0 || selectedEmployees.size > 0) && (
                       <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                         {selectedEvaluationTypes.size + selectedAreas.size + selectedSubAreas.size + selectedLocations.size + selectedEmployees.size}
                       </span>
                     )}
                   </button>
                   <button
                     onClick={handleExportPDF}
                     className="btn-outline btn-sm"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     Exportar PDF
                   </button>
                   <button
                     onClick={onReset}
                     className="btn-secondary btn-sm"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     Nuevo análisis
                   </button>
                 </div>
        </div>
      </div>

      {/* Drawer de Filtros */}
      {(isFiltersOpen || isClosing) && (
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 z-40 ${
              isClosing 
                ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-in_forwards]' 
                : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
            }`}
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform ${
            isClosing 
              ? 'translate-x-0 animate-[slideOutRight_0.3s_ease-in_forwards]' 
              : 'translate-x-full animate-[slideInRight_0.4s_ease-out_forwards]'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del Drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-[slideInContent_0.5s_ease-out_0.1s_both]">
                {/* Botón Limpiar Todos */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedEvaluationTypes(new Set())
                      setSelectedAreas(new Set())
                      setSelectedSubAreas(new Set())
                      setSelectedLocations(new Set())
                      setSelectedEmployees(new Set())
                      setSearchEmployee('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Limpiar Todos
                  </button>
                </div>

                {/* Tipos de Evaluación */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tipos de Evaluación</h3>
                  <div className="space-y-2">
                    {availableEvaluationTypes.map((type) => {
                      const isSelected = selectedEvaluationTypes.has(type.value as EvaluationType)
                      return (
                        <label key={type.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedEvaluationTypes)
                              if (e.target.checked) {
                                newSet.add(type.value as EvaluationType)
                              } else {
                                newSet.delete(type.value as EvaluationType)
                              }
                              setSelectedEvaluationTypes(newSet)
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Áreas */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Áreas</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.metadata.areas.map((area, index) => {
                      const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-pink-500']
                      const color = colors[index % colors.length]
                      const isSelected = selectedAreas.has(area)
                      
                      return (
                        <label key={area} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedAreas)
                              if (e.target.checked) {
                                newSet.add(area)
                              } else {
                                newSet.delete(area)
                              }
                              setSelectedAreas(newSet)
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <span className="text-sm text-gray-700">{area}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Empleados */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Empleados</h3>
                  
                  {/* Búsqueda de empleados */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      placeholder="Buscar empleado..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Empleados como Evaluados */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Como Evaluados</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filteredData.searchFilteredEmployees.map((employee, index) => {
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
                        const color = colors[index % colors.length]
                        const isSelected = selectedEmployees.has(employee.name)
                        
                        // Contar cuántas evaluaciones tiene este empleado como evaluado
                        const evaluatedCount = filteredData.evaluations.filter(evaluation => evaluation.evaluatedName === employee.name).length
                        
                        if (evaluatedCount === 0) return null
                        
                        return (
                          <label key={`evaluated-${employee.name}-${employee.area}`} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedEmployees)
                                if (e.target.checked) {
                                  newSet.add(employee.name)
                                } else {
                                  newSet.delete(employee.name)
                                }
                                setSelectedEmployees(newSet)
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-700">{employee.name}</div>
                              <div className="text-xs text-gray-500">{employee.area} • {evaluatedCount} eval.</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Empleados como Evaluadores */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Como Evaluadores</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filteredData.searchFilteredEmployees.map((employee, index) => {
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
                        const color = colors[index % colors.length]
                        const isSelected = selectedEmployees.has(employee.name)
                        
                        // Contar cuántas evaluaciones hace este empleado como evaluador
                        const evaluatorCount = filteredData.evaluations.filter(evaluation => evaluation.evaluatorName === employee.name).length
                        
                        if (evaluatorCount === 0) return null
                        
                        return (
                          <label key={`evaluator-${employee.name}-${employee.area}`} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedEmployees)
                                if (e.target.checked) {
                                  newSet.add(employee.name)
                                } else {
                                  newSet.delete(employee.name)
                                }
                                setSelectedEmployees(newSet)
                              }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-700">{employee.name}</div>
                              <div className="text-xs text-gray-500">{employee.area} • {evaluatorCount} eval.</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  
                  {filteredData.searchFilteredEmployees.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No se encontraron empleados</p>
                  )}
                </div>

                {/* Sub-Áreas */}
                {availableSegmentations.subAreas.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Sub-Áreas</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSegmentations.subAreas.map((subArea, index) => {
                        const colors = ['bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-lime-500', 'bg-amber-500', 'bg-rose-500']
                        const color = colors[index % colors.length]
                        const isSelected = selectedSubAreas.has(subArea)
                        
                        return (
                          <label key={subArea} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedSubAreas)
                                if (e.target.checked) {
                                  newSet.add(subArea)
                                } else {
                                  newSet.delete(subArea)
                                }
                                setSelectedSubAreas(newSet)
                            }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <span className="text-sm text-gray-700">{subArea}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Ubicaciones */}
                {availableSegmentations.locations.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Ubicaciones</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSegmentations.locations.map((location, index) => {
                        const colors = ['bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-sky-500', 'bg-cyan-500', 'bg-indigo-500']
                        const color = colors[index % colors.length]
                        const isSelected = selectedLocations.has(location)
                        
                        return (
                          <label key={location} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedLocations)
                                if (e.target.checked) {
                                  newSet.add(location)
                                } else {
                                  newSet.delete(location)
                                }
                                setSelectedLocations(newSet)
                            }}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <span className="text-sm text-gray-700">{location}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del Drawer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={closeDrawer}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card" style={{minHeight: '120px', display: 'flex', alignItems: 'center'}}>
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="metric-label">Empleados evaluados</p>
              <p className="metric-value">{filteredData.employees.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card" style={{minHeight: '120px', display: 'flex', alignItems: 'center'}}>
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="metric-label">Total evaluaciones</p>
              <p className="metric-value">{filteredData.evaluations.length}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card" style={{minHeight: '120px', display: 'flex', alignItems: 'center'}}>
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="metric-label">Tasa completitud</p>
              <p className="metric-value">{analytics.completionMetrics.overall.completionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card" style={{minHeight: '120px', display: 'flex', alignItems: 'center'}}>
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="metric-label">Áreas analizadas</p>
              <p className="metric-value">{[...new Set(filteredData.evaluations.map(e => e.evaluatedArea))].length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas por tipo de evaluación 360° */}
      {Object.keys(analytics.completionMetrics.byType).length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Completitud por Tipo de Evaluación 360°
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {Object.entries(analytics.completionMetrics.byType).map(([type, metrics]) => {
                     const typeLabels = {
                       autoevaluacion: 'Autoevaluación',
                       descendente: 'Descendente',
                       ascendente: 'Ascendente',
                       pares: 'Entre pares'
                     };
              
              const typeColors = {
                autoevaluacion: 'bg-blue-500',
                descendente: 'bg-green-500',
                ascendente: 'bg-orange-500',
                pares: 'bg-purple-500'
              };
              
              const typeIcons = {
                autoevaluacion: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                descendente: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                ascendente: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
                pares: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
              };
              
              return (
                <div key={type} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {typeLabels[type as keyof typeof typeLabels]}
                    </h3>
                    <div className={`w-8 h-8 ${typeColors[type as keyof typeof typeColors]} rounded-full flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[type as keyof typeof typeIcons]} />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completadas:</span>
                      <span className="font-medium">{metrics.completed}/{metrics.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${typeColors[type as keyof typeof typeColors]}`}
                        style={{ width: `${metrics.completionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {metrics.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Comparación por áreas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Comparación por Áreas
        </h2>
        <div className="space-y-4">
          {analytics.areaComparisons.map((area, index) => (
            <div key={area.area} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900">{area.area}</h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {area.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {area.employeeCount} empleados
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-success-600">
                    {area.scoreDistribution.excellent}
                  </div>
                  <div className="text-gray-600">Excelente (90+)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary-600">
                    {area.scoreDistribution.good}
                  </div>
                  <div className="text-gray-600">Bueno (80-89)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-warning-600">
                    {area.scoreDistribution.average}
                  </div>
                  <div className="text-gray-600">Promedio (70-79)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-danger-600">
                    {area.scoreDistribution.poor}
                  </div>
                  <div className="text-gray-600">Bajo (&lt;70)</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-600">Top performer: </span>
                    <span className="font-medium text-gray-900">
                      {area.topPerformer.name} ({area.topPerformer.score.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de calor de talento */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Mapa de Calor de Talento
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Empleado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Área</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Puntaje</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Nivel</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {analytics.talentHeatMap.slice(0, 10).map((talent, index) => (
                <tr 
                  key={`${talent.employee}-${index}`} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedEmployee(talent.employee)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gray-900`} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        position: 'relative'
                      }}>
                        <span style={{ 
                          lineHeight: '1', 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          position: 'relative',
                          top: '0px',
                          left: '0px',
                          transform: 'translateY(0px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{talent.employee}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{talent.area}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {talent.overallScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`badge ${
                      talent.performanceLevel === 'Top Performer' ? 'badge-success' :
                      talent.performanceLevel === 'High Performer' ? 'badge-primary' :
                      talent.performanceLevel === 'Average' ? 'badge-warning' :
                      talent.performanceLevel === 'Needs Improvement' ? 'badge-danger' : 'badge-gray'
                    }`} style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      lineHeight: '1',
                      height: '24px',
                      minHeight: '24px',
                      position: 'relative',
                      top: '0px'
                    }}>
                      <span style={{
                        position: 'relative',
                        top: '0px',
                        transform: 'translateY(0px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>{talent.performanceLevel}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`badge ${
                      talent.riskLevel === 'Low' ? 'badge-success' :
                      talent.riskLevel === 'Medium' ? 'badge-warning' : 'badge-danger'
                    }`} style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      lineHeight: '1',
                      height: '24px',
                      minHeight: '24px',
                      position: 'relative',
                      top: '0px'
                    }}>
                      <span style={{
                        position: 'relative',
                        top: '0px',
                        transform: 'translateY(0px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>{talent.riskLevel}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Insights Clave
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.insights.map((insight, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                <div style={{ width: '20px', height: '20px', color: '#3b82f6', flexShrink: 0, marginTop: '2px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{ fontSize: '14px', color: '#1e40af', lineHeight: '20px', margin: 0 }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Recomendaciones
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ width: '20px', height: '20px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{ fontSize: '14px', color: '#166534', lineHeight: '20px', margin: 0 }}>{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detalles del empleado seleccionado */}
      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles del Empleado: {selectedEmployee}
            </h2>
            <button
              onClick={() => setSelectedEmployee(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Evaluaciones del empleado */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluaciones</h3>
              <div className="space-y-3">
                {filteredData.evaluations
                  .filter(evaluation => evaluation.evaluatedName === selectedEmployee)
                  .map((evaluation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {evaluation.type === 'autoevaluacion' && 'Autoevaluación'}
                            {evaluation.type === 'descendente' && 'Evaluación Descendente'}
                            {evaluation.type === 'ascendente' && 'Evaluación Ascendente'}
                            {evaluation.type === 'pares' && 'Evaluación entre Pares'}
                          </h4>
                          <p className="text-sm text-gray-600">Área: {evaluation.evaluatedArea}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            evaluation.status === 'Finalizada' ? 'bg-green-100 text-green-800' :
                            evaluation.status === 'En curso' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {evaluation.status}
                          </span>
                        </div>
                      </div>
                      {evaluation.totalScore && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Puntaje total:</span>
                          <span className="font-semibold text-gray-900">{evaluation.totalScore.toFixed(1)}</span>
                        </div>
                      )}
                      {evaluation.evaluatorName && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Evaluador:</span>
                          <span className="text-sm text-gray-900">{evaluation.evaluatorName}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Competencias del empleado */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Competencias</h3>
              <div className="space-y-3">
                {(() => {
                  const employeeEvaluations = filteredData.evaluations
                    .filter(evaluation => evaluation.evaluatedName === selectedEmployee && evaluation.competencies.length > 0);
                  
                  if (employeeEvaluations.length === 0) {
                    return <p className="text-gray-500">No hay datos de competencias disponibles</p>;
                  }

                  // Obtener todas las competencias únicas
                  const allCompetencies = new Map();
                  employeeEvaluations.forEach(evaluation => {
                    evaluation.competencies.forEach(comp => {
                      if (allCompetencies.has(comp.competencyName)) {
                        allCompetencies.get(comp.competencyName).scores.push(comp.averageScore);
                      } else {
                        allCompetencies.set(comp.competencyName, {
                          scores: [comp.averageScore],
                          name: comp.competencyName
                        });
                      }
                    });
                  });

                  return Array.from(allCompetencies.values()).map((comp, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{comp.name}</h4>
                      <div className="space-y-2">
                        {comp.scores.map((score: number, scoreIndex: number) => (
                          <div key={scoreIndex} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Evaluación {scoreIndex + 1}:</span>
                            <span className="font-semibold text-gray-900">{score.toFixed(1)}</span>
                          </div>
                        ))}
                        {comp.scores.length > 1 && (
                          <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Promedio:</span>
                            <span className="font-bold text-gray-900">
                              {(comp.scores.reduce((a: number, b: number) => a + b, 0) / comp.scores.length).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
