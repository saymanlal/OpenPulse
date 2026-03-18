import { useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { CyberIntelligenceAnalyzer } from '@/lib/cyberIntelligence';
import type { ThreatSeverity, AttackPath } from '@/types/cyber';

export function useCyberIntelligence() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const analyzer = useMemo(() => {
    if (nodes.length === 0) return null;
    return new CyberIntelligenceAnalyzer(nodes, edges);
  }, [nodes, edges]);

  const getIPNodes = () => {
    if (!analyzer) return [];
    return analyzer.getIPNodes();
  };

  const getThreatNodes = () => {
    if (!analyzer) return [];
    return analyzer.getThreatNodes();
  };

  const getVulnerabilityNodes = () => {
    if (!analyzer) return [];
    return analyzer.getVulnerabilityNodes();
  };

  const getMaliciousIPs = () => {
    if (!analyzer) return [];
    return analyzer.getMaliciousIPs();
  };

  const getActiveThreats = () => {
    if (!analyzer) return [];
    return analyzer.getActiveThreats();
  };

  const getCriticalVulnerabilities = () => {
    if (!analyzer) return [];
    return analyzer.getCriticalVulnerabilities();
  };

  const getExploitableVulnerabilities = () => {
    if (!analyzer) return [];
    return analyzer.getExploitableVulnerabilities();
  };

  const getThreatTargets = (threatId: string) => {
    if (!analyzer) return [];
    return analyzer.getThreatTargets(threatId);
  };

  const getThreatExploits = (threatId: string) => {
    if (!analyzer) return [];
    return analyzer.getThreatExploits(threatId);
  };

  const getVulnerabilityTargets = (vulnId: string) => {
    if (!analyzer) return [];
    return analyzer.getVulnerabilityTargets(vulnId);
  };

  const getThreatsTargeting = (assetId: string) => {
    if (!analyzer) return [];
    return analyzer.getThreatsTargeting(assetId);
  };

  const getVulnerabilitiesAffecting = (assetId: string) => {
    if (!analyzer) return [];
    return analyzer.getVulnerabilitiesAffecting(assetId);
  };

  const calculateThreatScore = (nodeId: string): number => {
    if (!analyzer) return 0;
    return analyzer.calculateThreatScore(nodeId);
  };

  const findAttackPaths = (
    threatId: string,
    targetId: string,
    maxDepth: number = 5
  ): AttackPath[] => {
    if (!analyzer) return [];
    return analyzer.findAttackPaths(threatId, targetId, maxDepth);
  };

  const getThreatIntelSummary = () => {
    if (!analyzer) return {
      totalIPs: 0,
      maliciousIPs: 0,
      totalThreats: 0,
      activeThreats: 0,
      totalVulnerabilities: 0,
      criticalVulnerabilities: 0,
      exploitableVulnerabilities: 0,
    };
    return analyzer.getThreatIntelSummary();
  };

  const getNodesBySeverity = (severity: ThreatSeverity) => {
    if (!analyzer) return [];
    return analyzer.getNodesBySeverity(severity);
  };

  const getMostTargetedAssets = (limit: number = 10) => {
    if (!analyzer) return [];
    return analyzer.getMostTargetedAssets(limit);
  };

  return {
    analyzer,
    getIPNodes,
    getThreatNodes,
    getVulnerabilityNodes,
    getMaliciousIPs,
    getActiveThreats,
    getCriticalVulnerabilities,
    getExploitableVulnerabilities,
    getThreatTargets,
    getThreatExploits,
    getVulnerabilityTargets,
    getThreatsTargeting,
    getVulnerabilitiesAffecting,
    calculateThreatScore,
    findAttackPaths,
    getThreatIntelSummary,
    getNodesBySeverity,
    getMostTargetedAssets,
  };
}