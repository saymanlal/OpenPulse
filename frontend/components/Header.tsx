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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <div className="relative bg-black border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <h3 className="text-lg font-black tracking-tighter bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-1">
          MULTIPLE PACKAGES FOUND
        </h3>
        <p className="text-xs font-mono text-white/40 mb-4">
          <code className="text-blue-400">{owner}/{repo}</code> contains {options.length} package.json files
        </p>
        
        <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
          {options.map((opt) => (
            <button key={opt.path} onClick={() => onSelect(opt.path)}
              className="w-full text-left group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-bold text-white">{opt.name}</span>
                  <span className="text-[10px] font-mono text-white/40">v{opt.version}</span>
                </div>
                <div className="text-[11px] font-mono text-white/40 mb-1 truncate">{opt.path}</div>
                {opt.description && (
                  <div className="text-[11px] text-white/50 mb-2 line-clamp-2">{opt.description}</div>
                )}
                <div className="text-[10px] font-mono text-blue-400">
                  {opt.depCount} DEPENDENCIES
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <button onClick={onClose} 
          className="text-[10px] font-mono font-bold tracking-wider text-white/40 hover:text-white/60 transition-colors">
          CANCEL
        </button>
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
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

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
      showMessage(`${owner}/${repo} — ${data.nodes.length} packages loaded`);
      setRepoInput('');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeRepo = () => {
    const match = repoInput.trim().match(/(?:https?:\/\/github\.com\/)?([^/]+)\/([^/\s]+)/);
    if (!match) { showMessage('Invalid format: use owner/repo or GitHub URL', 'error'); return; }
    doAnalyze(match[1], match[2]);
  };

  const handlePickPackage = (path: string) => {
    setPkgOptions(null);
    doAnalyze(pendingOwner, pendingRepo, path);
  };

  const handleLoadFromApi = async () => {
    try {
      const data = await loadGraph();
      showMessage(`${data.nodes.length} nodes loaded from API`);
    } catch {
      showMessage('API load failed', 'error');
    }
  };

  const handleSaveToApi = async () => {
    try {
      const data = await saveGraph();
      showMessage(`${data.nodes.length} nodes saved to API`);
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

      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="relative px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  OPENPULSE
                </h1>
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/30 border-l border-white/20 pl-3">
                  V0.3.0
                </span>
              </div>
              
              {!checking && (
                <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full ${
                      connected ? 'bg-emerald-500' : 'bg-red-500'
                    } ${connected ? 'animate-ping opacity-75' : ''}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${
                      connected ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-white/40">
                    {connected ? 'API ACTIVE' : 'API OFFLINE'}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Section */}
            <nav className="flex items-center gap-3">
              {/* Search/Analyze Input */}
              <div className="relative group">
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative flex items-center gap-2 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 group-focus-within:border-blue-500/50 transition-all">
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeRepo()}
                    placeholder="owner/repo or GitHub URL"
                    className="bg-transparent text-sm font-mono text-white placeholder:text-white/30 outline-none w-64"
                    disabled={analyzing || !connected}
                  />
                  <button
                    onClick={handleAnalyzeRepo}
                    disabled={analyzing || !connected || !repoInput.trim()}
                    className="relative overflow-hidden group/btn text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 font-mono text-xs font-bold tracking-wider">
                      {analyzing ? 'ANALYZING...' : 'ANALYZE'}
                    </span>
                    {!analyzing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    )}
                  </button>
                </div>
              </div>

              <div className="w-px h-6 bg-white/20" />

              {/* Action Buttons */}
              <button 
                onClick={handleLoadFromApi} 
                disabled={loadLoading || !connected}
                className="relative overflow-hidden group px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                {loadLoading ? 'LOADING...' : 'LOAD'}
              </button>
              
              <button 
                onClick={handleSaveToApi} 
                disabled={saveLoading || !connected}
                className="relative overflow-hidden group px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                {saveLoading ? 'SAVING...' : 'SAVE'}
              </button>
              
              <button 
                onClick={handleLoadDemo}
                className="relative overflow-hidden group px-3 py-1.5 text-xs font-mono font-bold tracking-wider text-white/60 hover:text-white transition-colors"
              >
                DEMO
              </button>

              <div className="w-px h-6 bg-white/20" />

              {/* Stats Section */}
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-white/30">NODES</span>
                  <span className="text-white/80 font-bold tabular-nums">
                    {nodes.length.toString().padStart(4, '0')}
                  </span>
                </div>
                <div className="text-white/20">|</div>
                <div className="flex items-center gap-2">
                  <span className="text-white/30">EDGES</span>
                  <span className="text-white/80 font-bold tabular-nums">
                    {edges.length.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>

              <div className="w-px h-6 bg-white/20" />

              {/* Docs Link */}
              <Link href="/docs" target="_blank"
                className="relative overflow-hidden group px-4 py-1.5 border border-indigo-500/50 hover:border-indigo-400 rounded-lg transition-all">
                <span className="relative z-10 text-xs font-mono font-bold tracking-wider text-indigo-400 group-hover:text-indigo-300">
                  DOCS
                </span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className={`relative overflow-hidden rounded-lg shadow-2xl ${
              messageType === 'success' 
                ? 'bg-emerald-500/90 border border-emerald-400/50' 
                : 'bg-red-500/90 border border-red-400/50'
            } backdrop-blur-sm`}>
              <div className="px-4 py-2 text-sm font-mono font-bold text-white tracking-wide">
                {message}
              </div>
              <div className={`absolute bottom-0 left-0 h-0.5 ${
                messageType === 'success' ? 'bg-white' : 'bg-white'
              } animate-[shrink_4s_linear]`} style={{ width: '100%' }} />
            </div>
          </div>
        )}
      </header>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-\\[shrink_4s_linear\\] {
          animation: shrink 4s linear;
        }
      `}</style>
    </>
  );
}