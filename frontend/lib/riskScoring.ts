import type { GraphNode, GraphEdge } from '@/types/graph';
import { GraphAnalytics } from './graphAnalytics';

export interface RiskFactors {
  centralityRisk: number;
  dependencyRisk: number;
  maintainerRisk: number;
  vulnerabilityRisk: number;
}

export interface RiskScore {
  overall: number;
  factors: RiskFactors;
  confidence: number;
  recommendations: string[];
}

export interface RiskConfig {
  weights: {
    centrality: number;
    dependency: number;
    maintainer: number;
    vulnerability: number;
  };
  thresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

const DEFAULT_CONFIG: RiskConfig = {
  weights: {
    centrality: 0.35,
    dependency: 0.30,
    maintainer: 0.20,
    vulnerability: 0.15,
  },
  thresholds: {
    high: 0.7,
    medium: 0.4,
    low: 0.0,
  },
};

export class RiskScoringEngine {
  private analytics: GraphAnalytics;
  private nodes: GraphNode[];
  private config: RiskConfig;

  constructor(
    nodes: GraphNode[],
    edges: GraphEdge[],
    config: RiskConfig = DEFAULT_CONFIG
  ) {
    this.nodes = nodes;
    this.config = config;
    this.analytics = new GraphAnalytics(nodes, edges);
  }

  calculateRiskScore(nodeId: string): RiskScore {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const factors = this.calculateRiskFactors(nodeId);
    const overall = this.calculateCompositeRisk(factors);
    const confidence = this.calculateConfidence(node);
    const recommendations = this.generateRecommendations(overall, factors);

    return { overall, factors, confidence, recommendations };
  }

  private calculateRiskFactors(nodeId: string): RiskFactors {
    return {
      centralityRisk: this.calculateCentralityRisk(nodeId),
      dependencyRisk: this.calculateDependencyRisk(nodeId),
      maintainerRisk: this.calculateMaintainerRisk(nodeId),
      vulnerabilityRisk: this.calculateVulnerabilityRisk(nodeId),
    };
  }

  private calculateCentralityRisk(nodeId: string): number {
    const scores = this.analytics.calculateCentralityScores(nodeId);
    const centralityScore =
      scores.degree * 0.25 +
      scores.betweenness * 0.35 +
      scores.closeness * 0.2 +
      scores.pageRank * 0.2;
    return Math.min(centralityScore, 1);
  }

  private calculateDependencyRisk(nodeId: string): number {
    const metrics = this.analytics.calculateDependencyMetrics(nodeId);
    const depthRisk = Math.min(metrics.depth / 10, 1);
    const totalDepsRisk = Math.min(metrics.totalDependencies / 50, 1);
    const dependentsRisk = Math.min(metrics.dependents / 20, 1);
    return depthRisk * 0.4 + totalDepsRisk * 0.3 + dependentsRisk * 0.3;
  }

  private calculateMaintainerRisk(nodeId: string): number {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node || !node.metadata) return 0.5;

    const metadata = node.metadata as Record<string, unknown>;
    let risk = 0;
    let factorsConsidered = 0;

    if (metadata.createdAt) {
      const createdAt = this.safeDate(metadata.createdAt);
      if (createdAt) {
        const age = Date.now() - createdAt.getTime();
        const ageInYears = age / (1000 * 60 * 60 * 24 * 365);
        if (ageInYears > 5) risk += 0.3;
        else if (ageInYears > 2) risk += 0.15;
        factorsConsidered++;
      }
    }

    if (metadata.lastUpdated) {
      const lastUpdated = this.safeDate(metadata.lastUpdated);
      if (lastUpdated) {
        const daysSinceUpdate =
          (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 365) risk += 0.4;
        else if (daysSinceUpdate > 180) risk += 0.2;
        factorsConsidered++;
      }
    }

    if (typeof metadata.maintainerCount === 'number') {
      if (metadata.maintainerCount === 0) risk += 0.5;
      else if (metadata.maintainerCount === 1) risk += 0.3;
      else if (metadata.maintainerCount < 3) risk += 0.1;
      factorsConsidered++;
    }

