import { useCallback, useState, useEffect } from 'react';
import { normalizeAnalyzerGraph } from '@/lib/graphLayout';
import { getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { apiClient } from '@/services/api';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphData } from '@/types/graph';

const LOADING_STEPS = ['Fetching repository...', 'Building graph...', 'Rendering...'] as const;

export function useRepositoryAnalysis() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'github' | 'demo'>('demo');
  const setGraphData = useGraphStore((state) => state.setGraphData);

  const loadDemoGraph = useCallback((): GraphData => {
    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setGraphData(demo);
    setSource('demo');
    setStatus('Rendering...');
    return demo;
  }, [setGraphData]);

  const analyzeRepository = useCallback(
    async (repo: string) => {
      const trimmedRepo = repo.trim();
      if (!trimmedRepo) {
        throw new Error('Enter a repository in owner/name format');
      }

      setLoading(true);
      setError(null);
      setSource('github');
      setStatus(LOADING_STEPS[0]);

      try {
        const payload = await apiClient.analyzeRepository(trimmedRepo);
        setStatus(LOADING_STEPS[1]);
        const graph = normalizeAnalyzerGraph(payload);
        setStatus(LOADING_STEPS[2]);
        setGraphData(graph);
        return graph;
      } catch (analysisError) {
        const message = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
        setError(message);
        const demo = loadDemoGraph();
        setStatus(`${message} Loading demo dataset instead.`);
        return demo;
      } finally {
        setLoading(false);
      }
    },
    [loadDemoGraph, setGraphData],
  );

  return {
    analyzeRepository,
    loadDemoGraph,
    loading,
    status,
    error,
    source,
    loadingSteps: LOADING_STEPS,
  };
}

// New hooks for Header.tsx compatibility
export function useLoadGraphFromApi() {
  const [loading, setLoading] = useState(false);
  const setGraphData = useGraphStore((state) => state.setGraphData);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/graph/data');
      if (!response.ok) throw new Error('Failed to load graph');
      const data = await response.json();
      setGraphData(data);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setGraphData]);

  return { loadGraph, loading };
}

export function useSaveGraphToApi() {
  const [loading, setLoading] = useState(false);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const saveGraph = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/graph/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!response.ok) throw new Error('Failed to save graph');
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [nodes, edges]);

  return { saveGraph, loading };
}

export function useApiConnection() {
  const [connected, setConnected] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8001/health');
        setConnected(response.ok);
      } catch {
        setConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  return { connected, checking };
}
