import { useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { RiskScoringEngine, RiskScore } from '@/lib/riskScoring';
import { GraphAnalytics } from '@/lib/graphAnalytics';

export function useRiskScoring() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const engine = useMemo(() => {
    if (nodes.length === 0) return null;
    return new RiskScoringEngine(nodes, edges);
  }, [nodes, edges]);

  const analytics = useMemo(() => {
    if (nodes.length === 0) return null;
    return new GraphAnalytics(nodes, edges);
  }, [nodes, edges]);

  const calculateNodeRisk = (nodeId: string): RiskScore | null => {
    if (!engine) return null;
    try {
      return engine.calculateRiskScore(nodeId);
    } catch {
      return null;
    }
  };

  const getHighRiskNodes = (limit: number = 10) => {
    if (!engine) return [];
    return engine.getHighestRiskNodes(limit);
  };

  const getCriticalNodes = (threshold: number = 0.7) => {
    if (!analytics) return [];
    return analytics.getCriticalNodes(threshold);
  };

  const getNodeCentrality = (nodeId: string) => {
    if (!analytics) return null;
    try {
      return analytics.calculateCentralityScores(nodeId);
    } catch {
      return null;
    }
  };

  const getNodeDependencies = (nodeId: string) => {
    if (!analytics) return null;
    try {
      return analytics.calculateDependencyMetrics(nodeId);
    } catch {
      return null;
    }
  };

  return {
    engine,
    analytics,
    calculateNodeRisk,
    getHighRiskNodes,
    getCriticalNodes,
    getNodeCentrality,
    getNodeDependencies,
  };
}