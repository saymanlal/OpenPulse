'use client';

import { useState, useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useApiConnection } from '@/hooks/useApiGraph';
import { ECOSYSTEM_COLORS } from '@/lib/constants';
import type { GraphData } from '@/types/graph';

// ── Types ──────────────────────────────────────────────────────────── //

interface EcosystemSummary {
  ecosystem:    string;
  manifestPath: string;
  projectName:  string;
  totalDeps:    number;
  directDeps:   number;
  devDeps:      number;
}

interface AnalyzeResult {
  status:      string;
  ecosystems:  EcosystemSummary[];
  nodes:       GraphData['nodes'];
  edges:       GraphData['edges'];
  metadata:    Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────── //

function parseRepoInput(raw: string): { owner: string; repo: string } | null {
  const s = raw.trim().replace(/\.git$/, '');
  const urlMatch = s.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
  const slashMatch = s.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) return { owner: slashMatch[1], repo: slashMatch[2] };
  return null;
}

const API_BASE = 'http://localhost:8001';

async function callAnalyze(
  owner: string,
  repo: string,
  ecosystem: string | null,
): Promise<AnalyzeResult> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, repo, ecosystem: ecosystem ?? undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Eco badge (Level 1) ────────────────────────────────────────────── //

function EcoBadge({
  eco, count, active, onClick,
}: { eco: string; count: number; active: boolean; onClick: () => void }) {
  const color = ECOSYSTEM_COLORS[eco] ?? '#94a3b8';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border"
      style={{
        backgroundColor: active ? color + '22' : 'transparent',
        borderColor:     active ? color : '#334155',
        color:           active ? color : '#64748b',
      }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : '#475569' }} />
      {eco}
      <span className="opacity-50">{count}</span>
    </button>
  );
}

// ── Manifest badge (Level 2) ───────────────────────────────────────── //

function ManifestBadge({
  path, active, color, onClick,
}: { path: string; active: boolean; color: string; onClick: () => void }) {
  // Show only filename, show dir as muted prefix
  const parts  = path.split('/');
  const file   = parts.pop()!;
  const dir    = parts.length ? parts.join('/') + '/' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono transition-all border"
      style={{
        backgroundColor: active ? color + '18' : 'transparent',
        borderColor:     active ? color + '80' : '#1e293b',
        color:           active ? color : '#475569',
      }}
    >
      {dir && <span className="opacity-40">{dir}</span>}
      <span>{file}</span>
    </button>
  );
}

// ── Main Header ───────────────────────────────────────────────────── //

