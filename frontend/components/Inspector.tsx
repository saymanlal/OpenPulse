'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ECOSYSTEM_COLORS, NODE_COLORS } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';
import type { NodeType } from '@/types/graph';

// ── Helpers ────────────────────────────────────────────────────────── //

function riskTone(v?: number) {
  if (v === undefined) return { label: 'Unknown', color: 'bg-slate-500',   hex: '#64748b' };
  if (v >= 0.7)        return { label: 'High',    color: 'bg-rose-500',    hex: '#f43f5e' };
  if (v >= 0.4)        return { label: 'Medium',  color: 'bg-amber-400',   hex: '#fbbf24' };
  return                      { label: 'Low',     color: 'bg-emerald-400', hex: '#34d399' };
}

function RiskBar({ score }: { score: number }) {
  const t = riskTone(score);
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${t.color}`} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-[10px] font-mono w-7 text-right shrink-0" style={{ color: t.hex }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

function EcoBadge({ eco }: { eco: string }) {
  const color = ECOSYSTEM_COLORS[eco] ?? '#94a3b8';
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
      style={{
        backgroundColor: color + '22',
        color,
        borderColor: color + '55',
      }}
    >
      {eco}
    </span>
  );
}

function Collapse({
  title, children, defaultOpen = false,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left">
        <span className="text-xs font-medium text-slate-300">{title}</span>
        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function ConnList({ title, color, items, onSelect }: {
  title: string; color: string;
  items: { id: string; label: string; type: NodeType; riskScore?: number; ecosystem?: string }[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color }}>
        {title} ({items.length})
      </p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 transition-colors text-left">
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[item.type] ?? '#6b7280' }} />
            <span className="text-xs font-mono text-slate-200 truncate flex-1">{item.label}</span>
            {item.ecosystem && (
              <span className="text-[9px] shrink-0"
                style={{ color: ECOSYSTEM_COLORS[item.ecosystem] ?? '#94a3b8' }}>
                {item.ecosystem}
              </span>
            )}
            {item.riskScore !== undefined && (
              <div className="w-16 shrink-0"><RiskBar score={item.riskScore} /></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

type Tab = 'overview' | 'risk' | 'graph' | 'node';

// ── Inspector ─────────────────────────────────────────────────────── //

export default function Inspector() {
  const nodes           = useGraphStore((s) => s.nodes);
  const edges           = useGraphStore((s) => s.edges);
  const selectedNodeId  = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  const [search, setSearch] = useState('');
  const [tab, setTab]       = useState<Tab>('overview');

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // Auto-switch to node tab
  const prevSelRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelRef.current) setTab('node');
    prevSelRef.current = selectedNodeId;
  }, [selectedNodeId]);

  // Connections for selected node
  const connections = useMemo(() => {
    if (!selectedNode) return { outgoing: [], incoming: [] };
    const outgoing = edges
      .filter((e) => e.source === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.target);
        return {
          id: e.id,
          label: n?.label ?? e.target,
          type: (n?.type ?? 'library') as NodeType,
          riskScore: n?.riskScore,
          ecosystem: n?.metadata?.ecosystem as string | undefined,
        };
      });
    const incoming = edges
      .filter((e) => e.target === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.source);
        return {
          id: e.id,
          label: n?.label ?? e.source,
          type: (n?.type ?? 'library') as NodeType,
          riskScore: n?.riskScore,
          ecosystem: n?.metadata?.ecosystem as string | undefined,
        };
      });
    return { outgoing, incoming };
  }, [selectedNode, edges, nodes]);

  // Search results
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 15);
  }, [search, nodes]);

  // Stats
  const summary = useMemo(() => {
    const avgRisk = nodes.length
      ? nodes.reduce((s, n) => s + (n.riskScore ?? 0), 0) / nodes.length : 0;
    return { nodes: nodes.length, edges: edges.length, avgRisk };
  }, [nodes, edges.length]);

  // Type counts
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    nodes.forEach((n) => { c[n.type] = (c[n.type] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  // Ecosystem counts
  const ecoCounts = useMemo(() => {
    const c: Record<string, number> = {};
    nodes.forEach((n) => {
      const eco = (n.metadata?.ecosystem as string) ?? 'unknown';
      c[eco] = (c[eco] ?? 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  // Risk ranking
  const riskRanking = useMemo(() =>
    [...nodes]
      .filter((n) => !n.metadata?.isRoot)
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 20),
  [nodes]);

  // Graph connectivity groups
  const connectivity = useMemo(() => {
    const independent  = nodes.filter((n) => !edges.some((e) => e.source === n.id || e.target === n.id));
    const onlyDepends  = nodes.filter((n) => edges.some((e) => e.source === n.id) && !edges.some((e) => e.target === n.id));
    const onlyUsedBy   = nodes.filter((n) => !edges.some((e) => e.source === n.id) && edges.some((e) => e.target === n.id));
    const both         = nodes.filter((n) => edges.some((e) => e.source === n.id) && edges.some((e) => e.target === n.id));
    return { independent, onlyDepends, onlyUsedBy, both };
  }, [nodes, edges]);

  const tone = riskTone(selectedNode?.riskScore);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'risk',     label: 'Risk' },
    { id: 'graph',    label: 'Graph' },
    { id: 'node',     label: 'Node' },
  ];

  return (
    <aside className="flex h-full flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-hidden">

      {/* ── Tab nav ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-800">
        <div className="flex">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
              {t.id === 'node' && selectedNode && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative px-3 pb-2.5 pt-2">
          <svg className="absolute left-5 top-[18px] w-3.5 h-3.5 text-slate-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search package name…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-5 top-[18px] text-slate-500 hover:text-slate-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search results overlay ────────────────────────────────── */}
      {search.trim() ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            {searchResults.length === 0
              ? 'No packages found'
              : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
          </p>
          {searchResults.map((node) => (
            <button key={node.id} type="button"
              onClick={() => { setSelectedNode(node.id); setSearch(''); setTab('node'); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-colors text-left">
              <span className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }} />
              <span className="text-xs font-mono text-slate-100 truncate flex-1">{node.label}</span>
              {node.metadata?.ecosystem && (
                <EcoBadge eco={node.metadata.ecosystem as string} />
              )}
              <span className="text-[10px] text-slate-500 capitalize shrink-0">{node.type}</span>
              <div className="w-16 shrink-0"><RiskBar score={node.riskScore ?? 0} /></div>
            </button>
          ))}
        </div>

      ) : (

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { v: summary.nodes, l: 'Packages' },
                  { v: summary.edges, l: 'Deps'     },
                  { v: `${Math.round(summary.avgRisk * 100)}%`, l: 'Avg risk' },
                ].map(({ v, l }) => (
                  <div key={l} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <div className="text-lg font-semibold text-white">{v}</div>
                    <div className="text-slate-500">{l}</div>
                  </div>
                ))}
              </div>

              {/* Ecosystem breakdown */}
              {ecoCounts.length > 0 && (
                <Collapse title="🌐 Ecosystems" defaultOpen>
                  <div className="space-y-2 pt-1">
                    {ecoCounts.map(([eco, count]) => (
                      <div key={eco} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ECOSYSTEM_COLORS[eco] ?? '#94a3b8' }} />
                        <span className="text-xs text-slate-400 flex-1 capitalize">{eco}</span>
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${(count / summary.nodes) * 100}%`,
                              backgroundColor: ECOSYSTEM_COLORS[eco] ?? '#94a3b8',
                            }} />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-5 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </Collapse>
              )}

              <Collapse title="📦 Node types" defaultOpen>
                <div className="space-y-2 pt-1">
                  {typeCounts.map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280' }} />
                      <span className="text-xs text-slate-400 capitalize flex-1">{type}</span>
                      <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${(count / summary.nodes) * 100}%`,
                            backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280',
                          }} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </Collapse>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Controls</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {[['Drag','Rotate'],['Scroll','Zoom'],['Right-drag','Pan'],['Click node','Inspect']].map(([k, v]) => (
                    <div key={k} className="flex gap-1">
                      <span className="text-slate-300">{k}</span>
                      <span className="text-slate-500">— {v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ RISK ═══ */}
          {tab === 'risk' && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Top {riskRanking.length} riskiest packages
              </p>
              {riskRanking.length === 0
                ? <p className="text-xs text-slate-600 italic">No data — analyse a repo first.</p>
                : riskRanking.map((node, i) => (
                  <button key={node.id} type="button"
                    onClick={() => { setSelectedNode(node.id); setTab('node'); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors text-left">
                    <span className="text-[10px] text-slate-600 w-5 shrink-0 text-right">#{i + 1}</span>
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }} />
                    <span className="text-xs font-mono text-slate-300 truncate flex-1">{node.label}</span>
                    {node.metadata?.ecosystem && (
                      <span className="text-[9px] shrink-0"
                        style={{ color: ECOSYSTEM_COLORS[node.metadata.ecosystem as string] }}>
                        {node.metadata.ecosystem as string}
                      </span>
                    )}
                    <div className="w-16 shrink-0"><RiskBar score={node.riskScore ?? 0} /></div>
                  </button>
                ))
              }
            </>
          )}

          {/* ═══ GRAPH ═══ */}
          {tab === 'graph' && (
            <>
              <Collapse title="🔗 Independent (no connections)" defaultOpen>
                <ConnList title="" color="#64748b" items={connectivity.independent.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                  onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
              </Collapse>
              <Collapse title="➡️ Depends on others" defaultOpen>
                <ConnList title="" color="#34d399" items={connectivity.onlyDepends.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                  onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
              </Collapse>
              <Collapse title="⬅️ Used by others" defaultOpen>
                <ConnList title="" color="#fb923c" items={connectivity.onlyUsedBy.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                  onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
              </Collapse>
              <Collapse title="↔️ Both depends & used" defaultOpen>
                <ConnList title="" color="#a78bfa" items={connectivity.both.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                  onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
              </Collapse>
            </>
          )}

          {/* ═══ NODE ═══ */}
          {tab === 'node' && !selectedNode && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-slate-600 text-lg">↗</span>
              </div>
              <p className="text-xs text-slate-500">Click any node in the graph to inspect it here.</p>
            </div>
          )}

          {tab === 'node' && selectedNode && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Package</p>
                  <h3 className="mt-0.5 break-all text-sm font-semibold font-mono text-yellow-300">
                    {selectedNode.label}
                  </h3>
                </div>
                <button type="button"
                  onClick={() => { setSelectedNode(null); setTab('overview'); }}
                  className="shrink-0 rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white transition-colors">
                  Clear
                </button>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type as NodeType] }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize border"
                  style={{
                    backgroundColor: (NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280') + '22',
                    color:           NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280',
                    borderColor:     (NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280') + '55',
                  }}>
                  {selectedNode.type}
                </span>
                {selectedNode.metadata?.ecosystem && (
                  <EcoBadge eco={selectedNode.metadata.ecosystem as string} />
                )}
                {(selectedNode.metadata?.isDev as boolean) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400 border border-purple-800/50">
                    devDep
                  </span>
                )}
                {selectedNode.metadata?.version && (
                  <span className="ml-auto text-[10px] text-slate-500 font-mono">
                    v{selectedNode.metadata.version as string}
                  </span>
                )}
              </div>

              {/* Risk bar */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Risk score</span>
                  <span className="font-mono" style={{ color: tone.hex }}>
                    {Math.round((selectedNode.riskScore ?? 0) * 100)}% — {tone.label}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full ${tone.color}`}
                    style={{ width: `${(selectedNode.riskScore ?? 0) * 100}%` }} />
                </div>
              </div>

              {/* Package info */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Package info</p>
                {[
                  ['Name',      selectedNode.label],
                  ['Version',   selectedNode.metadata?.version ? `v${selectedNode.metadata.version}` : null],
                  ['Ecosystem', selectedNode.metadata?.ecosystem],
                  ['Type',      selectedNode.type],
                  ['Manifest',  selectedNode.metadata?.manifestPath],
                  ['License',   selectedNode.metadata?.license],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-xs">
                    <span className="text-slate-500">{k as string}</span>
                    <span className="font-mono text-slate-200 truncate max-w-[60%] text-right">
                      {v as string}
                    </span>
                  </div>
                ))}
              </div>

              {/* Connections */}
              <ConnList
                title="Depends on"
                color="#34d399"
                items={connections.outgoing}
                onSelect={(id) => { setSelectedNode(id); }}
              />
              <ConnList
                title="Used by"
                color="#fb923c"
                items={connections.incoming}
                onSelect={(id) => { setSelectedNode(id); }}
              />
            </div>
          )}

        </div>
      )}
    </aside>
  );
}