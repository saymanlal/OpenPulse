import { useCallback, useState } from 'react';

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

export function useApiConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      await apiClient.health();
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  return { connected, checkConnection };
}
