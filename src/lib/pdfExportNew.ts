import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ProcessedData, AnalyticsResults } from './types'

export class PDFExporterNew {
  private data: ProcessedData
  private analytics: AnalyticsResults
  private filteredData: ProcessedData
  private filteredAnalytics: AnalyticsResults
  private activeFilters: {
    evaluationTypes: string[]
    areas: string[]
    employees: string[]
  }

  constructor(
    data: ProcessedData, 
    analytics: AnalyticsResults, 
    filteredData?: ProcessedData, 
    filteredAnalytics?: AnalyticsResults,
    activeFilters?: { evaluationTypes: string[], areas: string[], employees: string[] }
  ) {
    this.data = data
    this.analytics = analytics
    this.filteredData = filteredData || data
    this.filteredAnalytics = filteredAnalytics || analytics
    this.activeFilters = activeFilters || { evaluationTypes: [], areas: [], employees: [] }
  }

  /**
   * Exporta el dashboard completo como PDF usando HTML optimizado
   */
  async exportDashboard(): Promise<void> {
    await this.exportDashboardInternal()
  }

  /**
   * Exporta un reporte ejecutivo como PDF usando HTML optimizado
   */
  async exportExecutiveReport(): Promise<void> {
    await this.exportDashboardInternal()
  }

  /**
   * Método interno para exportar el dashboard
   */
  private async exportDashboardInternal(): Promise<void> {
    try {
      this.showLoading('Generando PDF del dashboard...')

      // Esperar un poco para que la UI se estabilice
      await new Promise(resolve => setTimeout(resolve, 500))

      // Crear HTML optimizado para PDF
      const pdfHTML = this.generatePDFOptimizedHTML()
      
      // Crear un elemento temporal para renderizar el HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = pdfHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '800px' // Ancho fijo para consistencia
      tempDiv.style.backgroundColor = '#ffffff'
      tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.lineHeight = '1.5'
      tempDiv.style.color = '#1f2937'
      
      document.body.appendChild(tempDiv)

      // Esperar a que se renderice
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Capturar con html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: tempDiv.scrollHeight,
        foreignObjectRendering: false
      })

