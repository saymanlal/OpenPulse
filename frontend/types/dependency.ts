import type { GraphNode, GraphEdge } from './graph';

// Package manager types
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  PIP = 'pip',
  POETRY = 'poetry',
  MAVEN = 'maven',
  GRADLE = 'gradle',
  CARGO = 'cargo',
  GO_MOD = 'go',
  COMPOSER = 'composer',
}

// Dependency types
export enum DependencyType {
  DIRECT = 'direct',           // Listed in package.json
  TRANSITIVE = 'transitive',   // Dependency of dependency
  DEV = 'dev',                 // Development only
  PEER = 'peer',               // Peer dependency
  OPTIONAL = 'optional',       // Optional dependency
}

// License types
export enum LicenseType {
  MIT = 'MIT',
  APACHE_2 = 'Apache-2.0',
  GPL_3 = 'GPL-3.0',
  BSD_3 = 'BSD-3-Clause',
  ISC = 'ISC',
  UNLICENSED = 'UNLICENSED',
  PROPRIETARY = 'Proprietary',
  UNKNOWN = 'Unknown',
}

// Package metadata
export interface PackageMetadata {
  name: string;
  version: string;
  packageManager: PackageManager;
  dependencyType: DependencyType;
  
  // Repository info
  repository?: {
    type: 'git' | 'svn' | 'mercurial';
    url: string;
  };
  
  // License
  license?: LicenseType | string;
  
  // Maintainers
  maintainers?: Array<{
    name: string;
    email?: string;
  }>;
  
  // Version info
  latestVersion?: string;
  isOutdated?: boolean;
  
  // Downloads & popularity
  downloads?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  stars?: number;
  
  // Security
  vulnerabilities?: number;
  hasSecurityAdvisory?: boolean;
  
  // Dates
  publishedAt?: string;
  lastUpdated?: string;
  
  // Size
  size?: number;  // in bytes
  
  // Description
  description?: string;
  homepage?: string;
  
  // Custom metadata
  [key: string]: any;
}

// Dependency node
export interface DependencyNode extends GraphNode {
  type: 'library';
  metadata: PackageMetadata;
}

// Dependency edge
export interface DependencyEdge extends GraphEdge {
  dependencyType?: DependencyType;
  versionRange?: string;  // e.g., "^1.2.3"
  isResolved?: boolean;
}

// Package.json structure
export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  repository?: {
    type: string;
    url: string;
  };
  license?: string;
  [key: string]: any;
}

// Requirements.txt (Python)
export interface PythonRequirement {
  name: string;
  version?: string;
  versionOperator?: string;  // ==, >=, <=, ~=, etc.
}

// Dependency analysis result
export interface DependencyAnalysis {
  projectName: string;
  packageManager: PackageManager;
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  
  // Counts by type
  devDependencies: number;
  peerDependencies: number;
  optionalDependencies: number;
  
  // Security
  vulnerablePackages: number;
  outdatedPackages: number;
  
  // Licenses
  licenseDistribution: Record<string, number>;
  
  // Graph data
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  
  // Metadata
  analyzedAt: string;
  repositoryUrl?: string;
}

// GitHub repository info
export interface GitHubRepository {
  owner: string;
  repo: string;
  branch?: string;
  fullName: string;  // owner/repo
  url: string;
  
  // Repository metadata
  description?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  license?: string;
  language?: string;
  
  // Files
  hasPackageJson?: boolean;
  hasRequirementsTxt?: boolean;
  hasCargoToml?: boolean;
  hasPomXml?: boolean;
  hasGoMod?: boolean;
}

// Dependency tree node
export interface DependencyTreeNode {
  name: string;
  version: string;
  dependencyType: DependencyType;
  depth: number;
  children: DependencyTreeNode[];
  metadata?: PackageMetadata;
}

// Scan options
export interface ScanOptions {
  includeDevDependencies?: boolean;
  maxDepth?: number;  // How deep to scan transitive deps
  fetchMetadata?: boolean;  // Fetch npm/pypi metadata
  checkVulnerabilities?: boolean;
  checkOutdated?: boolean;
}

// Vulnerability info
export interface PackageVulnerability {
  packageName: string;
  version: string;
  vulnerabilityId: string;  // CVE or advisory ID
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  patchedVersions?: string[];
  vulnerableVersions?: string;
  publishedAt?: string;
  references?: string[];
}

// Analysis report
export interface DependencyReport {
  summary: DependencyAnalysis;
  vulnerabilities: PackageVulnerability[];
  outdatedPackages: Array<{
    name: string;
    current: string;
    latest: string;
  }>;
  licenseIssues: Array<{
    name: string;
    license: string;
    issue: string;
  }>;
  recommendations: string[];
}