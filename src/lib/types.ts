// Tipos principales para el sistema de evaluación 360°

export interface Employee {
  id: string;
  email: string;
  name: string;
  area: string;
  manager?: string;
  status: 'En curso' | 'Finalizado';
  shareStatus: 'Compartida y confirmada' | 'Compartida sin confirmar' | 'No compartida';
  finalScore?: number;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  score: number;
  comment?: string;
}

export interface Evaluation {
  id: string;
  evaluatedId: string;
  evaluatedName: string;
  evaluatedArea: string;
  evaluatorId?: string;
  evaluatorName?: string;
  type: EvaluationType;
  status: 'Finalizada' | 'Pendiente' | 'En curso';
  date?: string;
  totalScore?: number;
  competencies: CompetencyScore[];
}

export interface CompetencyScore {
  competencyName: string;
  questions: QuestionScore[];
  averageScore: number;
}

export interface QuestionScore {
  questionText: string;
  score: number;
  comment?: string;
}

export type EvaluationType = 
  | 'autoevaluacion' 
  | 'descendente' 
  | 'ascendente' 
  | 'pares';

export interface SheetStructure {
  name: string;
  type: EvaluationType;
  columns: ColumnMapping;
  dataStartRow: number;
  competencies: string[];
}

export interface ColumnMapping {
  evaluatedName: number;
  evaluatedArea: number;
  evaluatorName?: number;
  status: number;
  totalScore?: number;
  [key: string]: number | string | undefined;
}

export interface ProcessedData {
  employees: Employee[];
  evaluations: Evaluation[];
  competencies: Competency[];
  sheetStructures: SheetStructure[];
  metadata: DataMetadata;
}

export interface DataMetadata {
  totalEmployees: number;
  totalEvaluations: number;
  evaluationTypes: EvaluationType[];
  areas: string[];
  competencyNames: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Tipos para análisis y métricas
export interface CompletionMetrics {
  byType: {
    [key in EvaluationType]?: {
      completed: number;
      pending: number;
      total: number;
      completionRate: number;
    };
  };
  byArea: {
    [area: string]: {
      completed: number;
      pending: number;
      total: number;
      completionRate: number;
    };
  };
  overall: {
    completed: number;
    pending: number;
    total: number;
    completionRate: number;
  };
}

export interface AreaComparison {
  area: string;
  employeeCount: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 90-100
    good: number;      // 80-89
    average: number;   // 70-79
    poor: number;      // <70
  };
  topPerformer: {
    name: string;
    score: number;
  };
  competencyStrengths: string[];
  competencyWeaknesses: string[];
}

export interface TalentHeatMap {
  employee: string;
  area: string;
  overallScore: number;
  performanceLevel: 'Top Performer' | 'High Performer' | 'Average' | 'Needs Improvement' | 'Critical';
  competencyScores: {
    [competency: string]: number;
  };
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendations: string[];
}

export interface UpwardFeedbackAnalysis {
  managerId: string;
  managerName: string;
  area: string;
  feedbackCount: number;
  averageScore: number;
  competencyBreakdown: {
    [competency: string]: {
      score: number;
      feedbackCount: number;
    };
  };
  strengths: string[];
  improvementAreas: string[];
  teamSatisfaction: number;
}

export interface PeerEvaluationMatrix {
  evaluations: {
    evaluator: string;
    evaluated: string;
    area: string;
    score: number;
    completed: boolean;
  }[];
  coverage: {
    requested: number;
    completed: number;
    completionRate: number;
  };
  reciprocity: {
    mutual: number;
    oneWay: number;
  };
}

export interface AnalyticsResults {
  completionMetrics: CompletionMetrics;
  areaComparisons: AreaComparison[];
  talentHeatMap: TalentHeatMap[];
  upwardFeedback: UpwardFeedbackAnalysis[];
  peerMatrix: PeerEvaluationMatrix;
  insights: string[];
  recommendations: string[];
}

// Tipos para configuración y UI
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'heatmap';
  title: string;
  data: any;
  options?: any;
}

export interface DashboardSection {
  id: string;
  title: string;
  description: string;
  charts: ChartConfig[];
  priority: number;
  visible: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}

// Tipos para errores y validación
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ProcessingResult {
  success: boolean;
  data?: ProcessedData;
  errors: ValidationError[];
  warnings: ValidationError[];
}
