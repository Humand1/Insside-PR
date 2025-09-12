'use client'

import { useMemo } from 'react'
import { ProcessedData } from '@/lib/types'
import { createAnalytics } from '@/lib/analytics'

interface DashboardProps {
  data: ProcessedData
  onReset: () => void
}

export function Dashboard({ data, onReset }: DashboardProps) {
  const analytics = useMemo(() => {
    const analyticsEngine = createAnalytics(data)
    return analyticsEngine.generateAnalytics()
  }, [data])

  const handleExportPDF = () => {
    // TODO: Implementar exportación a PDF
    console.log('Exportar a PDF')
  }

  const handleExportExcel = () => {
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard de Análisis 360°
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis completo de {data.metadata.totalEmployees} empleados y {data.metadata.totalEvaluations} evaluaciones
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
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
              onClick={handleExportExcel}
              className="btn-outline btn-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
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

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Empleados evaluados</p>
              <p className="metric-value">{data.metadata.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Total evaluaciones</p>
              <p className="metric-value">{data.metadata.totalEvaluations}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
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

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">Áreas analizadas</p>
              <p className="metric-value">{data.metadata.areas.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Completitud por tipo de evaluación */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Completitud por Tipo de Evaluación
        </h2>
        <div className="space-y-4">
          {Object.entries(analytics.completionMetrics.byType).map(([type, metrics]) => (
            <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  type === 'autoevaluacion' ? 'bg-primary-500' :
                  type === 'descendente' ? 'bg-success-500' :
                  type === 'ascendente' ? 'bg-warning-500' : 'bg-purple-500'
                }`}></div>
                <span className="font-medium text-gray-900 capitalize">
                  {type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {metrics?.completed || 0} / {metrics?.total || 0}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      type === 'autoevaluacion' ? 'bg-primary-500' :
                      type === 'descendente' ? 'bg-success-500' :
                      type === 'ascendente' ? 'bg-warning-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${metrics?.completionRate || 0}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium text-gray-900 w-12 text-right">
                  {(metrics?.completionRate || 0).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <tr key={talent.employee} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
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
                    }`}>
                      {talent.performanceLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`badge ${
                      talent.riskLevel === 'Low' ? 'badge-success' :
                      talent.riskLevel === 'Medium' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {talent.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Insights Clave
          </h2>
          <div className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recomendaciones
          </h2>
          <div className="space-y-3">
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
