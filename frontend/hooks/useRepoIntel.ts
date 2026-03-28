'use client';

import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:8001';

// ── Types ──────────────────────────────────────────────────────────── //

export interface ContributorStat {
  login:      string;
  commits:    number;
  additions:  number;
  deletions:  number;
  pct:        number;
}

export interface CommitPoint {
  date:  string;
  count: number;
}

export interface ChurnFile {
  path:    string;
  changes: number;
  commits: number;
}

export interface ModuleOwnership {
  module:       string;
  owner:        string;
  ownerPct:     number;
  contributors: number;
}

export interface RepoIntelData {
  healthScore:        number;
  healthLabel:        string;
  busFactor:          number;
  totalCommits:       number;
  activeDays:         number;
  totalPRs:           number;
  totalIssues:        number;
  openIssues:         number;
  momentumPct:        number;
  activityDaysAgo:    number;
  issueHandlingPct:   number;
  contributorRiskPct: number;
  contributors:       ContributorStat[];
  timeline:           CommitPoint[];
  churnFiles:         ChurnFile[];
  moduleOwnership:    ModuleOwnership[];
}

export type IntelStatus = 'idle' | 'loading' | 'ok' | 'error';

export function useRepoIntel() {
  const [data,   setData]   = useState<RepoIntelData | null>(null);
  const [status, setStatus] = useState<IntelStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);

  const fetch = useCallback(async (owner: string, repo: string) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await window.fetch(`${API_BASE}/api/repo-intel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ owner, repo }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setStatus('ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intel');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { data, status, error, fetch, reset };
}