export default function Header() {
  const setGraphData  = useGraphStore((s) => s.setGraphData);
  const { connected } = useApiConnection();

  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  // Full result cache (never mutated — always filter from this)
  const [fullResult,  setFullResult]  = useState<AnalyzeResult | null>(null);

  // Level 1 — ecosystem
  const [ecosystems,  setEcosystems]  = useState<EcosystemSummary[]>([]);
  const [activeEco,   setActiveEco]   = useState<string>('all');

  // Level 2 — manifest within ecosystem
  // { npm: ['frontend/package.json', 'backend/package.json'], python: [...] }
  const [manifestGroups, setManifestGroups] = useState<Record<string, string[]>>({});
  const [activeManifest, setActiveManifest] = useState<string>('all');

  // ── flash helper ──────────────────────────────────────────────── //

  const flash = useCallback((msg: string, kind: 'ok' | 'err') => {
    if (kind === 'ok') { setSuccessMsg(msg); setError(null); }
    else               { setError(msg);      setSuccessMsg(null); }
    setTimeout(() => { setSuccessMsg(null); setError(null); }, 4000);
  }, []);

  // ── filter + push to graph store ─────────────────────────────── //
  //
  // Logic:
  //   eco=all,  manifest=all   → show everything
  //   eco=npm,  manifest=all   → show all npm nodes + edges
  //   eco=npm,  manifest=X     → show only root node whose manifestPath=X
  //                              + its direct dep nodes + connecting edges

  const applyFilter = useCallback(
    (result: AnalyzeResult, eco: string, manifest: string) => {
      let nodes = result.nodes;
      let edges = result.edges;

      // Level 1 — ecosystem filter
      if (eco !== 'all') {
        nodes = nodes.filter(
          (n) => (n.metadata?.ecosystem === eco) || (n.metadata?.isRoot && n.metadata?.ecosystem === eco),
        );
      }

      // Level 2 — specific manifest filter
      if (manifest !== 'all') {
        // Keep: the root node whose manifestPath matches, plus all dep nodes
        // connected to that root via edges
        const rootNode = nodes.find(
          (n) => n.metadata?.isRoot && n.metadata?.manifestPath === manifest,
        );

        if (rootNode) {
          // Get all dep IDs connected FROM this root
          const connectedDepIds = new Set(
            edges
              .filter((e) => e.source === rootNode.id)
              .map((e) => e.target),
          );
          nodes = nodes.filter(
            (n) => n.id === rootNode.id || connectedDepIds.has(n.id),
          );
        } else {
          // Fallback: filter by manifestPath or manifestPaths array
          nodes = nodes.filter((n) => {
            if (n.metadata?.manifestPath === manifest) return true;
            const mp = n.metadata?.manifestPaths as string[] | undefined;
            if (mp && mp.includes(manifest)) return true;
            return false;
          });
        }
      }

      // Always trim edges to only what visible nodes allow
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter(
        (e) => nodeIds.has(e.source as string) && nodeIds.has(e.target as string),
      );

      setGraphData({ nodes, edges });
    },
    [setGraphData],
  );

  // ── scan ──────────────────────────────────────────────────────── //

  const handleAnalyze = useCallback(async () => {
    const parsed = parseRepoInput(input);
    if (!parsed) {
      flash('Use format: owner/repo or a full GitHub URL', 'err');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setEcosystems([]);
    setManifestGroups({});
    setActiveEco('all');
    setActiveManifest('all');

    try {
      const result = await callAnalyze(parsed.owner, parsed.repo, null);
      setFullResult(result);
      setEcosystems(result.ecosystems ?? []);

      // manifestGroups comes from backend metadata
      const mg = (result.metadata.manifestGroups ?? {}) as Record<string, string[]>;
      setManifestGroups(mg);

      applyFilter(result, 'all', 'all');

      const ecoNames = [...new Set(result.ecosystems.map((e) => e.ecosystem))].join(', ');
      flash(
        `✓ ${result.metadata.totalNodes} packages · ${ecoNames} · ${result.metadata.totalEdges} deps`,
        'ok',
      );
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Analysis failed', 'err');
    } finally {
      setLoading(false);
    }
  }, [input, flash, applyFilter]);

  // ── level 1 change ────────────────────────────────────────────── //

  const handleEcoChange = useCallback(
    (eco: string) => {
      setActiveEco(eco);
      setActiveManifest('all');   // reset level 2 whenever eco changes
      if (fullResult) applyFilter(fullResult, eco, 'all');
    },
    [fullResult, applyFilter],
  );

  // ── level 2 change ────────────────────────────────────────────── //

  const handleManifestChange = useCallback(
    (manifest: string) => {
      setActiveManifest(manifest);
      if (fullResult) applyFilter(fullResult, activeEco, manifest);
    },
    [fullResult, activeEco, applyFilter],
  );

  // ── derived ───────────────────────────────────────────────────── //

  const uniqueEcos = [...new Set(ecosystems.map((e) => e.ecosystem))];

  // manifests for the currently selected ecosystem (level 2 row)
  const currentManifests: string[] =
    activeEco !== 'all' && manifestGroups[activeEco]?.length > 1
      ? manifestGroups[activeEco]
      : [];

  const ecoColor = ECOSYSTEM_COLORS[activeEco] ?? '#94a3b8';

  return (
    <header className="shrink-0 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">

      {/* ── Row 1: logo + input + button + status ─────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            OP
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">OpenPulse</span>
        </div>

        {/* Input */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="owner/repo  or  https://github.com/owner/repo"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !connected}
            className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all
              bg-indigo-600 hover:bg-indigo-500 text-white
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 004 12z"/>
                </svg>
                Scanning…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Analyze
              </>
            )}
          </button>
        </div>

        {/* API dot */}
        <div className="shrink-0 flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>
            {connected ? 'API' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Feedback ──────────────────────────────────────────────── */}
      {(error || successMsg) && (
        <div className={`px-4 pb-2 text-xs font-mono ${error ? 'text-rose-400' : 'text-emerald-400'}`}>
          {error ?? successMsg}
        </div>
      )}

      {/* ── Row 2: Level 1 — ecosystem selector ──────────────────── */}
      {uniqueEcos.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 shrink-0">Ecosystem:</span>

          {/* All badge */}
          <EcoBadge
            eco="all"
            count={ecosystems.length}
            active={activeEco === 'all'}
            onClick={() => handleEcoChange('all')}
          />

          {uniqueEcos.map((eco) => {
            const count = manifestGroups[eco]?.length ?? 1;
            return (
              <EcoBadge
                key={eco}
                eco={eco}
                count={count}
                active={activeEco === eco}
                onClick={() => handleEcoChange(eco)}
              />
            );
          })}

          {/* dep counts on the right */}
          <div className="ml-auto flex items-center gap-3">
            {[...new Set(ecosystems.map((e) => e.ecosystem))].map((eco) => {
              const total = ecosystems
                .filter((e) => e.ecosystem === eco)
                .reduce((s, e) => s + e.totalDeps, 0);
              return (
                <span key={eco} className="text-[10px] text-slate-500 font-mono">
                  <span style={{ color: ECOSYSTEM_COLORS[eco] }}>{eco}</span>
                  {' '}{total} deps
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Row 3: Level 2 — manifest selector (only when eco has 2+) */}
      {currentManifests.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">

          {/* Indent arrow */}
          <span className="text-slate-700 text-xs shrink-0 pl-2">↳</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-600 shrink-0">Manifest:</span>

          {/* All-in-ecosystem badge */}
          <ManifestBadge
            path={`all ${activeEco}`}
            active={activeManifest === 'all'}
            color={ecoColor}
            onClick={() => handleManifestChange('all')}
          />

          {currentManifests.map((mf) => (
            <ManifestBadge
              key={mf}
              path={mf}
              active={activeManifest === mf}
              color={ecoColor}
              onClick={() => handleManifestChange(mf)}
            />
          ))}
        </div>
      )}

    </header>
  );
}