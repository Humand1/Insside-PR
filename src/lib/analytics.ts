import {
  ProcessedData,
  AnalyticsResults,
  CompletionMetrics,
  AreaComparison,
  TalentHeatMap,
  UpwardFeedbackAnalysis,
  PeerEvaluationMatrix,
  EvaluationType,
  Employee,
  Evaluation
} from './types';

export class PerformanceAnalytics {
  private data: ProcessedData;

  constructor(data: ProcessedData) {
    this.data = data;
  }

  /**
   * Genera todos los análisis de performance
   */
  generateAnalytics(): AnalyticsResults {
    return {
      completionMetrics: this.calculateCompletionMetrics(),
      areaComparisons: this.generateAreaComparisons(),
      talentHeatMap: this.generateTalentHeatMap(),
      upwardFeedback: this.analyzeUpwardFeedback(),
      peerMatrix: this.analyzePeerEvaluations(),
      insights: this.generateInsights(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calcula métricas de completitud de evaluaciones
   */
  private calculateCompletionMetrics(): CompletionMetrics {
    const metrics: CompletionMetrics = {
      byType: {},
      byArea: {},
      overall: {
        completed: 0,
        pending: 0,
        total: 0,
        completionRate: 0
      }
    };

    // Métricas por tipo de evaluación
    for (const type of this.data.metadata.evaluationTypes) {
      const typeEvaluations = this.data.evaluations.filter(e => e.type === type);
      const completed = typeEvaluations.filter(e => e.status === 'Finalizada').length;
      const pending = typeEvaluations.filter(e => e.status === 'Pendiente' || e.status === 'En curso').length;
      const total = typeEvaluations.length;

      metrics.byType[type] = {
        completed,
        pending,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    }

    // Métricas por área
    for (const area of this.data.metadata.areas) {
      const areaEvaluations = this.data.evaluations.filter(e => e.evaluatedArea === area);
      const completed = areaEvaluations.filter(e => e.status === 'Finalizada').length;
      const pending = areaEvaluations.filter(e => e.status === 'Pendiente' || e.status === 'En curso').length;
      const total = areaEvaluations.length;

      metrics.byArea[area] = {
        completed,
        pending,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      };
    }

    // Métricas generales
    const allCompleted = this.data.evaluations.filter(e => e.status === 'Finalizada').length;
    const allPending = this.data.evaluations.filter(e => e.status === 'Pendiente' || e.status === 'En curso').length;
    const allTotal = this.data.evaluations.length;

    metrics.overall = {
      completed: allCompleted,
      pending: allPending,
      total: allTotal,
      completionRate: allTotal > 0 ? (allCompleted / allTotal) * 100 : 0
    };

    return metrics;
  }

  /**
   * Genera comparaciones por área
   */
  private generateAreaComparisons(): AreaComparison[] {
    const comparisons: AreaComparison[] = [];

    for (const area of this.data.metadata.areas) {
      const areaEmployees = this.data.employees.filter(e => e.area === area);
      const areaScores = areaEmployees
        .map(e => e.finalScore)
        .filter((score): score is number => score !== undefined);

      if (areaScores.length === 0) continue;

      const averageScore = areaScores.reduce((sum, score) => sum + score, 0) / areaScores.length;
      
      // Distribución de puntajes
      const scoreDistribution = {
        excellent: areaScores.filter(s => s >= 90).length,
        good: areaScores.filter(s => s >= 80 && s < 90).length,
        average: areaScores.filter(s => s >= 70 && s < 80).length,
        poor: areaScores.filter(s => s < 70).length
      };

      // Top performer del área
      const topPerformer = areaEmployees.reduce((top, emp) => {
        if (!emp.finalScore) return top;
        if (!top.finalScore || emp.finalScore > top.finalScore) return emp;
        return top;
      }, areaEmployees[0]);

      // Fortalezas y debilidades por competencia (simplificado)
      const competencyStrengths = this.getAreaCompetencyStrengths(area);
      const competencyWeaknesses = this.getAreaCompetencyWeaknesses(area);

      comparisons.push({
        area,
        employeeCount: areaEmployees.length,
        averageScore,
        scoreDistribution,
        topPerformer: {
          name: topPerformer.name,
          score: topPerformer.finalScore || 0
        },
        competencyStrengths,
        competencyWeaknesses
      });
    }

    return comparisons.sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Genera el mapa de calor de talento
   */
  private generateTalentHeatMap(): TalentHeatMap[] {
    const heatMap: TalentHeatMap[] = [];

    for (const employee of this.data.employees) {
      if (!employee.finalScore) continue;

      const performanceLevel = this.getPerformanceLevel(employee.finalScore);
      const riskLevel = this.getRiskLevel(employee.finalScore, employee.area);
      const competencyScores = this.getEmployeeCompetencyScores(employee);
      const recommendations = this.generateEmployeeRecommendations(employee, competencyScores);

      heatMap.push({
        employee: employee.name,
        area: employee.area,
        overallScore: employee.finalScore,
        performanceLevel,
        competencyScores,
        riskLevel,
        recommendations
      });
    }

    return heatMap.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Analiza el feedback ascendente (subordinados evaluando jefes)
   */
  private analyzeUpwardFeedback(): UpwardFeedbackAnalysis[] {
    const upwardAnalysis: UpwardFeedbackAnalysis[] = [];
    const upwardEvaluations = this.data.evaluations.filter(e => e.type === 'ascendente');

    // Agrupar por manager (evaluado en evaluaciones ascendentes)
    const managerGroups = new Map<string, Evaluation[]>();
    
    for (const evaluation of upwardEvaluations) {
      const managerId = evaluation.evaluatedId;
      if (!managerGroups.has(managerId)) {
        managerGroups.set(managerId, []);
      }
      managerGroups.get(managerId)!.push(evaluation);
    }

    for (const [managerId, evaluations] of managerGroups) {
      const manager = this.data.employees.find(e => e.id === managerId);
      if (!manager) continue;

      const scores = evaluations
        .map(e => e.totalScore)
        .filter((score): score is number => score !== undefined);

      if (scores.length === 0) continue;

      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const competencyBreakdown = this.getManagerCompetencyBreakdown(evaluations);
      const strengths = this.getManagerStrengths(competencyBreakdown);
      const improvementAreas = this.getManagerImprovementAreas(competencyBreakdown);

      upwardAnalysis.push({
        managerId,
        managerName: manager.name,
        area: manager.area,
        feedbackCount: evaluations.length,
        averageScore,
        competencyBreakdown,
        strengths,
        improvementAreas,
        teamSatisfaction: this.calculateTeamSatisfaction(averageScore)
      });
    }

    return upwardAnalysis.sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Analiza las evaluaciones de pares
   */
  private analyzePeerEvaluations(): PeerEvaluationMatrix {
    const peerEvaluations = this.data.evaluations.filter(e => e.type === 'pares');
    
    const evaluations = peerEvaluations.map(e => ({
      evaluator: e.evaluatorName || 'Anónimo',
      evaluated: e.evaluatedName,
      area: e.evaluatedArea,
      score: e.totalScore || 0,
      completed: e.status === 'Finalizada'
    }));

    const completed = evaluations.filter(e => e.completed).length;
    const total = evaluations.length;

    // Análisis de reciprocidad (simplificado)
    const mutual = this.calculateMutualEvaluations(evaluations);
    const oneWay = total - mutual;

    return {
      evaluations,
      coverage: {
        requested: total,
        completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      },
      reciprocity: {
        mutual,
        oneWay
      }
    };
  }

  /**
   * Genera insights automáticos
   */
  private generateInsights(): string[] {
    const insights: string[] = [];
    const completionMetrics = this.calculateCompletionMetrics();
    const areaComparisons = this.generateAreaComparisons();

    // Insight sobre completitud
    if (completionMetrics.overall.completionRate < 80) {
      insights.push(`La tasa de completitud general es del ${completionMetrics.overall.completionRate.toFixed(1)}%, se recomienda hacer seguimiento para mejorar la participación.`);
    }

    // Insight sobre áreas top
    if (areaComparisons.length > 0) {
      const topArea = areaComparisons[0];
      insights.push(`${topArea.area} es el área con mejor desempeño promedio (${topArea.averageScore.toFixed(1)} puntos).`);
    }

    // Insight sobre distribución de talento
    const heatMap = this.generateTalentHeatMap();
    const topPerformers = heatMap.filter(h => h.performanceLevel === 'Top Performer').length;
    const criticalPerformers = heatMap.filter(h => h.performanceLevel === 'Critical').length;

    if (topPerformers > 0) {
      insights.push(`Se identificaron ${topPerformers} top performers en la organización.`);
    }

    if (criticalPerformers > 0) {
      insights.push(`${criticalPerformers} empleados requieren atención inmediata por bajo desempeño.`);
    }

    return insights;
  }

  /**
   * Genera recomendaciones estratégicas
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const completionMetrics = this.calculateCompletionMetrics();
    const upwardFeedback = this.analyzeUpwardFeedback();

    // Recomendaciones sobre completitud
    for (const [type, metrics] of Object.entries(completionMetrics.byType)) {
      if (metrics && metrics.completionRate < 70) {
        recommendations.push(`Implementar recordatorios y seguimiento para evaluaciones ${type} (${metrics.completionRate.toFixed(1)}% completitud).`);
      }
    }

    // Recomendaciones sobre liderazgo
    const lowScoringManagers = upwardFeedback.filter(m => m.averageScore < 70);
    if (lowScoringManagers.length > 0) {
      recommendations.push(`${lowScoringManagers.length} líderes necesitan coaching en habilidades de liderazgo.`);
    }

    // Recomendaciones generales
    recommendations.push('Implementar planes de desarrollo individualizados basados en los resultados de competencias.');
    recommendations.push('Establecer programas de mentoring entre top performers y empleados en desarrollo.');

    return recommendations;
  }

  // Métodos auxiliares
  private getPerformanceLevel(score: number): TalentHeatMap['performanceLevel'] {
    if (score >= 95) return 'Top Performer';
    if (score >= 85) return 'High Performer';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Needs Improvement';
    return 'Critical';
  }

  private getRiskLevel(score: number, area: string): 'Low' | 'Medium' | 'High' {
    if (score >= 80) return 'Low';
    if (score >= 65) return 'Medium';
    return 'High';
  }

  private getEmployeeCompetencyScores(employee: Employee): { [competency: string]: number } {
    // Simplificado - en una implementación real, extraería los puntajes por competencia
    const scores: { [competency: string]: number } = {};
    
    for (const competency of this.data.competencies) {
      scores[competency.name] = employee.finalScore || 0;
    }

    return scores;
  }

  private generateEmployeeRecommendations(employee: Employee, competencyScores: { [competency: string]: number }): string[] {
    const recommendations: string[] = [];
    
    if (employee.finalScore && employee.finalScore < 70) {
      recommendations.push('Requiere plan de mejora inmediato');
      recommendations.push('Asignar mentor senior');
    }

    return recommendations;
  }

  private getAreaCompetencyStrengths(area: string): string[] {
    // Simplificado - retorna competencias genéricas
    return ['Compromiso', 'Orientación a Resultados'];
  }

  private getAreaCompetencyWeaknesses(area: string): string[] {
    // Simplificado - retorna competencias genéricas
    return ['Comunicación', 'Liderazgo'];
  }

  private getManagerCompetencyBreakdown(evaluations: Evaluation[]): { [competency: string]: { score: number; feedbackCount: number } } {
    const breakdown: { [competency: string]: { score: number; feedbackCount: number } } = {};
    
    // Simplificado - en implementación real extraería puntajes por competencia
    for (const competency of this.data.competencies) {
      breakdown[competency.name] = {
        score: 75, // Valor por defecto
        feedbackCount: evaluations.length
      };
    }

    return breakdown;
  }

  private getManagerStrengths(competencyBreakdown: { [competency: string]: { score: number; feedbackCount: number } }): string[] {
    return Object.entries(competencyBreakdown)
      .filter(([_, data]) => data.score >= 80)
      .map(([competency]) => competency);
  }

  private getManagerImprovementAreas(competencyBreakdown: { [competency: string]: { score: number; feedbackCount: number } }): string[] {
    return Object.entries(competencyBreakdown)
      .filter(([_, data]) => data.score < 70)
      .map(([competency]) => competency);
  }

  private calculateTeamSatisfaction(averageScore: number): number {
    // Convierte el puntaje promedio a un índice de satisfacción del equipo
    return Math.min(100, (averageScore / 100) * 100);
  }

  private calculateMutualEvaluations(evaluations: { evaluator: string; evaluated: string; area: string; score: number; completed: boolean }[]): number {
    // Simplificado - cuenta evaluaciones mutuas
    let mutual = 0;
    
    for (const eval1 of evaluations) {
      for (const eval2 of evaluations) {
        if (eval1.evaluator === eval2.evaluated && eval1.evaluated === eval2.evaluator) {
          mutual++;
          break;
        }
      }
    }

    return Math.floor(mutual / 2); // Dividir por 2 porque cada par se cuenta dos veces
  }
}

// Función helper para crear una instancia del analizador
export const createAnalytics = (data: ProcessedData) => new PerformanceAnalytics(data);
