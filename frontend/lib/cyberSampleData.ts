// lib/cyberSampleData.ts
import type { CyberNode, CyberEdge, IPNodeMetadata, ThreatNodeMetadata, VulnerabilityNodeMetadata } from '@/types/cyber';
import { IPType, ThreatActorType, ThreatSeverity, VulnerabilitySeverity, AttackTechnique, CyberRelationType } from '@/types/cyber';

/**
 * Generate sample cyber intelligence graph
 */
export function generateCyberIntelGraph(config: {
  ipCount?: number;
  threatCount?: number;
  vulnCount?: number;
  assetCount?: number;
}): { nodes: CyberNode[]; edges: CyberEdge[] } {
  const { ipCount = 10, threatCount = 5, vulnCount = 8, assetCount = 12 } = config;

  const nodes: CyberNode[] = [];
  const edges: CyberEdge[] = [];
  let nodeId = 0;
  let edgeId = 0;

  // Generate IPs
  for (let i = 0; i < ipCount; i++) {
    const isMalicious = Math.random() > 0.6;
    const reputation = isMalicious ? Math.random() * 40 : 60 + Math.random() * 40;

    const metadata: IPNodeMetadata = {
      ipAddress: `${192 + Math.floor(Math.random() * 64)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      ipType: IPType.PUBLIC,
      isMalicious,
      reputation,
      geolocation: {
        country: ['US', 'CN', 'RU', 'KP', 'IR'][Math.floor(Math.random() * 5)],
        city: ['New York', 'Beijing', 'Moscow', 'Pyongyang', 'Tehran'][Math.floor(Math.random() * 5)],
      },
      ports: isMalicious ? [22, 80, 443, 3389] : [80, 443],
      services: isMalicious ? ['SSH', 'HTTP', 'RDP'] : ['HTTP', 'HTTPS'],
      lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    nodes.push({
      id: `ip-${nodeId++}`,
      label: metadata.ipAddress,
      type: 'ip',
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      metadata,
    });
  }

  // Generate Threats
  const threatNames = [
    'APT29 (Cozy Bear)',
    'APT28 (Fancy Bear)',
    'Lazarus Group',
    'Carbanak',
    'FIN7',
    'DarkSide',
    'REvil',
    'Conti',
  ];

  for (let i = 0; i < threatCount; i++) {
    const severities = [ThreatSeverity.CRITICAL, ThreatSeverity.HIGH, ThreatSeverity.MEDIUM, ThreatSeverity.LOW];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const metadata: ThreatNodeMetadata = {
      threatId: `THR-${1000 + i}`,
      threatName: threatNames[i % threatNames.length],
      threatType: [ThreatActorType.APT, ThreatActorType.CYBERCRIME, ThreatActorType.NATION_STATE][Math.floor(Math.random() * 3)],
      severity,
      isActive: Math.random() > 0.3,
      techniques: [
        AttackTechnique.INITIAL_ACCESS,
        AttackTechnique.EXECUTION,
        AttackTechnique.PERSISTENCE,
        AttackTechnique.PRIVILEGE_ESCALATION,
        AttackTechnique.CREDENTIAL_ACCESS,
      ].slice(0, 2 + Math.floor(Math.random() * 3)),
      targetedSectors: ['Financial', 'Healthcare', 'Government', 'Technology'],
      confidence: 60 + Math.random() * 40,
      firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    nodes.push({
      id: `threat-${nodeId++}`,
      label: metadata.threatName,
      type: 'threat',
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      metadata,
      riskScore:
        severity === ThreatSeverity.CRITICAL ? 0.9 :
        severity === ThreatSeverity.HIGH ? 0.7 :
        severity === ThreatSeverity.MEDIUM ? 0.5 : 0.3,
    });
  }

  // Generate Vulnerabilities
  const cweTypes = [
    'CWE-79: Cross-site Scripting',
    'CWE-89: SQL Injection',
    'CWE-78: OS Command Injection',
    'CWE-22: Path Traversal',
    'CWE-502: Deserialization',
    'CWE-434: Unrestricted Upload',
    'CWE-287: Authentication Bypass',
    'CWE-639: Insecure Direct Object Reference',
  ];

  for (let i = 0; i < vulnCount; i++) {
    const cvssScore = 3 + Math.random() * 7;
    const severity =
      cvssScore >= 9 ? VulnerabilitySeverity.CRITICAL :
      cvssScore >= 7 ? VulnerabilitySeverity.HIGH :
      cvssScore >= 4 ? VulnerabilitySeverity.MEDIUM : VulnerabilitySeverity.LOW;

    const metadata: VulnerabilityNodeMetadata = {
      cveId: `CVE-2024-${10000 + i}`,
      cweId: `CWE-${[79, 89, 78, 22, 502, 434, 287, 639][i % 8]}`,
      severity,
      cvssScore,
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      description: cweTypes[i % cweTypes.length],
      published: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      exploitAvailable: Math.random() > 0.6,
      exploitedInWild: Math.random() > 0.8,
      patchAvailable: Math.random() > 0.4,
    };

    nodes.push({
      id: `vuln-${nodeId++}`,
      label: metadata.cveId || `VULN-${i}`,
      type: 'vulnerability',
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      metadata,
      riskScore: cvssScore / 10,
    });
  }

  // Generate Assets (services, libraries, etc.)
  const assetTypes: ('service' | 'library' | 'database' | 'api' | 'server')[] =
    ['service', 'library', 'database', 'api', 'server'];

  for (let i = 0; i < assetCount; i++) {
    const type = assetTypes[Math.floor(Math.random() * assetTypes.length)];

    nodes.push({
      id: `asset-${nodeId++}`,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      type,
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      metadata: {
        criticality: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      },
    });
  }

  // Generate Edges
  const threats = nodes.filter(n => n.type === 'threat');
  const assets = nodes.filter(n => ['service','library','database','api','server'].includes(n.type));
  const vulns = nodes.filter(n => n.type === 'vulnerability');
  const ips = nodes.filter(n => n.type === 'ip');

  // Threats target assets
  threats.forEach(threat => {
    const targetCount = 1 + Math.floor(Math.random() * 3);
    const targets = assets.sort(() => Math.random() - 0.5).slice(0, targetCount);

    targets.forEach(target => {
      edges.push({
        id: `edge-${edgeId++}`,
        source: threat.id,
        target: target.id,
        relationType: CyberRelationType.TARGETS,
        confidence: 0.6 + Math.random() * 0.4,
        weight: Math.random(),
      });
    });
  });

  // Threats exploit vulnerabilities
  threats.forEach(threat => {
    const vulnCount = 1 + Math.floor(Math.random() * 2);
    const targetVulns = vulns.sort(() => Math.random() - 0.5).slice(0, vulnCount);

    targetVulns.forEach(vuln => {
      edges.push({
        id: `edge-${edgeId++}`,
        source: threat.id,
        target: vuln.id,
        relationType: CyberRelationType.EXPLOITS,
        confidence: 0.7 + Math.random() * 0.3,
        weight: Math.random(),
      });
    });
  });

  // Vulnerabilities affect assets
  vulns.forEach(vuln => {
    const affectCount = 1 + Math.floor(Math.random() * 3);
    const affected = assets.sort(() => Math.random() - 0.5).slice(0, affectCount);

    affected.forEach(asset => {
      edges.push({
        id: `edge-${edgeId++}`,
        source: vuln.id,
        target: asset.id,
        relationType: CyberRelationType.AFFECTS,
        confidence: 0.8 + Math.random() * 0.2,
        weight: Math.random(),
      });
    });
  });

  // IPs communicate with assets
  ips.forEach(ip => {
    const commCount = 1 + Math.floor(Math.random() * 2);
    const targets = assets.sort(() => Math.random() - 0.5).slice(0, commCount);

    targets.forEach(target => {
      edges.push({
        id: `edge-${edgeId++}`,
        source: ip.id,
        target: target.id,
        relationType: CyberRelationType.COMMUNICATES_WITH,
        confidence: 0.9,
        weight: Math.random(),
      });
    });
  });

  // Some malicious IPs are used by threats
  const maliciousIPs = ips.filter(ip => (ip.metadata as IPNodeMetadata).isMalicious);

  maliciousIPs.forEach(ip => {
    if (threats.length > 0 && Math.random() > 0.5) {
      const threat = threats[Math.floor(Math.random() * threats.length)];
      edges.push({
        id: `edge-${edgeId++}`,
        source: threat.id,
        target: ip.id,
        relationType: CyberRelationType.USES,
        confidence: 0.7 + Math.random() * 0.3,
        weight: Math.random(),
      });
    }
  });

  return { nodes, edges };
}