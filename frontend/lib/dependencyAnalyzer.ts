import type {
  PackageJson,
  PythonRequirement,
  DependencyNode,
  DependencyEdge,
  DependencyAnalysis,
  DependencyTreeNode,
  PackageMetadata,
  DependencyType,
  PackageManager,
  ScanOptions,
} from '@/types/dependency';

export class DependencyAnalyzer {
  private nodes: Map<string, DependencyNode> = new Map();
  private edges: DependencyEdge[] = [];
  private nodeIdCounter = 0;

  /**
   * Parse package.json and build dependency graph
   */
  parsePackageJson(
    packageJson: PackageJson,
    options: ScanOptions = {}
  ): DependencyAnalysis {
    const {
      includeDevDependencies = true,
      maxDepth = 3,
    } = options;

    this.nodes.clear();
    this.edges = [];
    this.nodeIdCounter = 0;

    // Create root node
    const rootNode = this.createNode(
      packageJson.name,
      packageJson.version,
      'direct',
      'npm',
      {
        description: packageJson.description,
        repository: packageJson.repository,
        license: packageJson.license,
      }
    );

    // Process dependencies
    if (packageJson.dependencies) {
      this.processDependencies(
        rootNode.id,
        packageJson.dependencies,
        'direct',
        1,
        maxDepth
      );
    }

    // Process dev dependencies
    if (includeDevDependencies && packageJson.devDependencies) {
      this.processDependencies(
        rootNode.id,
        packageJson.devDependencies,
        'dev',
        1,
        maxDepth
      );
    }

    // Process peer dependencies
    if (packageJson.peerDependencies) {
      this.processDependencies(
        rootNode.id,
        packageJson.peerDependencies,
        'peer',
        1,
        maxDepth
      );
    }

    // Process optional dependencies
    if (packageJson.optionalDependencies) {
      this.processDependencies(
        rootNode.id,
        packageJson.optionalDependencies,
        'optional',
        1,
        maxDepth
      );
    }

    return this.generateAnalysis(packageJson.name, 'npm');
  }

  /**
   * Parse requirements.txt (Python) and build dependency graph
   */
  parseRequirementsTxt(
    content: string,
    projectName: string = 'python-project'
  ): DependencyAnalysis {
    this.nodes.clear();
    this.edges = [];
    this.nodeIdCounter = 0;

    // Create root node
    const rootNode = this.createNode(
      projectName,
      '1.0.0',
      'direct',
      'pip'
    );

    // Parse requirements
    const requirements = this.parseRequirementsContent(content);

    // Create nodes for each requirement
    requirements.forEach(req => {
      const depNode = this.createNode(
        req.name,
        req.version || 'latest',
        'direct',
        'pip'
      );

      // Create edge
      this.edges.push({
        id: `edge-${this.edges.length}`,
        source: rootNode.id,
        target: depNode.id,
        dependencyType: 'direct',
        versionRange: req.version
          ? `${req.versionOperator || '=='}${req.version}`
          : '*',
        weight: 1,
      });
    });

    return this.generateAnalysis(projectName, 'pip');
  }

  /**
   * Process dependencies recursively
   */
  private processDependencies(
    parentId: string,
    dependencies: Record<string, string>,
    type: DependencyType,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth > maxDepth) return;

