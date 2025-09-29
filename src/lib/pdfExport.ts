import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ProcessedData, AnalyticsResults } from './types'

export class PDFExporter {
  private data: ProcessedData
  private analytics: AnalyticsResults

  constructor(data: ProcessedData, analytics: AnalyticsResults) {
    this.data = data
    this.analytics = analytics
  }

  /**
   * Exporta el dashboard completo como PDF (captura visual)
   */
  async exportDashboard(): Promise<void> {
    // Declarar variables fuera del try para que estén disponibles en el catch
    let actionButtons: NodeListOf<HTMLButtonElement> | undefined
    let originalStyles: string[] = []
    
    try {
      // Mostrar loading
      this.showLoading('Capturando dashboard...')

      // Buscar el contenedor del dashboard
      const dashboardElement = document.querySelector('[data-dashboard="true"]') as HTMLElement
      
      if (!dashboardElement) {
        throw new Error('No se encontró el elemento del dashboard con data-dashboard="true"')
      }

      console.log('Dashboard element found:', dashboardElement)
      console.log('Element dimensions:', {
        width: dashboardElement.scrollWidth,
        height: dashboardElement.scrollHeight,
        offsetWidth: dashboardElement.offsetWidth,
        offsetHeight: dashboardElement.offsetHeight
      })

      // Ocultar botones de acción y filtros completos antes de la captura
      actionButtons = dashboardElement.querySelectorAll('button')
      originalStyles = []
      
      actionButtons.forEach((button, index) => {
        originalStyles[index] = button.style.display
        button.style.display = 'none'
      })

      // Ocultar la sección completa de filtros interactivos
      const filtersSection = dashboardElement.querySelector('[data-dashboard="true"] > div:nth-child(2)') as HTMLElement
      let originalFiltersDisplay = ''
      if (filtersSection) {
        originalFiltersDisplay = filtersSection.style.display
        filtersSection.style.display = 'none'
      }

      // Crear resumen compacto de filtros activos
      const compactFiltersHtml = this.createCompactFiltersHTML()
      if (compactFiltersHtml) {
        // Insertar el resumen compacto antes de las métricas
        const metricsSection = dashboardElement.querySelector('[data-dashboard="true"] > div:nth-child(3)') as HTMLElement
        if (metricsSection) {
          const compactDiv = document.createElement('div')
          compactDiv.innerHTML = compactFiltersHtml
          compactDiv.className = 'mb-4 p-3 bg-gray-50 rounded-lg border'
          metricsSection.parentNode?.insertBefore(compactDiv, metricsSection)
        }
      }

      // Forzar recálculo de estilos y esperar para que se apliquen
      dashboardElement.offsetHeight // Forzar reflow
      await new Promise(resolve => setTimeout(resolve, 1000)) // Tiempo estándar
      
      // Asegurar que todos los estilos estén cargados
      const computedStyle = window.getComputedStyle(dashboardElement)
      console.log('Dashboard computed styles:', {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontSize: computedStyle.fontSize,
        fontFamily: computedStyle.fontFamily
      })

      // Configurar opciones para html2canvas - optimizado para Tailwind CSS
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // Alta resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: false, // Importante: no remover el contenedor para mantener estilos
        imageTimeout: 30000, // Tiempo estándar
        width: dashboardElement.scrollWidth,
        height: dashboardElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        foreignObjectRendering: false, // Mantener configuración estable
        ignoreElements: (element) => {
          // Ignorar elementos que pueden causar problemas
          const htmlElement = element as HTMLElement;
          return element.classList.contains('hidden') || 
                 htmlElement.style.display === 'none' ||
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE' ||
                 element.classList.contains('animate-spin') // Ignorar spinners
        },
        onclone: (clonedDoc) => {
          // Asegurar que todos los estilos CSS se incluyan en el clone
          const clonedElement = clonedDoc.querySelector('[data-dashboard="true"]') as HTMLElement
          
          if (clonedElement) {
            // Aplicar estilos base
            clonedElement.style.backgroundColor = '#ffffff'
            clonedElement.style.padding = '20px'
            clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif'
            
            // Asegurar que todos los estilos de Tailwind se apliquen
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement
              // Forzar recálculo de estilos
              htmlEl.style.display = htmlEl.style.display || 'block'
            })
          }
          
          // Copiar todos los estilos CSS del documento original
          const originalStyles = document.querySelectorAll('style, link[rel="stylesheet"]')
          originalStyles.forEach((style) => {
            if (style.tagName === 'STYLE') {
              const newStyle = clonedDoc.createElement('style')
              newStyle.textContent = style.textContent
              clonedDoc.head.appendChild(newStyle)
            } else if (style.tagName === 'LINK') {
              const newLink = clonedDoc.createElement('link')
              newLink.rel = 'stylesheet'
              newLink.href = (style as HTMLLinkElement).href
              clonedDoc.head.appendChild(newLink)
            }
          })
        }
      })

      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height
      })

      // Crear PDF con las dimensiones del canvas
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      console.log('PDF dimensions:', {
        imgWidth,
        imgHeight,
        pageHeight
      })
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Calcular cuántas páginas necesitamos con un margen de seguridad
      const margin = 10 // Margen de 10mm para evitar páginas vacías
      const usableHeight = pageHeight - margin
      const totalPages = Math.ceil(imgHeight / usableHeight)
      
      console.log(`Altura de imagen: ${imgHeight}mm, Páginas necesarias: ${totalPages}`)
      
      // Si el contenido cabe en una página, agregarlo directamente
      if (totalPages === 1) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        // Si necesita múltiples páginas, dividir correctamente
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
          }
          
          // Calcular la posición Y para esta página usando la altura usable
          const yPosition = -page * usableHeight
          
          // Agregar la imagen con el offset correcto
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yPosition, imgWidth, imgHeight)
        }
      }

      // Restaurar botones y filtros después de la captura
      actionButtons.forEach((button, index) => {
        button.style.display = originalStyles[index] || ''
      })

      // Restaurar sección de filtros
      if (filtersSection) {
        filtersSection.style.display = originalFiltersDisplay
      }

      // Limpiar resumen compacto
      const compactDiv = dashboardElement.querySelector('.mb-4.p-3.bg-gray-50.rounded-lg.border')
      if (compactDiv) {
        compactDiv.remove()
      }

      // Descargar PDF
      const fileName = `dashboard-360-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      this.hideLoading()
      this.showToast('success', 'PDF del dashboard generado exitosamente')

    } catch (error) {
      // Restaurar botones y filtros en caso de error
      if (actionButtons) {
        actionButtons.forEach((button, index) => {
          button.style.display = originalStyles[index] || ''
        })
      }

      // Restaurar sección de filtros
      const filtersSection = document.querySelector('[data-dashboard="true"] > div:nth-child(2)') as HTMLElement
      if (filtersSection) {
        filtersSection.style.display = ''
      }

      // Limpiar resumen compacto
      const compactDiv = document.querySelector('.mb-4.p-3.bg-gray-50.rounded-lg.border')
      if (compactDiv) {
        compactDiv.remove()
      }
      
      this.hideLoading()
      this.showToast('error', 'Error al generar PDF del dashboard')
      console.error('Error exporting dashboard PDF:', error)
    }
  }

  /**
   * Exporta un reporte ejecutivo
   */
  async exportExecutiveReport(): Promise<void> {
    try {
      this.showLoading('Generando reporte ejecutivo...')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      // Portada
      pdf.setFontSize(28)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Reporte Ejecutivo', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Análisis de Evaluaciones 360°', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Información de la organización
      pdf.setFontSize(12)
      pdf.text(`Total de empleados: ${this.data.metadata.totalEmployees}`, 20, yPosition)
      yPosition += 8
      pdf.text(`Total de evaluaciones: ${this.data.metadata.totalEvaluations}`, 20, yPosition)
      yPosition += 8
      pdf.text(`Áreas analizadas: ${this.data.metadata.areas.join(', ')}`, 20, yPosition)
      yPosition += 20

      // Resumen ejecutivo
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Resumen Ejecutivo', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      
      const completionRate = this.analytics.completionMetrics.overall.completionRate
      const topArea = this.analytics.areaComparisons[0]
      const topPerformers = this.analytics.talentHeatMap.filter(t => t.performanceLevel === 'Top Performer').length

      const summary = [
        `• Tasa de completitud general: ${completionRate.toFixed(1)}%`,
        `• Área con mejor desempeño: ${topArea?.area || 'N/A'} (${topArea?.averageScore.toFixed(1) || 0} puntos)`,
        `• Top performers identificados: ${topPerformers}`,
        `• Áreas analizadas: ${this.data.metadata.areas.length}`
      ]

      summary.forEach(line => {
        pdf.text(line, 25, yPosition)
        yPosition += 6
      })

      yPosition += 10

      // Insights clave
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Insights Clave', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      
      this.analytics.insights.slice(0, 5).forEach(insight => {
        const lines = pdf.splitTextToSize(`• ${insight}`, pageWidth - 40)
        lines.forEach((line: string) => {
          pdf.text(line, 25, yPosition)
          yPosition += 5
        })
        yPosition += 2
      })

      yPosition = this.addNewPageIfNeeded(pdf, yPosition + 20)

      // Recomendaciones
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Recomendaciones Estratégicas', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      
      this.analytics.recommendations.slice(0, 8).forEach(recommendation => {
        const lines = pdf.splitTextToSize(`• ${recommendation}`, pageWidth - 40)
        lines.forEach((line: string) => {
          pdf.text(line, 25, yPosition)
          yPosition += 5
        })
        yPosition += 2
      })

      // Descargar PDF
      const fileName = `reporte-ejecutivo-360-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      this.hideLoading()
      this.showToast('success', 'Reporte ejecutivo generado exitosamente')

    } catch (error) {
      this.hideLoading()
      this.showToast('error', 'Error al generar reporte ejecutivo')
      console.error('Error exporting executive report:', error)
    }
  }

  private addMetricsSection(pdf: jsPDF, yPosition: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Métricas Principales', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    const metrics = [
      { label: 'Empleados evaluados', value: this.data.metadata.totalEmployees },
      { label: 'Total evaluaciones', value: this.data.metadata.totalEvaluations },
      { label: 'Tasa completitud', value: `${this.analytics.completionMetrics.overall.completionRate.toFixed(1)}%` },
      { label: 'Áreas analizadas', value: this.data.metadata.areas.length }
    ]

    metrics.forEach((metric, index) => {
      const x = 20 + (index % 2) * (pageWidth / 2)
      const y = yPosition + Math.floor(index / 2) * 15
      
      pdf.text(`${metric.label}:`, x, y)
      pdf.setFont('helvetica', 'bold')
      pdf.text(metric.value.toString(), x + 60, y)
      pdf.setFont('helvetica', 'normal')
    })
  }

  private addCompletionSection(pdf: jsPDF, yPosition: number): void {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Completitud por Tipo de Evaluación', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    Object.entries(this.analytics.completionMetrics.byType).forEach(([type, metrics]) => {
      if (metrics) {
        const typeName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        pdf.text(`${typeName}: ${metrics.completed}/${metrics.total} (${metrics.completionRate.toFixed(1)}%)`, 25, yPosition)
        yPosition += 6
      }
    })
  }

  private addAreaComparisonSection(pdf: jsPDF, yPosition: number): void {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Comparación por Áreas', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    this.analytics.areaComparisons.slice(0, 5).forEach((area, index) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}. ${area.area}`, 25, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`   Promedio: ${area.averageScore.toFixed(1)} | Empleados: ${area.employeeCount}`, 25, yPosition + 5)
      yPosition += 12
    })
  }

  private addTopPerformersSection(pdf: jsPDF, yPosition: number): void {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Top Performers', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    this.analytics.talentHeatMap.slice(0, 5).forEach((talent, index) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}. ${talent.employee}`, 25, yPosition)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`   Área: ${talent.area} | Puntaje: ${talent.overallScore.toFixed(1)} | Nivel: ${talent.performanceLevel}`, 25, yPosition + 5)
      yPosition += 12
    })
  }

  private addInsightsSection(pdf: jsPDF, yPosition: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Insights y Recomendaciones', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    // Insights
    pdf.setFont('helvetica', 'bold')
    pdf.text('Insights Clave:', 25, yPosition)
    yPosition += 6

    pdf.setFont('helvetica', 'normal')
    this.analytics.insights.slice(0, 3).forEach(insight => {
      const lines = pdf.splitTextToSize(`• ${insight}`, pageWidth - 50)
      lines.forEach((line: string) => {
        pdf.text(line, 30, yPosition)
        yPosition += 5
      })
      yPosition += 2
    })

    yPosition += 5

    // Recomendaciones
    pdf.setFont('helvetica', 'bold')
    pdf.text('Recomendaciones:', 25, yPosition)
    yPosition += 6

    pdf.setFont('helvetica', 'normal')
    this.analytics.recommendations.slice(0, 3).forEach(recommendation => {
      const lines = pdf.splitTextToSize(`• ${recommendation}`, pageWidth - 50)
      lines.forEach((line: string) => {
        pdf.text(line, 30, yPosition)
        yPosition += 5
      })
      yPosition += 2
    })
  }

  private addNewPageIfNeeded(pdf: jsPDF, yPosition: number): number {
    const pageHeight = pdf.internal.pageSize.getHeight()
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      return 20
    }
    return yPosition
  }

  private showLoading(message: string): void {
    // Crear overlay de loading si no existe
    let loadingOverlay = document.getElementById('loading-overlay')
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div')
      loadingOverlay.id = 'loading-overlay'
      loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      loadingOverlay.innerHTML = `
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <p class="text-gray-700">${message}</p>
        </div>
      `
      document.body.appendChild(loadingOverlay)
    } else {
      const messageElement = loadingOverlay.querySelector('p')
      if (messageElement) {
        messageElement.textContent = message
      }
    }
  }

  private hideLoading(): void {
    const loadingOverlay = document.getElementById('loading-overlay')
    if (loadingOverlay) {
      loadingOverlay.remove()
    }
  }

  private createCompactFiltersHTML(): string {
    // Obtener los filtros activos del estado actual
    const selectedEvaluationTypes = this.getSelectedEvaluationTypes()
    const selectedAreas = this.getSelectedAreas()
    const selectedEmployees = this.getSelectedEmployees()

    // Si no hay filtros activos, no mostrar nada
    if (selectedEvaluationTypes.length === 0 && selectedAreas.length === 0 && selectedEmployees.length === 0) {
      return ''
    }

    const typeLabels = {
      'autoevaluacion': 'Autoevaluación',
      'descendente': 'Evaluación Descendente',
      'ascendente': 'Evaluación Ascendente',
      'pares': 'Evaluación entre Pares'
    }

    let html = '<div class="flex flex-wrap items-center gap-2 text-sm">'
    html += '<span class="font-medium text-gray-700">Filtros aplicados:</span>'

    // Tipos de evaluación
    selectedEvaluationTypes.forEach(type => {
      html += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <div class="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
        ${typeLabels[type as keyof typeof typeLabels]}
      </span>`
    })

    // Áreas
    selectedAreas.forEach(area => {
      html += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
        Área ${area}
      </span>`
    })

    // Empleados
    selectedEmployees.forEach(employee => {
      html += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <div class="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
        ${employee}
      </span>`
    })

    html += '</div>'
    return html
  }

  private getSelectedEvaluationTypes(): string[] {
    // Obtener tipos de evaluación seleccionados del DOM
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const types: string[] = []
    
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label')
      if (label && label.textContent?.includes('Evaluación')) {
        const text = label.textContent.trim()
        if (text.includes('Autoevaluación')) types.push('autoevaluacion')
        else if (text.includes('Descendente')) types.push('descendente')
        else if (text.includes('Ascendente')) types.push('ascendente')
        else if (text.includes('Pares')) types.push('pares')
      }
    })
    
    return types
  }

  private getSelectedAreas(): string[] {
    // Obtener áreas seleccionadas del DOM
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const areas: string[] = []
    
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label')
      if (label && label.textContent && !label.textContent.includes('Evaluación') && !label.textContent.includes('eval.')) {
        const text = label.textContent.trim()
        if (text && !text.includes('Como Evaluados') && !text.includes('Como Evaluadores')) {
          areas.push(text)
        }
      }
    })
    
    return areas
  }

  private getSelectedEmployees(): string[] {
    // Obtener empleados seleccionados del DOM
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const employees: string[] = []
    
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label')
      if (label && label.textContent?.includes('eval.')) {
        const text = label.textContent.trim()
        const employeeName = text.split(' (')[0] // Extraer solo el nombre
        if (employeeName && !employees.includes(employeeName)) {
          employees.push(employeeName)
        }
      }
    })
    
    return employees
  }


  private generatePDFOptimizedHTML(): string {
    const filteredData = this.getFilteredData()
    const analytics = this.analytics
    
    return `
      <div style="width: 800px; background: white; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <!-- Header -->
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">
            Dashboard de Análisis 360°
          </h1>
          <p style="color: #6b7280; margin: 0; font-size: 16px;">
            Análisis completo de ${filteredData.employees.length} empleados y ${filteredData.evaluations.length} evaluaciones
          </p>
        </div>

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

        <!-- Completitud por tipo de evaluación -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
            Completitud por Tipo de Evaluación 360°
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${Object.entries(analytics.completionMetrics.byType).map(([type, metrics]) => `
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

  private getFilteredData() {
    // Simular datos filtrados - en una implementación real, esto vendría del estado del componente
    return this.data
  }

  private showToast(type: 'success' | 'error', message: string): void {
    // Crear contenedor de toast si no existe
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      container.className = 'fixed top-4 right-4 z-50 space-y-2'
      document.body.appendChild(container)
    }

    const toast = document.createElement('div')
    toast.className = `
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `

    const iconColor = {
      success: 'text-green-400',
      error: 'text-red-400'
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
            <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
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
}

// Función helper para crear una instancia del exportador
export const createPDFExporter = (data: ProcessedData, analytics: AnalyticsResults) => 
  new PDFExporter(data, analytics)
