'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoadGraphFromApi, useSaveGraphToApi, useApiConnection } from '@/hooks/useApiGraph';
import { getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';

interface PackageOption {
  path: string;
  name: string;
  version: string;
  description: string;
  depCount: number;
}

function PackagePicker({ options, owner, repo, onSelect, onClose }: {
  options: PackageOption[];
  owner: string;
  repo: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-white mb-1">Multiple package.json found</h3>
        <p className="text-xs text-slate-500 mb-4">
          <code>{owner}/{repo}</code> has {options.length} package.json files. Pick one to analyse:
        </p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt.path} onClick={() => onSelect(opt.path)}
              className="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-100 font-mono">{opt.name}</span>
                <span className="text-xs text-slate-500 font-mono">v{opt.version}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mb-1">{opt.path}</div>
              {opt.description && <div className="text-xs text-slate-500">{opt.description}</div>}
              <div className="text-xs text-indigo-400 mt-1">{opt.depCount} dependencies</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 text-xs text-slate-600 hover:text-slate-400">Cancel</button>
      </div>
    </div>
  );
}

export default function Header() {
  const [message, setMessage]           = useState('');
  const [messageType, setMessageType]   = useState<'success' | 'error'>('success');
  const [repoInput, setRepoInput]       = useState('');
  const [analyzing, setAnalyzing]       = useState(false);
  const [pendingOwner, setPendingOwner] = useState('');
  const [pendingRepo, setPendingRepo]   = useState('');
  const [pkgOptions, setPkgOptions]     = useState<PackageOption[] | null>(null);

  const { loadGraph, loading: loadLoading } = useLoadGraphFromApi();
  const { saveGraph, loading: saveLoading } = useSaveGraphToApi();
  const { connected, checking }             = useApiConnection();
  const setGraphData                         = useGraphStore((s) => s.setGraphData);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const doAnalyze = async (owner: string, repo: string, path?: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch('http://localhost:8001/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ owner, repo, path }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      if (data.multipleFound) {
        setPendingOwner(owner);
        setPendingRepo(repo);
        setPkgOptions(data.packageOptions);
        return;
      }
      setGraphData({ nodes: data.nodes, edges: data.edges });
      showMessage(`✓ ${owner}/${repo} — ${data.nodes.length} packages`);
      setRepoInput('');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to analyse repository', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeRepo = () => {
    const match = repoInput.trim().match(/(?:https?:\/\/github\.com\/)?([^/]+)\/([^/\s]+)/);
    if (!match) { showMessage('Use: owner/repo or full GitHub URL', 'error'); return; }
    doAnalyze(match[1], match[2]);
  };

  const handlePickPackage = (path: string) => {
    setPkgOptions(null);
    doAnalyze(pendingOwner, pendingRepo, path);
  };

  const handleLoadFromApi = async () => {
    try {
      const data = await loadGraph();
      showMessage(`Loaded ${data.nodes.length} nodes`);
    } catch {
      showMessage('API load failed', 'error');
    }
  };

  const handleSaveToApi = async () => {
    try {
      const data = await saveGraph();
      showMessage(`Saved ${data.nodes.length} nodes`);
    } catch {
      showMessage('Save failed', 'error');
    }
  };

  const handleLoadDemo = () => {
    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setGraphData(demo);
    showMessage('Demo dataset loaded');
  };

  return (
    <>
      {pkgOptions && (
        <PackagePicker
          options={pkgOptions}
          owner={pendingOwner}
          repo={pendingRepo}
          onSelect={handlePickPackage}
          onClose={() => setPkgOptions(null)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              OpenPulse
            </h1>
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">v0.3.0</span>
            {!checking && (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {connected ? 'API Connected' : 'API Offline'}
                </span>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-700 rounded-lg px-3 py-1.5">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeRepo()}
                placeholder="owner/repo or GitHub URL"
                className="bg-transparent text-sm text-gray-300 outline-none w-64"
                disabled={analyzing || !connected}
              />
              <button
                onClick={handleAnalyzeRepo}
                disabled={analyzing || !connected || !repoInput.trim()}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>

            <div className="w-px h-6 bg-gray-700" />

            <button onClick={handleLoadFromApi} disabled={loadLoading || !connected}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              {loadLoading ? 'Loading…' : 'Load'}
            </button>
            <button onClick={handleSaveToApi} disabled={saveLoading || !connected}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">
              {saveLoading ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleLoadDemo}
              className="text-sm text-gray-400 hover:text-white transition-colors">
              Demo
            </button>

            <div className="w-px h-6 bg-gray-700" />

            <Link href="/docs" target="_blank"
              className="text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-3 py-1 rounded-lg transition-colors">
              ? Docs
            </Link>
          </nav>
        </div>

        {message && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <div className={`px-4 py-2 rounded-lg shadow-lg text-sm ${
              messageType === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
            }`}>
              {message}
            </div>
          </div>
        )}
      </header>
    </>
  );
}