import { useState } from 'react';
import { DependencyAnalyzer } from '@/lib/dependencyAnalyzer';
import { GitHubScanner } from '@/lib/githubScanner';
import { useGraphStore } from '@/stores/graphStore';
import type {
  PackageJson,
  DependencyAnalysis,
  ScanOptions,
  DependencyNode,
  DependencyEdge,
} from '@/types/dependency';

export function useDependencyAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null);

  const setGraphData = useGraphStore((state) => state.setGraphData);

  /**
   * Analyze package.json file
   */
  const analyzePackageJson = async (
    packageJson: PackageJson,
    options?: ScanOptions
  ): Promise<DependencyAnalysis | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const analyzer = new DependencyAnalyzer();
      const result = analyzer.parsePackageJson(packageJson, options);
      
      setAnalysis(result);
      
      // Load into graph
      setGraphData({
        nodes: result.nodes,
        edges: result.edges,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Analyze requirements.txt file
   */
  const analyzeRequirementsTxt = async (
    content: string,
    projectName?: string
  ): Promise<DependencyAnalysis | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const analyzer = new DependencyAnalyzer();
      const result = analyzer.parseRequirementsTxt(content, projectName);
      
      setAnalysis(result);
      
      // Load into graph
      setGraphData({
        nodes: result.nodes,
        edges: result.edges,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Scan GitHub repository
   */
  const scanGitHubRepo = async (
    githubUrl: string,
    options?: ScanOptions
  ): Promise<DependencyAnalysis | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const scanner = new GitHubScanner();
      const result = await scanner.scanRepository(githubUrl, options);

      if (!result) {
        setError('No package.json or requirements.txt found in repository');
        return null;
      }

      setAnalysis(result);

      // Load into graph
      setGraphData({
        nodes: result.nodes,
        edges: result.edges,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Parse file content and detect type
   */
  const analyzeFile = async (
    content: string,
    filename: string
  ): Promise<DependencyAnalysis | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      if (filename === 'package.json') {
        const packageJson = JSON.parse(content) as PackageJson;
        return await analyzePackageJson(packageJson);
      } else if (filename === 'requirements.txt') {
        return await analyzeRequirementsTxt(content);
      } else {
        setError('Unsupported file type. Please upload package.json or requirements.txt');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'File parsing failed';
      setError(message);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Clear analysis
   */
  const clearAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  return {
    analyzing,
    error,
    analysis,
    analyzePackageJson,
    analyzeRequirementsTxt,
    scanGitHubRepo,
    analyzeFile,
    clearAnalysis,
  };
}

/**
 * Hook for dependency graph operations
 */
export function useDependencyGraph() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const getDependencyNodes = (): DependencyNode[] => {
    return nodes.filter(n => n.type === 'library') as DependencyNode[];
  };

  const getDependencyEdges = (): DependencyEdge[] => {
    return edges as DependencyEdge[];
  };

  const getDirectDependencies = (): DependencyNode[] => {
    return getDependencyNodes().filter(
      n => n.metadata?.dependencyType === 'direct'
    );
  };

  const getDevDependencies = (): DependencyNode[] => {
    return getDependencyNodes().filter(
      n => n.metadata?.dependencyType === 'dev'
    );
  };

  const getOutdatedPackages = (): DependencyNode[] => {
    return getDependencyNodes().filter(
      n => n.metadata?.isOutdated === true
    );
  };

  const getVulnerablePackages = (): DependencyNode[] => {
    return getDependencyNodes().filter(
      n => (n.metadata?.vulnerabilities ?? 0) > 0
    );
  };

  const getPackagesByLicense = (license: string): DependencyNode[] => {
    return getDependencyNodes().filter(
      n => n.metadata?.license === license
    );
  };

  return {
    getDependencyNodes,
    getDependencyEdges,
    getDirectDependencies,
    getDevDependencies,
    getOutdatedPackages,
    getVulnerablePackages,
    getPackagesByLicense,
  };
}