import * as XLSX from 'xlsx';
import { 
  ProcessedData, 
  SheetStructure, 
  EvaluationType, 
  ColumnMapping, 
  Employee, 
  Evaluation, 
  CompetencyScore, 
  QuestionScore,
  ProcessingResult,
  ValidationError,
  DataMetadata,
  Competency,
  UserSegmentation,
  SegmentedEmployee
} from './types';

export class ExcelParser {
  private workbook: XLSX.WorkBook | null = null;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private userSegmentations: Map<string, UserSegmentation> = new Map();

  /**
   * Extrae el nombre del empleado priorizando nombre real sobre email
   * Si hay segmentaciones disponibles, las usa para obtener información adicional
   */
  private extractEmployeeName(emailOrName: string): { name: string; email: string; segmentation?: UserSegmentation } {
    const input = String(emailOrName || '').trim();
    
    if (!input) {
      return { name: 'Sin nombre', email: 'sin@email.com' };
    }
    
    // Buscar en las segmentaciones primero (por email exacto)
    let segmentation = this.userSegmentations.get(input);
    
    // Si no se encuentra por email exacto, buscar por nombre
    if (!segmentation) {
      for (const [key, userSeg] of this.userSegmentations.entries()) {
        if (userSeg.name === input) {
          segmentation = userSeg;
          break;
        }
      }
    }
    
    if (segmentation) {
      return {
        name: segmentation.name,
        email: segmentation.id,
        segmentation
      };
    }
    
    // Si es un email, intentar extraer el nombre
    if (input.includes('@')) {
      const emailParts = input.split('@')[0];
      
      // Convertir de formato email a nombre (ej: "juan.perez" -> "Juan Perez")
      const nameParts = emailParts.split(/[._-]/);
      const formattedName = nameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      
      return {
        name: formattedName,
        email: input
      };
    }
    
    // Si no es email, asumir que es nombre
    return {
      name: input,
      email: input.toLowerCase().replace(/\s+/g, '.') + '@empresa.com'
    };
  }

  /**
   * Integra las segmentaciones de usuarios al parser
   */
  integrateUserSegmentations(segmentations: UserSegmentation[]): void {
    this.userSegmentations.clear();
    segmentations.forEach(user => {
      this.userSegmentations.set(user.id, user);
    });
    console.log('Segmentaciones integradas:', Array.from(this.userSegmentations.entries()));
  }

