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
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
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
  APT = 'apt',
  CYBERCRIME = 'cybercrime',
  HACKTIVIST = 'hacktivist',
  INSIDER = 'insider',
  NATION_STATE = 'nation_state',
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
  asn?: number;
  organization?: string;
  isMalicious?: boolean;
  reputation?: number;
  lastSeen?: string;
  ports?: number[];
  services?: string[];
  threatIntelFeeds?: string[];
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
  techniques?: AttackTechnique[];
  targetedSectors?: string[];
  targetedCountries?: string[];
  confidence?: number;
  sources?: string[];
}

// Vulnerability Node metadata
export interface VulnerabilityNodeMetadata {
  cveId?: string;
  cweId?: string;
  severity: VulnerabilitySeverity;
  cvssScore?: number;
  cvssVector?: string;
  description?: string;
  published?: string;
  lastModified?: string;
  exploitAvailable?: boolean;
  exploitedInWild?: boolean;
  patchAvailable?: boolean;
  affectedVersions?: string[];
  fixedVersions?: string[];
  references?: string[];
  cwe?: string;
}

// Cyber Intelligence Node
export interface CyberNode extends Omit<GraphNode, 'type' | 'metadata'> {
  type: CyberNodeType;
  metadata?: IPNodeMetadata | ThreatNodeMetadata | VulnerabilityNodeMetadata | Record<string, unknown>;
}

// Relationship types for cyber intelligence
export enum CyberRelationType {
  COMMUNICATES_WITH = 'communicates_with',
  ROUTES_THROUGH = 'routes_through',
  HOSTS = 'hosts',
  TARGETS = 'targets',
  EXPLOITS = 'exploits',
  USES = 'uses',
  ATTRIBUTED_TO = 'attributed_to',
  AFFECTS = 'affects',
  MITIGATED_BY = 'mitigated_by',
  DEPENDS_ON = 'depends_on',
  RELATED_TO = 'related_to',
}

// Cyber Intelligence Edge
export interface CyberEdge extends Omit<GraphEdge, 'label'> {
  relationType?: CyberRelationType;
  label?: string;
  confidence?: number;
  firstSeen?: string;
  lastSeen?: string;
  metadata?: Record<string, unknown>;
}

// Attack Path
export interface AttackPath {
  id: string;
  name: string;
  nodes: CyberNode[];
  edges: CyberEdge[];
  severity: ThreatSeverity;
  likelihood: number;
  impact: number;
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
  indicators: CyberNode[];
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