    if (typeof metadata.activityScore === 'number') {
      const activityRisk = 1 - Math.min(metadata.activityScore, 1);
      risk += activityRisk * 0.3;
      factorsConsidered++;
    }

    return factorsConsidered > 0 ? Math.min(risk / factorsConsidered, 1) : 0.5;
  }

  private calculateVulnerabilityRisk(nodeId: string): number {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node || !node.metadata) return 0;

    const metadata = node.metadata as Record<string, unknown>;
    let risk = 0;

    if (typeof metadata.vulnerabilityCount === 'number') {
      const count = metadata.vulnerabilityCount;
      if (count > 5) risk = 0.9;
      else if (count > 2) risk = 0.6;
      else if (count > 0) risk = 0.3;
    }

    if (
      typeof metadata.criticalVulnerabilities === 'number' &&
      metadata.criticalVulnerabilities > 0
    ) {
      risk = Math.max(risk, 0.95);
    }

    if (metadata.securityAudit === false) {
      risk += 0.2;
    }

    return Math.min(risk, 1);
  }

  private calculateCompositeRisk(factors: RiskFactors): number {
    const { weights } = this.config;
    const composite =
      factors.centralityRisk * weights.centrality +
      factors.dependencyRisk * weights.dependency +
      factors.maintainerRisk * weights.maintainer +
      factors.vulnerabilityRisk * weights.vulnerability;
    return Math.min(composite, 1);
  }

  private calculateConfidence(node: GraphNode): number {
    let confidence = 0.5;
    const metadata = (node.metadata || {}) as Record<string, unknown>;
    confidence += Math.min(Object.keys(metadata).length / 10, 0.3);

    if (metadata.lastUpdated) {
      const lastUpdated = this.safeDate(metadata.lastUpdated);
      if (lastUpdated) {
        const daysSinceUpdate =
          (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) confidence += 0.2;
        else if (daysSinceUpdate < 90) confidence += 0.1;
      }
    }

    return Math.min(confidence, 1);
  }

  private generateRecommendations(
    overall: number,
    factors: RiskFactors
  ): string[] {
    const recommendations: string[] = [];

    if (overall > this.config.thresholds.high)
      recommendations.push('🔴 High Risk: Immediate review recommended');
    else if (overall > this.config.thresholds.medium)
      recommendations.push('🟡 Medium Risk: Schedule review');
    else recommendations.push('🟢 Low Risk: Monitor periodically');

    if (factors.centralityRisk > 0.7)
      recommendations.push('Critical node: Consider redundancy or backup');
    if (factors.dependencyRisk > 0.7)
      recommendations.push('Deep dependency tree: Review and minimize dependencies');
    if (factors.maintainerRisk > 0.7)
      recommendations.push(
        'Maintenance concerns: Check for alternatives or plan migration'
      );
    if (factors.vulnerabilityRisk > 0.5)
      recommendations.push(
        'Security vulnerabilities detected: Update or patch immediately'
      );

    return recommendations;
  }

  static getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score > 0.9) return 'critical';
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  static getRiskColor(score: number): string {
    if (score > 0.9) return '#dc2626';
    if (score > 0.7) return '#ea580c';
    if (score > 0.4) return '#f59e0b';
    return '#10b981';
  }

  calculateAllRiskScores(): Map<string, RiskScore> {
    const scores = new Map<string, RiskScore>();
    this.nodes.forEach((node) =>
      scores.set(node.id, this.calculateRiskScore(node.id))
    );
    return scores;
  }

  getHighestRiskNodes(
    limit = 10
  ): Array<{ node: GraphNode; riskScore: RiskScore }> {
    return this.nodes
      .map((node) => ({ node, riskScore: this.calculateRiskScore(node.id) }))
      .sort((a, b) => b.riskScore.overall - a.riskScore.overall)
      .slice(0, limit);
  }

  private safeDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return undefined;
  }
}