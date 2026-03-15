import { useState, useEffect } from 'react';
import { apiClient, type GraphData } from '@/services/api';
import { useGraphStore } from '@/stores/graphStore';

export function useLoadGraphFromApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);

  const loadGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getGraphData();
      setNodes(data.nodes);
      setEdges(data.edges);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load graph';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loadGraph, loading, error };
}

export function useSaveGraphToApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const saveGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: GraphData = { nodes, edges };
      const result = await apiClient.createGraphData(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save graph';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { saveGraph, loading, error };
}

export function useApiConnection() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiClient.health();
        setConnected(true);
      } catch (err) {
        setConnected(false);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
    
    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return { connected, checking };
}