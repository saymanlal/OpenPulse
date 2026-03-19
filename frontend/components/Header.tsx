'use client';

import { FormEvent, useEffect, useState } from 'react';

import { useApiConnection, useRepositoryAnalysis } from '@/hooks/useApiGraph';
import { useGraphStore } from '@/stores/graphStore';

export default function Header() {
  const [repoInput, setRepoInput] = useState('facebook/react');
  const [message, setMessage] = useState<string | null>(null);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const { analyzeRepository, loadDemoGraph, loading, status, error, source } = useRepositoryAnalysis();
  const { connected, checkConnection } = useApiConnection();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (error) {
      setMessage(error);
      return;
    }

    if (nodes.length > 0) {
      setMessage(`Loaded ${nodes.length} nodes and ${edges.length} edges from ${source}.`);
    }
  }, [edges.length, error, nodes.length, source]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await analyzeRepository(repoInput);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-100">OpenPulse</h1>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] uppercase tracking-[0.24em] text-slate-400">
              phase16
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Analyze a public GitHub repo and inspect its dependency graph in 3D.
          </p>
        </div>

        <form className="flex w-full flex-col gap-3 lg:max-w-3xl lg:flex-row" onSubmit={handleSubmit}>
          <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-inner shadow-black/20">
            <label className="mb-1 block text-[11px] uppercase tracking-[0.24em] text-slate-500" htmlFor="repo-input">
              GitHub repository
            </label>
            <input
              id="repo-input"
              value={repoInput}
              onChange={(event) => setRepoInput(event.target.value)}
              placeholder="owner/name"
              className="w-full border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>

          <button
            type="button"
            onClick={loadDemoGraph}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Load Demo
          </button>
        </form>
      </div>

      <div className="grid gap-3 border-t border-slate-900/80 bg-slate-950/70 px-5 py-3 text-sm text-slate-400 lg:grid-cols-[1fr_auto_auto] lg:items-center lg:px-6">
        <div className="truncate">{loading ? status : message ?? 'Ready for analysis.'}</div>
        <div className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
          Backend {connected === false ? 'offline' : connected === true ? 'online' : 'checking'}
        </div>
        <div className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
          Source {source}
        </div>
      </div>
    </header>
  );
}