      // Limpiar elemento temporal
      document.body.removeChild(tempDiv)

      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height
      })

      // Crear PDF
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF({
        orientation: imgHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const usableWidth = pageWidth - (2 * margin)
      const usableHeight = pageHeight - (2 * margin)

      const imgData = canvas.toDataURL('image/png', 1.0)
      const totalPages = Math.ceil(imgHeight / usableHeight)

      let yPosition = margin
      let remainingHeight = imgHeight
      let currentPage = 1

      while (remainingHeight > 0) {
        if (currentPage > 1) {
          pdf.addPage()
        }

        const currentPageHeight = Math.min(remainingHeight, usableHeight)
        
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yPosition,
          usableWidth,
          currentPageHeight,
          undefined,
          'FAST'
        )

        remainingHeight -= currentPageHeight
        yPosition = margin - (imgHeight - remainingHeight - usableHeight)
        currentPage++
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `dashboard-360-${timestamp}.pdf`

      pdf.save(filename)

      this.hideLoading()
      this.showToast('success', 'PDF generado exitosamente')

    } catch (error) {
      console.error('Error al generar PDF:', error)
      this.hideLoading()
      this.showToast('error', 'Error al generar el PDF. Intenta nuevamente.')
    }
  }

  private generatePDFOptimizedHTML(): string {
    const filteredData = this.filteredData
    const analytics = this.filteredAnalytics
    
    return `
      <div style="width: 800px; background: white; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <!-- Header -->
        <div style="margin-bottom: 40px; text-align: center;">
          <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 15px 0; line-height: 1.2;">
            Dashboard de Análisis 360°
          </h1>
          <p style="color: #6b7280; margin: 0; font-size: 18px; line-height: 1.4;">
            Análisis completo de ${filteredData.employees.length} empleados y ${filteredData.evaluations.length} evaluaciones
          </p>
        </div>

        <!-- Filtros aplicados -->
        ${this.generateFiltersSection()}

        <!-- Métricas principales -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              Empleados evaluados
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
              ${filteredData.employees.length}
            </div>
            <div style="width: 48px; height: 48px; background: #dbeafe; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
            </div>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              Total evaluaciones
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
              ${filteredData.evaluations.length}
            </div>
            <div style="width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              Tasa completitud
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
              ${analytics.completionMetrics.overall.completionRate.toFixed(1)}%
            </div>
            <div style="width: 48px; height: 48px; background: #fef3c7; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              Áreas analizadas
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">
              ${[...new Set(filteredData.evaluations.map(e => e.evaluatedArea))].length}
            </div>
            <div style="width: 48px; height: 48px; background: #e9d5ff; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Completitud por tipo de evaluación (solo si hay múltiples tipos) -->
        ${this.generateCompletionByTypeSection()}
      </div>
    `
  }

  private getEvaluationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      autoevaluacion: 'Autoevaluación',
      descendente: 'Evaluación Descendente',
      ascendente: 'Evaluación Ascendente',
      pares: 'Evaluación de Pares'
    }
    return labels[type] || type
  }

  private generateCompletionByTypeSection(): string {
    const analytics = this.filteredAnalytics
    const typesWithData = Object.entries(analytics.completionMetrics.byType).filter(([_, metrics]) => metrics.total > 0)
    
    // Solo mostrar si hay múltiples tipos de evaluación con datos
    if (typesWithData.length <= 1) {
      return ''
    }

    return `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h2 style="font-size: 22px; font-weight: bold; color: #1f2937; margin: 0 0 25px 0; text-align: center; line-height: 1.3;">
          Completitud por Tipo de Evaluación 360°
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${typesWithData.map(([type, metrics]) => `
            <div style="background: #f9fafb; border-radius: 6px; padding: 15px;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 32px; height: 32px; background: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                </div>
                <span style="font-weight: 600; color: #1f2937;">${this.getEvaluationTypeLabel(type)}</span>
              </div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                Completadas: ${metrics.completed}/${metrics.total}
              </div>
              <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background: #16a34a; height: 100%; width: ${metrics.completionRate}%; transition: width 0.3s ease;"></div>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                ${metrics.completionRate.toFixed(1)}%
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  private generateFiltersSection(): string {
    const hasFilters = this.hasActiveFilters()
    
    if (!hasFilters) {
      return ''
    }

    const filtersHTML = this.getActiveFiltersHTML()
    
    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 10px 0;">
          📊 Filtros Aplicados
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${filtersHTML}
        </div>
      </div>
    `
  }

  private hasActiveFilters(): boolean {
    // Verificar si hay filtros activos basado en los filtros seleccionados
    return this.activeFilters.evaluationTypes.length > 0 ||
           this.activeFilters.areas.length > 0 ||
           this.activeFilters.employees.length > 0
  }

  private getActiveFiltersHTML(): string {
    const filters: string[] = []
    
    // Mostrar solo tipos de evaluación que están realmente seleccionados
    this.activeFilters.evaluationTypes.forEach(type => {
      filters.push(`
        <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
          🔵 ${this.getEvaluationTypeLabel(type)}
        </span>
      `)
    })
    
    // Mostrar solo áreas que están realmente seleccionadas
    this.activeFilters.areas.forEach(area => {
      filters.push(`
        <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
          🟢 ${area}
        </span>
      `)
    })
    
    // Mostrar solo empleados que están realmente seleccionados
    this.activeFilters.employees.forEach(employee => {
      filters.push(`
        <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
          🟠 ${employee}
        </span>
      `)
    })
    
    return filters.join('')
  }

  private showLoading(message: string): void {
    // Crear overlay de loading si no existe
    let overlay = document.getElementById('loading-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'loading-overlay'
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `
      
      const spinner = document.createElement('div')
      spinner.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: system-ui, -apple-system, sans-serif;
      `
      
      const spinnerIcon = document.createElement('div')
      spinnerIcon.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `
      
      const text = document.createElement('span')
      text.textContent = message
      text.style.color = '#374151'
      
      spinner.appendChild(spinnerIcon)
      spinner.appendChild(text)
      overlay.appendChild(spinner)
      document.body.appendChild(overlay)
    } else {
      overlay.style.display = 'flex'
    }
  }

  private hideLoading(): void {
    const overlay = document.getElementById('loading-overlay')
    if (overlay) {
      overlay.style.display = 'none'
    }
  }

  private showToast(type: 'success' | 'error', message: string): void {
    // Crear contenedor de toast si no existe
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `
      document.body.appendChild(container)
    }

    // Crear toast
    const toast = document.createElement('div')
    toast.style.cssText = `
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `

    toast.textContent = message
    container.appendChild(toast)

    // Remover después de 3 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }
}

export function createPDFExporterNew(
  data: ProcessedData, 
  analytics: AnalyticsResults, 
  filteredData?: ProcessedData, 
  filteredAnalytics?: AnalyticsResults,
  activeFilters?: { evaluationTypes: string[], areas: string[], employees: string[] }
) {
  return new PDFExporterNew(data, analytics, filteredData, filteredAnalytics, activeFilters)
}