  /**
   * Procesa un archivo Excel y extrae los datos de evaluación 360°
   */
  async processFile(file: File): Promise<ProcessingResult> {
    try {
      this.errors = [];
      this.warnings = [];

      const buffer = await file.arrayBuffer();
      this.workbook = XLSX.read(buffer, { type: 'buffer' });

      if (!this.workbook) {
        this.errors.push({
          field: 'file',
          message: 'No se pudo leer el archivo Excel',
          severity: 'error'
        });
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Detectar estructura de las hojas
      const sheetStructures = this.detectSheetStructures();
      
      if (sheetStructures.length === 0) {
        this.errors.push({
          field: 'sheets',
          message: 'No se encontraron hojas válidas de evaluación',
          severity: 'error'
        });
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Procesar datos
      const processedData = this.processSheetData(sheetStructures);

      return {
        success: true,
        data: processedData,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.errors.push({
        field: 'processing',
        message: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error'
      });
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Detecta automáticamente la estructura de las hojas del Excel
   */
  private detectSheetStructures(): SheetStructure[] {
    if (!this.workbook) return [];

    const structures: SheetStructure[] = [];
    const sheetNames = this.workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const sheet = this.workbook.Sheets[sheetName];
      const structure = this.analyzeSheetStructure(sheetName, sheet);
      
      if (structure) {
        structures.push(structure);
      }
    }

    return structures;
  }

  /**
   * Analiza la estructura de una hoja específica
   */
  private analyzeSheetStructure(sheetName: string, sheet: XLSX.WorkSheet): SheetStructure | null {
    try {
      // Convertir hoja a JSON para análisis
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (data.length < 1) {
        this.warnings.push({
          field: sheetName,
          message: `La hoja "${sheetName}" está vacía`,
          severity: 'warning'
        });
        return null;
      }
      
      // Si solo tiene encabezados pero no datos, es una advertencia menor
      if (data.length === 1) {
        this.warnings.push({
          field: sheetName,
          message: `La hoja "${sheetName}" solo tiene encabezados, no hay datos de evaluación`,
          severity: 'warning'
        });
        return null;
      }

      // Detectar tipo de evaluación basado en el nombre de la hoja
      const evaluationType = this.detectEvaluationType(sheetName);
      
      if (!evaluationType) {
        // Solo generar advertencia si no es una hoja de resumen/usuarios
        const name = sheetName.toLowerCase();
        const isSummarySheet = name.indexOf('usuarios') !== -1 || name.indexOf('empleados') !== -1 || 
                              name.indexOf('users') !== -1 || name.indexOf('employees') !== -1 ||
                              name.indexOf('lista') !== -1 || name.indexOf('list') !== -1 ||
                              name.indexOf('resumen') !== -1 || name.indexOf('summary') !== -1;
        
        if (!isSummarySheet) {
          this.warnings.push({
            field: sheetName,
            message: `No se pudo determinar el tipo de evaluación para la hoja "${sheetName}"`,
            severity: 'warning'
          });
        }
        return null;
      }

      // Encontrar fila de encabezados
      const headerRow = this.findHeaderRow(data);
      if (headerRow === -1) {
        this.warnings.push({
          field: sheetName,
          message: `No se encontraron encabezados válidos en la hoja "${sheetName}"`,
          severity: 'warning'
        });
        return null;
      }

      // Mapear columnas
      const columnMapping = this.mapColumns(data[headerRow], evaluationType);
      
      // Detectar competencias
      const competencies = this.detectCompetencies(data[headerRow]);

      return {
        name: sheetName,
        type: evaluationType,
        columns: columnMapping,
        dataStartRow: headerRow + 1,
        competencies
      };

    } catch (error) {
      this.errors.push({
        field: sheetName,
        message: `Error al analizar la hoja "${sheetName}": ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error'
      });
      return null;
    }
  }

  /**
   * Detecta el tipo de evaluación basado en el nombre de la hoja
   */
  private detectEvaluationType(sheetName: string): EvaluationType | null {
    const name = sheetName.toLowerCase();
    
    // Detectar hojas de usuarios/empleados (no son evaluaciones) - no generar advertencias
    if (name.indexOf('usuarios') !== -1 || name.indexOf('empleados') !== -1 || 
        name.indexOf('users') !== -1 || name.indexOf('employees') !== -1 ||
        name.indexOf('lista') !== -1 || name.indexOf('list') !== -1 ||
        name.indexOf('resumen') !== -1 || name.indexOf('summary') !== -1) {
      return null; // No es una hoja de evaluación, no generar advertencia
    }
    
    // Detectar tipos específicos de evaluación 360°
    if (name.indexOf('autoevaluacion') !== -1 || name.indexOf('autoevaluación') !== -1 || 
        name.indexOf('autoevaluac') !== -1 || name.indexOf('self') !== -1) {
      return 'autoevaluacion';
    }
    
    if (name.indexOf('evaluacion descendente') !== -1 || name.indexOf('evaluación descendente') !== -1 ||
        name.indexOf('descendente') !== -1 || name.indexOf('downward') !== -1 || name.indexOf('manager') !== -1) {
      return 'descendente';
    }
    
    if (name.indexOf('evaluacion ascendente') !== -1 || name.indexOf('evaluación ascendente') !== -1 ||
        name.indexOf('ascendente') !== -1 || name.indexOf('upward') !== -1 || name.indexOf('subordinate') !== -1) {
      return 'ascendente';
    }
    
    if (name.indexOf('evaluacion de pares') !== -1 || name.indexOf('evaluación de pares') !== -1 ||
        name.indexOf('pares') !== -1 || name.indexOf('peer') !== -1 || name.indexOf('360') !== -1) {
      return 'pares';
    }
    
    return null;
  }

  /**
   * Encuentra la fila que contiene los encabezados
   */
  private findHeaderRow(data: any[][]): number {
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (this.isHeaderRow(row)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Determina si una fila contiene encabezados válidos
   */
  private isHeaderRow(row: any[]): boolean {
    if (!row || row.length < 3) return false;

    const rowStr = row.join(' ').toLowerCase();
    const headerIndicators = [
      'nombre', 'name', 'evaluado', 'evaluated',
      'area', 'department', 'evaluador', 'evaluator',
      'puntaje', 'score', 'estado', 'status'
    ];

    return headerIndicators.some(indicator => rowStr.indexOf(indicator) !== -1);
  }

  /**
   * Mapea las columnas de la hoja a los campos esperados
   */
  private mapColumns(headerRow: any[], evaluationType: EvaluationType): ColumnMapping {
    const mapping: ColumnMapping = {
      evaluatedName: -1,
      evaluatedArea: -1,
      status: -1
    };

    for (let i = 0; i < headerRow.length; i++) {
      const header = String(headerRow[i] || '').toLowerCase().trim();

      // Mapear nombre del evaluado - más flexible
      if (mapping.evaluatedName === -1 && (
          header.indexOf('nombre') !== -1 || 
          header.indexOf('evaluado') !== -1 || 
          header.indexOf('evaluated') !== -1 ||
          header.indexOf('empleado') !== -1 ||
          header.indexOf('employee') !== -1 ||
          header === 'name' ||
          (header.indexOf('nombre') !== -1 && header.indexOf('apellido') !== -1)
      )) {
        mapping.evaluatedName = i;
      }

      // Mapear área - más flexible
      if (mapping.evaluatedArea === -1 && (
          header.indexOf('area') !== -1 || 
          header.indexOf('department') !== -1 ||
          header.indexOf('departamento') !== -1 ||
          header.indexOf('sector') !== -1 ||
          header.indexOf('division') !== -1 ||
          header === 'área'
      )) {
        mapping.evaluatedArea = i;
      }

      // Mapear evaluador (para evaluaciones que no son autoevaluación)
      if (evaluationType !== 'autoevaluacion' && mapping.evaluatorName === undefined && (
          header.indexOf('evaluador') !== -1 || 
          header.indexOf('evaluator') !== -1 ||
          header.indexOf('supervisor') !== -1 ||
          header.indexOf('manager') !== -1 ||
          header.indexOf('jefe') !== -1
      )) {
        mapping.evaluatorName = i;
      }

      // Mapear estado - más flexible
      if (mapping.status === -1 && (
          header.indexOf('estado') !== -1 || 
          header.indexOf('status') !== -1 ||
          header.indexOf('situacion') !== -1 ||
          header.indexOf('situación') !== -1 ||
          header.indexOf('progreso') !== -1 ||
          header.indexOf('progress') !== -1
      )) {
        mapping.status = i;
      }

      // Mapear puntaje total - más flexible
      if (mapping.totalScore === undefined && (
          header.indexOf('puntaje') !== -1 || 
          header.indexOf('score') !== -1 ||
          header.indexOf('puntuacion') !== -1 ||
          header.indexOf('puntuación') !== -1 ||
          header.indexOf('calificacion') !== -1 ||
          header.indexOf('calificación') !== -1 ||
          header.indexOf('total') !== -1 ||
          header.indexOf('promedio') !== -1 ||
          header.indexOf('average') !== -1
      )) {
        mapping.totalScore = i;
      }
    }

    return mapping;
  }

  /**
   * Detecta las competencias en los encabezados
   */
  private detectCompetencies(headerRow: any[]): string[] {
    const competencies: string[] = [];
    const competencyKeywords = [
      'compromiso', 'commitment',
      'comunicación', 'communication',
      'orientación', 'orientation',
      'colaboración', 'collaboration',
      'iniciativa', 'initiative',
      'autonomía', 'autonomy',
      'resultados', 'results',
      'liderazgo', 'leadership'
    ];

    for (const header of headerRow) {
      const headerStr = String(header || '').toLowerCase();
      
      for (const keyword of competencyKeywords) {
        if (headerStr.indexOf(keyword) !== -1 && !competencies.some(c => c.indexOf(keyword) !== -1)) {
          // Extraer el nombre completo de la competencia
          const competencyName = this.extractCompetencyName(String(header));
          if (competencyName && competencies.indexOf(competencyName) === -1) {
            competencies.push(competencyName);
          }
          break;
        }
      }
    }

    return competencies;
  }

  /**
   * Extrae el nombre completo de una competencia del encabezado
   */
  private extractCompetencyName(header: string): string {
    // Buscar patrones como "1. Compromiso: descripción"
    const match = header.match(/\d+\.\s*([^:]+)/);
    if (match) {
      return match[1].trim();
    }

    // Si no hay patrón numérico, buscar palabras clave
    const competencyMap: { [key: string]: string } = {
      'compromiso': 'Compromiso',
      'comunicación': 'Comunicación',
      'orientación': 'Orientación al Cliente',
      'colaboración': 'Colaboración',
      'iniciativa': 'Iniciativa y Autonomía',
      'resultados': 'Orientación a Resultados',
      'liderazgo': 'Liderazgo'
    };

    const lowerHeader = header.toLowerCase();
    for (const keyword in competencyMap) {
      if (lowerHeader.indexOf(keyword) !== -1) {
        return competencyMap[keyword];
      }
    }

    return '';
  }

  /**
   * Procesa los datos de todas las hojas detectadas
   */
  private processSheetData(structures: SheetStructure[]): ProcessedData {
    const evaluations: Evaluation[] = [];
    const competencies = this.extractUniqueCompetencies(structures);
    const evaluationTypes: EvaluationType[] = [];
    const employeeMap = new Map<string, Employee>();
    const areas = new Set<string>();

    // Procesar hojas de evaluaciones
    for (const structure of structures) {
      if (this.workbook) {
        const sheetEvaluations = this.processEvaluationSheet(structure);
        evaluations.push(...sheetEvaluations);
        
        if (evaluationTypes.indexOf(structure.type) === -1) {
          evaluationTypes.push(structure.type);
        }

        // Extraer empleados únicos de las evaluaciones
        for (const evaluation of sheetEvaluations) {
          if (evaluation.evaluatedName && evaluation.evaluatedArea) {
            const employeeKey = `${evaluation.evaluatedName}_${evaluation.evaluatedArea}`;
            
            if (!employeeMap.has(employeeKey)) {
              const { name, email, segmentation } = this.extractEmployeeName(evaluation.evaluatedName);
              
              // Usar segmentación si está disponible, sino usar datos de evaluación
              const employee: Employee = {
                id: `emp_${employeeMap.size + 1}`,
                email: email,
                name: name,
                area: segmentation?.area || evaluation.evaluatedArea,
                status: evaluation.status === 'Finalizada' ? 'Finalizado' : 'En curso',
                shareStatus: 'Compartida y confirmada',
                finalScore: evaluation.totalScore
              };
              
              employeeMap.set(employeeKey, employee);
              areas.add(employee.area);
            } else {
              // Actualizar puntaje final si es necesario
              const existingEmployee = employeeMap.get(employeeKey)!;
              if (evaluation.totalScore && (!existingEmployee.finalScore || evaluation.totalScore > existingEmployee.finalScore)) {
                existingEmployee.finalScore = evaluation.totalScore;
              }
            }
          }
        }
      }
    }

    const employees = Array.from(employeeMap.values());

    const metadata: DataMetadata = {
      totalEmployees: employees.length,
      totalEvaluations: evaluations.length,
      evaluationTypes,
      areas: Array.from(areas),
      competencyNames: competencies.map(c => c.name)
    };

    return {
      employees,
      evaluations,
      competencies,
      sheetStructures: structures,
      metadata
    };
  }

  /**
   * Extrae competencias únicas de todas las estructuras
   */
  private extractUniqueCompetencies(structures: SheetStructure[]): Competency[] {
    const competencyNames = new Set<string>();
    
    structures.forEach(structure => {
      structure.competencies.forEach(comp => competencyNames.add(comp));
    });

    return Array.from(competencyNames).map((name, index) => ({
      id: `comp_${index}`,
      name,
      description: '',
      questions: []
    }));
  }

  /**
   * Procesa la hoja de resumen de usuarios evaluados
   */
  private processSummarySheet(structure: SheetStructure): { employees: Employee[] } {
    if (!this.workbook) return { employees: [] };

    const sheet = this.workbook.Sheets[structure.name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const employees: Employee[] = [];

    for (let i = structure.dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const emailOrName = String(row[structure.columns.evaluatedName] || row[0] || '');
      const { name, email } = this.extractEmployeeName(emailOrName);
      
      const employee: Employee = {
        id: `emp_${i}`,
        email: email,
        name: name,
        area: String(row[structure.columns.evaluatedArea] || ''),
        status: String(row[structure.columns.status] || '') as 'En curso' | 'Finalizado',
        shareStatus: 'Compartida y confirmada',
        finalScore: structure.columns.totalScore !== undefined ? 
          Number(row[structure.columns.totalScore]) || 0 : undefined
      };

      if (employee.name && employee.area) {
        employees.push(employee);
      }
    }

    return { employees };
  }

  /**
   * Procesa una hoja de evaluaciones específica
   */
  private processEvaluationSheet(structure: SheetStructure): Evaluation[] {
    if (!this.workbook) return [];

    const sheet = this.workbook.Sheets[structure.name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const evaluations: Evaluation[] = [];

    for (let i = structure.dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const evaluatedEmailOrName = String(row[structure.columns.evaluatedName] || row[0] || '');
      const { name: evaluatedName } = this.extractEmployeeName(evaluatedEmailOrName);
      
      const evaluation: Evaluation = {
        id: `eval_${structure.type}_${i}`,
        evaluatedId: String(row[0] || ''),
        evaluatedName: evaluatedName,
        evaluatedArea: String(row[structure.columns.evaluatedArea] || ''),
        evaluatorName: structure.columns.evaluatorName !== undefined ? 
          String(row[structure.columns.evaluatorName] || '') : undefined,
        type: structure.type,
        status: String(row[structure.columns.status] || '') as 'Finalizada' | 'Pendiente' | 'En curso',
        totalScore: structure.columns.totalScore !== undefined ? 
          Number(row[structure.columns.totalScore]) || 0 : undefined,
        competencies: this.extractCompetencyScores(row, structure)
      };

      if (evaluation.evaluatedName) {
        evaluations.push(evaluation);
      }
    }

    return evaluations;
  }

  /**
   * Extrae los puntajes de competencias de una fila
   */
  private extractCompetencyScores(row: any[], structure: SheetStructure): CompetencyScore[] {
    const competencyScores: CompetencyScore[] = [];
    
    // Esta función necesitaría ser más sofisticada para extraer
    // los puntajes individuales de cada competencia y pregunta
    // Por ahora, retornamos un array vacío
    
    return competencyScores;
  }
}

// Función helper para crear una instancia del parser
export const createExcelParser = () => new ExcelParser();
