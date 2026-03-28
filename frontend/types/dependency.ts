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
  DIRECT = 'direct',
  TRANSITIVE = 'transitive',
  DEV = 'dev',
  PEER = 'peer',
  OPTIONAL = 'optional',
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
  repository?: {
    type: 'git' | 'svn' | 'mercurial';
    url: string;
  };
  license?: LicenseType | string;
  maintainers?: Array<{
    name: string;
    email?: string;
  }>;
  latestVersion?: string;
  isOutdated?: boolean;
  downloads?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  stars?: number;
  vulnerabilities?: number;
  hasSecurityAdvisory?: boolean;
  publishedAt?: string;
  lastUpdated?: string;
  size?: number;
  description?: string;
  homepage?: string;
  [key: string]: unknown;
}

// Dependency node
export interface DependencyNode extends GraphNode {
  type: 'library';
  metadata: PackageMetadata;
}

// Dependency edge
export interface DependencyEdge extends GraphEdge {
  dependencyType?: DependencyType;
  versionRange?: string;
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
  [key: string]: unknown;
}

// Requirements.txt (Python)
export interface PythonRequirement {
  name: string;
  version?: string;
  versionOperator?: string;
}

// Dependency analysis result
export interface DependencyAnalysis {
  projectName: string;
  packageManager: PackageManager;
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  devDependencies: number;
  peerDependencies: number;
  optionalDependencies: number;
  vulnerablePackages: number;
  outdatedPackages: number;
  licenseDistribution: Record<string, number>;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  analyzedAt: string;
  repositoryUrl?: string;
}

// GitHub repository info
export interface GitHubRepository {
  owner: string;
  repo: string;
  branch?: string;
  fullName: string;
  url: string;
  description?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  license?: string;
  language?: string;
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
  maxDepth?: number;
  fetchMetadata?: boolean;
  checkVulnerabilities?: boolean;
  checkOutdated?: boolean;
}

// Vulnerability info
export interface PackageVulnerability {
  packageName: string;
  version: string;
  vulnerabilityId: string;
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