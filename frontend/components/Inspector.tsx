'use client';

import { useMemo, useState } from 'react';

import { NODE_COLORS } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';
import type { NodeType } from '@/types/graph';

function riskTone(value?: number) {
  if (value === undefined) return { label: 'Unknown', color: 'bg-slate-500', hex: '#64748b' };
  if (value >= 0.7) return { label: 'High', color: 'bg-rose-500', hex: '#f43f5e' };
  if (value >= 0.4) return { label: 'Medium', color: 'bg-amber-400', hex: '#fbbf24' };
  return { label: 'Low', color: 'bg-emerald-400', hex: '#34d399' };
}

export default function Inspector() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);

  const [search, setSearch] = useState('');

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // Real package name connections
  const nodeConnections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };

    const outgoing = edges
      .filter((e) => e.source === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.target);
        return { id: e.id, name: n?.label ?? e.target, type: (n?.type ?? 'library') as NodeType };
      });

    const incoming = edges
      .filter((e) => e.target === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.source);
        return { id: e.id, name: n?.label ?? e.source, type: (n?.type ?? 'library') as NodeType };
      });

    return { outgoing, incoming };
  }, [selectedNode, edges, nodes]);

  // Search
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 10);
  }, [search, nodes]);

  const summary = useMemo(() => {
    const avgRisk =
      nodes.length > 0
        ? nodes.reduce((sum, n) => sum + (n.riskScore ?? 0), 0) / nodes.length
        : 0;
    return { nodes: nodes.length, edges: edges.length, avgRisk };
  }, [nodes, edges.length]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => { counts[n.type] = (counts[n.type] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const tone = riskTone(selectedNode?.riskScore);

  return (
    <aside className="flex h-full flex-col border-l border-slate-900 bg-slate-950/92 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/60">
        <h2 className="text-base font-semibold text-slate-100">Inspector</h2>
        <p className="mt-0.5 text-xs text-slate-500">Click a node to inspect it.</p>

        {/* Search */}
        <div className="relative mt-3">
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dependency…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* Search results */}
        {search.trim() && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Results ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No packages found</p>
            ) : (
              <div className="space-y-1">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => { setSelectedNode(node.id); setSearch(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors text-left"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }}
                    />
                    <span className="text-xs text-slate-200 font-mono truncate flex-1">{node.label}</span>
                    <span className="text-[10px] text-slate-500 capitalize shrink-0">{node.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats (hidden when searching) */}
        {!search.trim() && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-lg font-semibold text-white">{summary.nodes}</div>
              <div className="text-slate-500">Nodes</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-lg font-semibold text-white">{summary.edges}</div>
              <div className="text-slate-500">Edges</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-lg font-semibold text-white">{Math.round(summary.avgRisk * 100)}%</div>
              <div className="text-slate-500">Avg risk</div>
            </div>
          </div>
        )}

        {/* Selected node details (hidden when searching) */}
        {!search.trim() && selectedNode && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300 space-y-4">

            {/* Name + clear */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Selected package</p>
                <h3 className="mt-1 break-all text-base font-semibold text-slate-100 font-mono">{selectedNode.label}</h3>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
                onClick={() => setSelectedNode(null)}
              >
                Clear
              </button>
            </div>

            {/* Type + risk badge */}
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: NODE_COLORS[selectedNode.type as NodeType] }}
              />
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize border"
                style={{
                  backgroundColor: (NODE_COLORS[selectedNode.type as NodeType]) + '22',
                  color: NODE_COLORS[selectedNode.type as NodeType],
                  borderColor: (NODE_COLORS[selectedNode.type as NodeType]) + '55',
                }}
              >
                {selectedNode.type}
              </span>
              {(selectedNode.metadata?.isDev as boolean) && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400 border border-purple-800/50">
                  devDependency
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Risk score</span>
                <span className="font-mono" style={{ color: tone.hex }}>
                  {Math.round((selectedNode.riskScore ?? 0) * 100)}% — {tone.label}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${tone.color}`}
                  style={{ width: `${Math.round((selectedNode.riskScore ?? 0) * 100)}%` }}
                />
              </div>
            </div>

            {/* License / metadata */}
            {(selectedNode.metadata?.license || selectedNode.metadata?.version) && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Package info</p>
                <div className="space-y-1.5 text-xs">
                  {selectedNode.metadata.version && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Version</span>
                      <span className="font-mono text-slate-200">v{selectedNode.metadata.version as string}</span>
                    </div>
                  )}
                  {selectedNode.metadata.license && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">License</span>
                      <span className="font-mono text-slate-200">{selectedNode.metadata.license as string}</span>
                    </div>
                  )}
                  {selectedNode.metadata.source && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source</span>
                      <span className="font-mono text-slate-200">{selectedNode.metadata.source as string}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Depends on (outgoing) */}
            {nodeConnections.outgoing.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Depends on ({nodeConnections.outgoing.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {nodeConnections.outgoing.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedNode(nodes.find((n) => n.label === c.name)?.id ?? null)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 transition-colors text-left"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[c.type] ?? '#6b7280' }}
                      />
                      <span className="text-xs font-mono text-slate-300 truncate">{c.name}</span>
                      <span className="ml-auto text-[10px] text-slate-600 capitalize shrink-0">{c.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Used by (incoming) */}
            {nodeConnections.incoming.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Used by ({nodeConnections.incoming.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {nodeConnections.incoming.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedNode(nodes.find((n) => n.label === c.name)?.id ?? null)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 transition-colors text-left"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[c.type] ?? '#6b7280' }}
                      />
                      <span className="text-xs font-mono text-slate-300 truncate">{c.name}</span>
                      <span className="ml-auto text-[10px] text-slate-600 capitalize shrink-0">{c.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!search.trim() && !selectedNode && (
          <>
            <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
              Select a node to inspect package type, risk score, and dependencies.
            </div>

            {/* Type breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Node types</p>
              <div className="space-y-2">
                {typeCounts.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280' }}
                    />
                    <span className="text-xs text-slate-400 capitalize flex-1">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / summary.nodes) * 100}%`,
                            backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Controls</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p>🖱 Drag — rotate camera</p>
                <p>🔍 Scroll — zoom in / out</p>
                <p>⌥ Right-drag — pan</p>
                <p>👆 Click node — inspect</p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}