import type { GraphNode, GraphEdge } from '@/types/graph';
import type {
  CyberNode,
  CyberEdge,
  IPNodeMetadata,
  ThreatNodeMetadata,
  VulnerabilityNodeMetadata,
  ThreatSeverity,
  AttackPath,
  AttackTechnique,
  CyberRelationType,
} from '@/types/cyber';

export class CyberIntelligenceAnalyzer {
  private nodes: CyberNode[];
  private edges: CyberEdge[];

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes as CyberNode[];
    this.edges = edges as CyberEdge[];
  }

  /**
   * Get all IP nodes
   */
  getIPNodes(): CyberNode[] {
    return this.nodes.filter(node => node.type === 'ip');
  }

  /**
   * Get all threat nodes
   */
  getThreatNodes(): CyberNode[] {
    return this.nodes.filter(node => node.type === 'threat');
  }

  /**
   * Get all vulnerability nodes
   */
  getVulnerabilityNodes(): CyberNode[] {
    return this.nodes.filter(node => node.type === 'vulnerability');
  }

  /**
   * Get malicious IPs
   */
  getMaliciousIPs(): CyberNode[] {
    return this.getIPNodes().filter(node => {
      const metadata = node.metadata as IPNodeMetadata;
      return metadata?.isMalicious === true || (metadata?.reputation ?? 100) < 50;
    });
  }

  /**
   * Get active threats
   */
  getActiveThreats(): CyberNode[] {
    return this.getThreatNodes().filter(node => {
      const metadata = node.metadata as ThreatNodeMetadata;
      return metadata?.isActive === true;
    });
  }

  /**
   * Get critical vulnerabilities
   */
  getCriticalVulnerabilities(): CyberNode[] {
    return this.getVulnerabilityNodes().filter(node => {
      const metadata = node.metadata as VulnerabilityNodeMetadata;
      return metadata?.severity === 'critical';
    });
  }

  /**
   * Get exploitable vulnerabilities
   */
  getExploitableVulnerabilities(): CyberNode[] {
    return this.getVulnerabilityNodes().filter(node => {
      const metadata = node.metadata as VulnerabilityNodeMetadata;
      return metadata?.exploitAvailable === true || metadata?.exploitedInWild === true;
    });
  }

  /**
   * Find targets of a threat
   */
  getThreatTargets(threatId: string): CyberNode[] {
    const targetEdges = this.edges.filter(
      edge => edge.source === threatId && edge.relationType === 'targets'
    );
    
    return targetEdges
      .map(edge => this.nodes.find(node => node.id === edge.target))
      .filter(Boolean) as CyberNode[];
  }

  /**
   * Find vulnerabilities exploited by a threat
   */
  getThreatExploits(threatId: string): CyberNode[] {
    const exploitEdges = this.edges.filter(
      edge => edge.source === threatId && edge.relationType === 'exploits'
    );
    
    return exploitEdges
      .map(edge => this.nodes.find(node => node.id === edge.target))
      .filter(Boolean) as CyberNode[];
  }

  /**
   * Find what targets a vulnerability affects
   */
  getVulnerabilityTargets(vulnId: string): CyberNode[] {
    const affectEdges = this.edges.filter(
      edge => edge.source === vulnId && edge.relationType === 'affects'
    );
    
    return affectEdges
      .map(edge => this.nodes.find(node => node.id === edge.target))
      .filter(Boolean) as CyberNode[];
  }

  /**
   * Find threats targeting a specific asset
   */
  getThreatsTargeting(assetId: string): CyberNode[] {
    const threatEdges = this.edges.filter(
      edge => edge.target === assetId && edge.relationType === 'targets'
    );
    
    return threatEdges
      .map(edge => this.nodes.find(node => node.id === edge.source))
      .filter(node => node?.type === 'threat') as CyberNode[];
  }

  /**
   * Find vulnerabilities affecting an asset
   */
  getVulnerabilitiesAffecting(assetId: string): CyberNode[] {
    const vulnEdges = this.edges.filter(
      edge => edge.target === assetId && edge.relationType === 'affects'
    );
    
    return vulnEdges
      .map(edge => this.nodes.find(node => node.id === edge.source))
      .filter(node => node?.type === 'vulnerability') as CyberNode[];
  }

  /**
   * Calculate threat score for a node
   */
  calculateThreatScore(nodeId: string): number {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    let score = 0;

    // Direct threats
    const threats = this.getThreatsTargeting(nodeId);
    const activeThreats = threats.filter(t => {
      const metadata = t.metadata as ThreatNodeMetadata;
      return metadata?.isActive;
    });
    score += activeThreats.length * 0.3;

    // Vulnerabilities
    const vulns = this.getVulnerabilitiesAffecting(nodeId);
    const criticalVulns = vulns.filter(v => {
      const metadata = v.metadata as VulnerabilityNodeMetadata;
      return metadata?.severity === 'critical';
    });
    score += criticalVulns.length * 0.4;

    // Malicious IPs communicating
    const maliciousIPs = this.edges
      .filter(edge => 
        (edge.source === nodeId || edge.target === nodeId) &&
        edge.relationType === 'communicates_with'
      )
      .map(edge => {
        const otherId = edge.source === nodeId ? edge.target : edge.source;
        return this.nodes.find(n => n.id === otherId);
      })
      .filter(n => {
        if (!n || n.type !== 'ip') return false;
        const metadata = n.metadata as IPNodeMetadata;
        return metadata?.isMalicious === true;
      });
    score += maliciousIPs.length * 0.2;

    return Math.min(score, 1);
  }

  /**
   * Find attack paths from threat to target
   */
  findAttackPaths(
    threatId: string,
    targetId: string,
    maxDepth: number = 5
  ): AttackPath[] {
    const paths: AttackPath[] = [];
    const visited = new Set<string>();

    const dfs = (
      currentId: string,
      path: CyberNode[],
      edges: CyberEdge[],
      depth: number
    ) => {
      if (depth > maxDepth) return;
      if (currentId === targetId) {
        // Found a path
        const threat = this.nodes.find(n => n.id === threatId);
        const threatMetadata = threat?.metadata as ThreatNodeMetadata;
        
        paths.push({
          id: `path-${paths.length}`,
          name: `Attack Path ${paths.length + 1}`,
          nodes: [...path],
          edges: [...edges],
          severity: threatMetadata?.severity || 'medium',
          likelihood: this.calculatePathLikelihood(edges),
          impact: this.calculatePathImpact(path),
          techniques: this.extractTechniques(path),
          description: this.generatePathDescription(path, edges),
        });
        return;
      }

      if (visited.has(currentId)) return;
      visited.add(currentId);

      const currentNode = this.nodes.find(n => n.id === currentId);
      if (!currentNode) return;

      // Find outgoing edges
      const outEdges = this.edges.filter(e => e.source === currentId);
      
      for (const edge of outEdges) {
        const nextNode = this.nodes.find(n => n.id === edge.target);
        if (!nextNode) continue;

        dfs(
          edge.target,
          [...path, nextNode],
          [...edges, edge],
          depth + 1
        );
      }

      visited.delete(currentId);
    };

    const startNode = this.nodes.find(n => n.id === threatId);
    if (startNode) {
      dfs(threatId, [startNode], [], 0);
    }

    return paths;
  }

  /**
   * Calculate likelihood of attack path
   */
  private calculatePathLikelihood(edges: CyberEdge[]): number {
    if (edges.length === 0) return 0;
    
    const avgConfidence = edges.reduce((sum, edge) => 
      sum + (edge.confidence ?? 0.5), 0
    ) / edges.length;
    
    // Longer paths are less likely
    const lengthPenalty = Math.max(0, 1 - (edges.length * 0.1));
    
    return avgConfidence * lengthPenalty;
  }

  /**
   * Calculate impact of attack path
   */
  private calculatePathImpact(nodes: CyberNode[]): number {
    let impact = 0;
    
    nodes.forEach(node => {
      if (node.type === 'vulnerability') {
        const metadata = node.metadata as VulnerabilityNodeMetadata;
        const cvss = metadata?.cvssScore ?? 5;
        impact = Math.max(impact, cvss / 10);
      }
      
      if (node.type === 'threat') {
        const metadata = node.metadata as ThreatNodeMetadata;
        const severityMap = { critical: 1, high: 0.8, medium: 0.5, low: 0.3, info: 0.1 };
        impact = Math.max(impact, severityMap[metadata?.severity || 'medium']);
      }
    });
    
    return impact;
  }

  /**
   * Extract MITRE ATT&CK techniques from path
   */
  private extractTechniques(nodes: CyberNode[]): AttackTechnique[] {
    const techniques = new Set<AttackTechnique>();
    
    nodes.forEach(node => {
      if (node.type === 'threat') {
        const metadata = node.metadata as ThreatNodeMetadata;
        metadata?.techniques?.forEach(t => techniques.add(t));
      }
    });
    
    return Array.from(techniques);
  }

  /**
   * Generate human-readable path description
   */
  private generatePathDescription(nodes: CyberNode[], edges: CyberEdge[]): string {
    const steps: string[] = [];
    
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];
      
      const action = this.getActionDescription(edge.relationType);
      steps.push(`${sourceNode.label} ${action} ${targetNode.label}`);
    }
    
    return steps.join(' → ');
  }

  /**
   * Get human-readable action description
   */
  private getActionDescription(relationType?: CyberRelationType): string {
    const map: Record<string, string> = {
      targets: 'targets',
      exploits: 'exploits',
      affects: 'affects',
      communicates_with: 'communicates with',
      uses: 'uses',
      hosts: 'hosts',
    };
    
    return map[relationType || 'related_to'] || 'is related to';
  }

  /**
   * Get threat intelligence summary
   */
  getThreatIntelSummary() {
    const ips = this.getIPNodes();
    const threats = this.getThreatNodes();
    const vulns = this.getVulnerabilityNodes();
    
    return {
      totalIPs: ips.length,
      maliciousIPs: this.getMaliciousIPs().length,
      totalThreats: threats.length,
      activeThreats: this.getActiveThreats().length,
      totalVulnerabilities: vulns.length,
      criticalVulnerabilities: this.getCriticalVulnerabilities().length,
      exploitableVulnerabilities: this.getExploitableVulnerabilities().length,
    };
  }

  /**
   * Get nodes by severity
   */
  getNodesBySeverity(severity: ThreatSeverity): CyberNode[] {
    return this.nodes.filter(node => {
      if (node.type === 'threat') {
        const metadata = node.metadata as ThreatNodeMetadata;
        return metadata?.severity === severity;
      }
      if (node.type === 'vulnerability') {
        const metadata = node.metadata as VulnerabilityNodeMetadata;
        return metadata?.severity === severity;
      }
      return false;
    });
  }

  /**
   * Get most targeted assets
   */
  getMostTargetedAssets(limit: number = 10): Array<{ node: CyberNode; threatCount: number }> {
    const assetThreats = new Map<string, number>();
    
    this.edges
      .filter(edge => edge.relationType === 'targets' || edge.relationType === 'affects')
      .forEach(edge => {
        const current = assetThreats.get(edge.target) || 0;
        assetThreats.set(edge.target, current + 1);
      });
    
    return Array.from(assetThreats.entries())
      .map(([nodeId, threatCount]) => ({
        node: this.nodes.find(n => n.id === nodeId)!,
        threatCount,
      }))
      .filter(item => item.node)
      .sort((a, b) => b.threatCount - a.threatCount)
      .slice(0, limit);
  }
}