    Object.entries(dependencies).forEach(([name, versionRange]) => {
      // Extract version (simplified - real implementation would resolve it)
      const version = this.extractVersion(versionRange);

      // Check if node already exists
      const nodeKey = `${name}@${version}`;
      let node = this.nodes.get(nodeKey);

      if (!node) {
        // Create new node
        node = this.createNode(name, version, type, 'npm');
      }

      // Create edge
      this.edges.push({
        id: `edge-${this.edges.length}`,
        source: parentId,
        target: node.id,
        dependencyType: type,
        versionRange,
        weight: 1,
      });
    });
  }

  /**
   * Create a dependency node
   */
  private createNode(
    name: string,
    version: string,
    dependencyType: DependencyType,
    packageManager: PackageManager,
    extraMetadata: Partial<PackageMetadata> = {}
  ): DependencyNode {
    const nodeKey = `${name}@${version}`;
    
    // Return existing node if found
    if (this.nodes.has(nodeKey)) {
      return this.nodes.get(nodeKey)!;
    }

    const node: DependencyNode = {
      id: `dep-${this.nodeIdCounter++}`,
      label: `${name}@${version}`,
      type: 'library',
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
      ],
      metadata: {
        name,
        version,
        packageManager,
        dependencyType,
        ...extraMetadata,
      },
    };

    this.nodes.set(nodeKey, node);
    return node;
  }

  /**
   * Extract version from version range
   */
  private extractVersion(versionRange: string): string {
    // Remove operators: ^, ~, >=, <=, >, <, =
    return versionRange.replace(/[\^~>=<]/g, '').trim() || 'latest';
  }

  /**
   * Parse requirements.txt content
   */
  private parseRequirementsContent(content: string): PythonRequirement[] {
    const requirements: PythonRequirement[] = [];

    content.split('\n').forEach(line => {
      line = line.trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;

      // Parse requirement
      const match = line.match(/^([a-zA-Z0-9_-]+)(==|>=|<=|~=|>|<)?(.+)?$/);
      if (match) {
        requirements.push({
          name: match[1],
          versionOperator: match[2],
          version: match[3]?.trim(),
        });
      }
    });

    return requirements;
  }

  /**
   * Generate analysis report
   */
  private generateAnalysis(
    projectName: string,
    packageManager: PackageManager
  ): DependencyAnalysis {
    const nodesArray = Array.from(this.nodes.values());

    // Count dependencies by type
    const directDeps = nodesArray.filter(
      n => n.metadata.dependencyType === 'direct'
    ).length;
    const devDeps = nodesArray.filter(
      n => n.metadata.dependencyType === 'dev'
    ).length;
    const peerDeps = nodesArray.filter(
      n => n.metadata.dependencyType === 'peer'
    ).length;
    const optionalDeps = nodesArray.filter(
      n => n.metadata.dependencyType === 'optional'
    ).length;
    const transitiveDeps = nodesArray.filter(
      n => n.metadata.dependencyType === 'transitive'
    ).length;

    // License distribution
    const licenseDistribution: Record<string, number> = {};
    nodesArray.forEach(node => {
      const license = node.metadata.license || 'Unknown';
      licenseDistribution[license] = (licenseDistribution[license] || 0) + 1;
    });

    return {
      projectName,
      packageManager,
      totalDependencies: nodesArray.length,
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      devDependencies: devDeps,
      peerDependencies: peerDeps,
      optionalDependencies: optionalDeps,
      vulnerablePackages: 0,  // Would be populated by vulnerability scanner
      outdatedPackages: 0,    // Would be populated by version checker
      licenseDistribution,
      nodes: nodesArray,
      edges: this.edges,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Build dependency tree structure
   */
  buildDependencyTree(
    packageJson: PackageJson,
    maxDepth: number = 3
  ): DependencyTreeNode {
    const root: DependencyTreeNode = {
      name: packageJson.name,
      version: packageJson.version,
      dependencyType: 'direct',
      depth: 0,
      children: [],
    };

    // Add direct dependencies
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        root.children.push({
          name,
          version: this.extractVersion(version),
          dependencyType: 'direct',
          depth: 1,
          children: [],
        });
      });
    }

    return root;
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): Array<string[]> {
    const circular: Array<string[]> = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Find outgoing edges
      const outgoingEdges = this.edges.filter(e => e.source === nodeId);

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          dfs(edge.target, [...path]);
        } else if (recursionStack.has(edge.target)) {
          // Found circular dependency
          const cycleStart = path.indexOf(edge.target);
          circular.push([...path.slice(cycleStart), edge.target]);
        }
      }

      recursionStack.delete(nodeId);
    };

    Array.from(this.nodes.values()).forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return circular;
  }

  /**
   * Get dependency depth (longest path from root)
   */
  getDependencyDepth(nodeId: string): number {
    const visited = new Set<string>();
    let maxDepth = 0;

    const dfs = (currentId: string, depth: number): void => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      maxDepth = Math.max(maxDepth, depth);

      // Find outgoing edges
      const outgoingEdges = this.edges.filter(e => e.source === currentId);
      outgoingEdges.forEach(edge => {
        dfs(edge.target, depth + 1);
      });
    };

    dfs(nodeId, 0);
    return maxDepth;
  }

  /**
   * Get all dependents of a package (reverse dependencies)
   */
  getDependents(nodeId: string): DependencyNode[] {
    const dependentIds = this.edges
      .filter(e => e.target === nodeId)
      .map(e => e.source);

    return dependentIds
      .map(id => Array.from(this.nodes.values()).find(n => n.id === id))
      .filter(Boolean) as DependencyNode[];
  }

  /**
   * Get all dependencies of a package
   */
  getDependencies(nodeId: string): DependencyNode[] {
    const dependencyIds = this.edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);

    return dependencyIds
      .map(id => Array.from(this.nodes.values()).find(n => n.id === id))
      .filter(Boolean) as DependencyNode[];
  }

  /**
   * Export to JSON format compatible with OpenPulse
   */
  exportToGraph(): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }
}