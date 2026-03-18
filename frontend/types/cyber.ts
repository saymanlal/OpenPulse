import type { GraphNode, GraphEdge, NodeType } from './graph';

// Extended node types for cyber intelligence
export type CyberNodeType = NodeType | 'ip' | 'threat' | 'vulnerability';

// Threat severity levels
export enum ThreatSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// Vulnerability severity (CVSS-based)
export enum VulnerabilitySeverity {
  CRITICAL = 'critical',  // 9.0-10.0
  HIGH = 'high',          // 7.0-8.9
  MEDIUM = 'medium',      // 4.0-6.9
  LOW = 'low',            // 0.1-3.9
  NONE = 'none',          // 0.0
}

// IP address types
export enum IPType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESERVED = 'reserved',
  LOOPBACK = 'loopback',
}

// Threat actor types
export enum ThreatActorType {
  APT = 'apt',                    // Advanced Persistent Threat
  CYBERCRIME = 'cybercrime',      // Criminal groups
  HACKTIVIST = 'hacktivist',      // Ideologically motivated
  INSIDER = 'insider',            // Internal threat
  NATION_STATE = 'nation_state',  // State-sponsored
  UNKNOWN = 'unknown',
}

// Attack techniques (simplified MITRE ATT&CK)
export enum AttackTechnique {
  RECONNAISSANCE = 'reconnaissance',
  RESOURCE_DEVELOPMENT = 'resource_development',
  INITIAL_ACCESS = 'initial_access',
  EXECUTION = 'execution',
  PERSISTENCE = 'persistence',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DEFENSE_EVASION = 'defense_evasion',
  CREDENTIAL_ACCESS = 'credential_access',
  DISCOVERY = 'discovery',
  LATERAL_MOVEMENT = 'lateral_movement',
  COLLECTION = 'collection',
  COMMAND_AND_CONTROL = 'command_and_control',
  EXFILTRATION = 'exfiltration',
  IMPACT = 'impact',
}

// IP Node metadata
export interface IPNodeMetadata {
  ipAddress: string;
  ipType: IPType;
  geolocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  asn?: number;              // Autonomous System Number
  organization?: string;
  isMalicious?: boolean;
  reputation?: number;       // 0-100 (0=malicious, 100=trusted)
  lastSeen?: string;         // ISO timestamp
  ports?: number[];          // Open ports
  services?: string[];       // Running services
  threatIntelFeeds?: string[]; // Which feeds flagged this IP
}

// Threat Node metadata
export interface ThreatNodeMetadata {
  threatId: string;
  threatName: string;
  threatType: ThreatActorType;
  severity: ThreatSeverity;
  description?: string;
  aliases?: string[];
  firstSeen?: string;
  lastSeen?: string;
  isActive: boolean;
  techniques?: AttackTechnique[]; // MITRE ATT&CK techniques
  targetedSectors?: string[];     // Industries targeted
  targetedCountries?: string[];
  confidence?: number;             // 0-100
  sources?: string[];              // Threat intel sources
}

// Vulnerability Node metadata
export interface VulnerabilityNodeMetadata {
  cveId?: string;              // CVE-2024-1234
  cweId?: string;              // CWE-79
  severity: VulnerabilitySeverity;
  cvssScore?: number;          // 0-10
  cvssVector?: string;         // CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
  description?: string;
  published?: string;          // ISO timestamp
  lastModified?: string;
  exploitAvailable?: boolean;
  exploitedInWild?: boolean;
  patchAvailable?: boolean;
  affectedVersions?: string[];
  fixedVersions?: string[];
  references?: string[];       // URLs to advisories
  cwe?: string;                // Weakness type
}

// Cyber Intelligence Node
export interface CyberNode extends Omit<GraphNode, 'type' | 'metadata'> {
  type: CyberNodeType;
  metadata?: IPNodeMetadata | ThreatNodeMetadata | VulnerabilityNodeMetadata | Record<string, any>;
}

// Relationship types for cyber intelligence
export enum CyberRelationType {
  // IP relationships
  COMMUNICATES_WITH = 'communicates_with',
  ROUTES_THROUGH = 'routes_through',
  HOSTS = 'hosts',
  
  // Threat relationships
  TARGETS = 'targets',
  EXPLOITS = 'exploits',
  USES = 'uses',
  ATTRIBUTED_TO = 'attributed_to',
  
  // Vulnerability relationships
  AFFECTS = 'affects',
  MITIGATED_BY = 'mitigated_by',
  DEPENDS_ON = 'depends_on',
  
  // Generic
  RELATED_TO = 'related_to',
}

// Cyber Intelligence Edge
export interface CyberEdge extends Omit<GraphEdge, 'label'> {
  relationType?: CyberRelationType;
  label?: string;
  confidence?: number;        // 0-1
  firstSeen?: string;
  lastSeen?: string;
  metadata?: Record<string, any>;
}

// Attack Path
export interface AttackPath {
  id: string;
  name: string;
  nodes: CyberNode[];
  edges: CyberEdge[];
  severity: ThreatSeverity;
  likelihood: number;         // 0-1
  impact: number;             // 0-1
  techniques: AttackTechnique[];
  description?: string;
}

// Threat Intelligence Report
export interface ThreatIntelReport {
  id: string;
  title: string;
  summary: string;
  severity: ThreatSeverity;
  threats: CyberNode[];
  vulnerabilities: CyberNode[];
  indicators: CyberNode[];    // IPs, domains, etc.
  attackPaths: AttackPath[];
  recommendations: string[];
  confidence: number;
  published: string;
  sources: string[];
}

// Helper functions
export const isCyberNode = (node: GraphNode | CyberNode): node is CyberNode => {
  return ['ip', 'threat', 'vulnerability'].includes(node.type);
};

export const isIPNode = (node: CyberNode): node is CyberNode & { metadata: IPNodeMetadata } => {
  return node.type === 'ip';
};

export const isThreatNode = (node: CyberNode): node is CyberNode & { metadata: ThreatNodeMetadata } => {
  return node.type === 'threat';
};

export const isVulnerabilityNode = (node: CyberNode): node is CyberNode & { metadata: VulnerabilityNodeMetadata } => {
  return node.type === 'vulnerability';
};