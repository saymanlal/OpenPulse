import { useState, useCallback } from 'react';

// ✅ Smart API URL detection (same logic as api.ts)
const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }
  }
  
  return 'https://openpulse-43sj.onrender.com';
};

const API_BASE = getApiBaseUrl();

export interface RepoIntelData {
  commitTimeline: Array<{ date: string; count: number }>;
  topContributors: Array<{ author: string; commits: number; avatar?: string }>;
  commitsByBranch: Array<{ branch: string; commits: number }>;
  
  prStats: {
    merged: number;
    closed: number;
    open: number;
    successRate: number;
  };
  
  issueStats: {
    open: number;
    closed: number;
    avgResponseTime: number;
  };
  
  healthMetrics: {
    healthScore: number;
    busFactor: number;
    contributorRisk: number;
    momentum: number;
    activeDays: number;
    avgPrMergeTime: number;
  };
  
  codeChurn: Array<{ file: string; changes: number }>;
  activityHeatmap: Array<{ week: number; day: number; commits: number }>;
}

type Status = 'idle' | 'loading' | 'ok' | 'error';

export function useRepoIntel() {
  const [data, setData] = useState<RepoIntelData | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (owner: string, repo: string) => {
    setStatus('loading');
    setError(null);

    try {
      console.log(`[Repo Intel] Fetching: ${owner}/${repo}`);
      console.log(`[Repo Intel] API URL: ${API_BASE}/api/repo-intel`);

      const res = await globalThis.fetch(`${API_BASE}/api/repo-intel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      });

      console.log(`[Repo Intel] Response status: ${res.status}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log('[Repo Intel] Data received successfully');
      setData(result);
      setStatus('ok');
    } catch (err) {
      console.error('[Repo Intel] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch repo intelligence');
      setStatus('error');
    }
  }, []);

  return { data, status, error, fetch };
}