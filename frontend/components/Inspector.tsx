'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { NODE_COLORS } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';
import type { NodeType } from '@/types/graph';

function riskTone(v?: number) {
  if (v === undefined) return { label: 'Unknown', color: 'bg-slate-500', hex: '#64748b' };
  if (v >= 0.7)        return { label: 'High',    color: 'bg-rose-500',  hex: '#f43f5e' };
  if (v >= 0.4)        return { label: 'Medium',  color: 'bg-amber-400', hex: '#fbbf24' };
  return                      { label: 'Low',     color: 'bg-emerald-400', hex: '#34d399' };
}

function RiskBar({ score }: { score: number }) {
  const t = riskTone(score);
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${t.color}`} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-[10px] font-mono w-7 text-right shrink-0" style={{ color: t.hex }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

function CollapsibleSection({
  title, children, defaultOpen = false,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
        <span className="text-xs font-mono font-medium text-white/60">{title}</span>
        <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
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
  items: { id: string; name: string; type: NodeType; risk: number }[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-mono font-bold tracking-wider mb-2" style={{ color }}>{title}</p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c.name)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left group">
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[c.type] ?? '#6b7280' }} />
            <span className="text-xs font-mono text-white/60 group-hover:text-white/80 truncate flex-1 transition-colors">{c.name}</span>
            <RiskBar score={c.risk} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnGroup({ title, color, nodes, onSelect }: {
  title: string; color: string;
  nodes: { id: string; label: string; type: NodeType; riskScore?: number }[];
  onSelect: (id: string) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-mono font-bold tracking-wider mb-1.5" style={{ color }}>
        {title} ({nodes.length})
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {nodes.map((n) => (
          <button key={n.id} type="button" onClick={() => onSelect(n.id)}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-left group">
            <span className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[n.type] ?? '#6b7280' }} />
            <span className="text-xs font-mono text-white/60 group-hover:text-white/80 truncate flex-1 transition-colors">{n.label}</span>
            {n.riskScore !== undefined && <RiskBar score={n.riskScore} />}
          </button>
        ))}
      </div>
    </div>
  );
}

type Tab = 'overview' | 'risk' | 'graph' | 'node';

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

  // Auto-switch to node tab when selection changes
  const prevSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelectedRef.current) {
      setTab('node');
    }
    prevSelectedRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const nodeConnections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };
    const outgoing = edges
      .filter((e) => e.source === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.target);
        return { id: e.id, name: n?.label ?? e.target, type: (n?.type ?? 'library') as NodeType, risk: n?.riskScore ?? 0 };
      });
    const incoming = edges
      .filter((e) => e.target === selectedNode.id)
      .map((e) => {
        const n = nodes.find((x) => x.id === e.source);
        return { id: e.id, name: n?.label ?? e.source, type: (n?.type ?? 'library') as NodeType, risk: n?.riskScore ?? 0 };
      });
    return { outgoing, incoming };
  }, [selectedNode, edges, nodes]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter((n) => n.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [search, nodes]);

  const summary = useMemo(() => {
    const avgRisk = nodes.length > 0
      ? nodes.reduce((s, n) => s + (n.riskScore ?? 0), 0) / nodes.length : 0;
    return { nodes: nodes.length, edges: edges.length, avgRisk };
  }, [nodes, edges.length]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    nodes.forEach((n) => { c[n.type] = (c[n.type] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const riskRanking = useMemo(() =>
    [...nodes]
      .filter((n) => !n.metadata?.isRoot)
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 20),
    [nodes],
  );

  const connectivityGroups = useMemo(() => {
    const independent = nodes.filter((n) =>
      !edges.some((e) => e.source === n.id || e.target === n.id));
    const onlyDepends = nodes.filter((n) =>
      edges.some((e) => e.source === n.id) && !edges.some((e) => e.target === n.id));
    const onlyUsedBy  = nodes.filter((n) =>
      !edges.some((e) => e.source === n.id) && edges.some((e) => e.target === n.id));
    const both        = nodes.filter((n) =>
      edges.some((e) => e.source === n.id) && edges.some((e) => e.target === n.id));
    return { independent, onlyDepends, onlyUsedBy, both };
  }, [nodes, edges]);

  const tone = riskTone(selectedNode?.riskScore);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'risk',     label: 'RISK' },
    { id: 'graph',    label: 'GRAPH' },
    { id: 'node',     label: 'NODE' },
  ];

  return (
    <aside className="flex h-full flex-col border-l border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden mt-2">

      {/* tab nav */}
      <div className="shrink-0 border-b border-white/10">
        <div className="flex">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}>
              {t.label}
              {t.id === 'node' && selectedNode && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block align-middle animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* search bar */}
        <div className="relative px-3 pb-2.5 pt-2">
          <svg className="absolute left-5 top-[18px] w-3.5 h-3.5 text-white/40 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH DEPENDENCY..."
            className="w-full bg-white/5 border border-white/20 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-5 top-[18px] text-white/40 hover:text-white/60">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* search results overlay */}
      {search.trim() ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="text-[10px] font-mono font-bold tracking-wider text-white/40 mb-2">
            {searchResults.length === 0
              ? 'NO PACKAGES FOUND'
              : `${searchResults.length} RESULT${searchResults.length !== 1 ? 'S' : ''}`}
          </p>
          {searchResults.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                setSelectedNode(node.id);
                setSearch('');
                setTab('node');
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }}
              />
              <span className="text-xs font-mono text-white/80 group-hover:text-white truncate flex-1">
                {node.label}
              </span>
              <span className="text-[10px] font-mono text-white/40 capitalize shrink-0 mr-1">
                {node.type}
              </span>
              <div className="w-20 shrink-0">
                <RiskBar score={node.riskScore ?? 0} />
              </div>
            </button>
          ))}
        </div>

      ) : (

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { v: summary.nodes, l: 'PACKAGES' },
                  { v: summary.edges, l: 'DEPS' },
                  { v: `${Math.round(summary.avgRisk * 100)}%`, l: 'AVG RISK' },
                ].map(({ v, l }) => (
                  <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-lg font-black text-white">{v}</div>
                    <div className="text-[10px] font-mono font-bold tracking-wider text-white/40">{l}</div>
                  </div>
                ))}
              </div>

              <CollapsibleSection title="📦 NODE TYPES" defaultOpen>
                <div className="space-y-2 pt-1">
                  {typeCounts.map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280' }} />
                      <span className="text-xs font-mono text-white/60 capitalize flex-1">{type}</span>
                      <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${(count / summary.nodes) * 100}%`,
                            backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280',
                          }} />
                      </div>
                      <span className="text-xs font-mono text-white/40 w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-mono font-bold tracking-wider text-white/40 mb-2">CONTROLS</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
                  {[['DRAG','ROTATE'],['SCROLL','ZOOM'],['RIGHT-DRAG','PAN'],['CLICK NODE','INSPECT']].map(([k,v]) => (
                    <div key={k} className="flex gap-1">
                      <span className="text-white/60">{k}</span>
                      <span className="text-white/30">— {v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* RISK TAB */}
          {tab === 'risk' && (
            <>
              <p className="text-[10px] font-mono font-bold tracking-wider text-white/40">
                TOP {riskRanking.length} RISKIEST PACKAGES
              </p>
              {riskRanking.length === 0
                ? <p className="text-xs font-mono text-white/30 italic">NO DATA — ANALYZE A REPO FIRST</p>
                : riskRanking.map((node, i) => (
                  <button key={node.id} type="button"
                    onClick={() => { setSelectedNode(node.id); setTab('node'); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group">
                    <span className="text-[10px] font-mono text-white/40 w-5 shrink-0 text-right">#{i + 1}</span>
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }} />
                    <span className="text-xs font-mono text-white/80 group-hover:text-white truncate flex-1">{node.label}</span>
                    <div className="w-20 shrink-0"><RiskBar score={node.riskScore ?? 0} /></div>
                  </button>
                ))
              }
            </>
          )}

          {/* GRAPH TAB */}
          {tab === 'graph' && (
            <>
              <CollapsibleSection title="🔗 INDEPENDENT (NO CONNECTIONS)" defaultOpen>
                {connectivityGroups.independent.length === 0
                  ? <p className="text-xs font-mono text-white/30 italic pt-1">NONE</p>
                  : <ConnGroup title="" color="#64748b" nodes={connectivityGroups.independent}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                }
              </CollapsibleSection>

              <CollapsibleSection title="➡️ ONLY DEPENDS ON OTHERS" defaultOpen>
                {connectivityGroups.onlyDepends.length === 0
                  ? <p className="text-xs font-mono text-white/30 italic pt-1">NONE</p>
                  : <ConnGroup title="" color="#34d399" nodes={connectivityGroups.onlyDepends}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                }
              </CollapsibleSection>

              <CollapsibleSection title="⬅️ ONLY USED BY OTHERS" defaultOpen>
                {connectivityGroups.onlyUsedBy.length === 0
                  ? <p className="text-xs font-mono text-white/30 italic pt-1">NONE</p>
                  : <ConnGroup title="" color="#fb923c" nodes={connectivityGroups.onlyUsedBy}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                }
              </CollapsibleSection>

              <CollapsibleSection title="↔️ BOTH DEPENDS & USED BY" defaultOpen>
                {connectivityGroups.both.length === 0
                  ? <p className="text-xs font-mono text-white/30 italic pt-1">NONE</p>
                  : <ConnGroup title="" color="#a78bfa" nodes={connectivityGroups.both}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                }
              </CollapsibleSection>
            </>
          )}

          {/* NODE TAB */}
          {tab === 'node' && !selectedNode && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-white/40 text-lg">↗</span>
              </div>
              <p className="text-xs font-mono text-white/40">CLICK ANY NODE IN THE GRAPH TO INSPECT IT HERE</p>
            </div>
          )}

          {tab === 'node' && selectedNode && (
            <div className="space-y-3">
              {/* header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold tracking-wider text-white/40">SELECTED</p>
                  <h3 className="mt-0.5 break-all text-sm font-black font-mono text-yellow-400">
                    {selectedNode.label}
                  </h3>
                </div>
                <button type="button"
                  onClick={() => { setSelectedNode(null); setTab('overview'); }}
                  className="shrink-0 rounded-lg border border-white/20 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider text-white/40 hover:border-white/40 hover:text-white/60 transition-colors">
                  CLEAR
                </button>
              </div>

              {/* type + badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type as NodeType] }} />
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold capitalize border"
                  style={{
                    backgroundColor: (NODE_COLORS[selectedNode.type as NodeType]) + '22',
                    color: NODE_COLORS[selectedNode.type as NodeType],
                    borderColor: (NODE_COLORS[selectedNode.type as NodeType]) + '55',
                  }}>
                  {selectedNode.type}
                </span>
                {(selectedNode.metadata?.isDev as boolean) && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    DEV DEP
                  </span>
                )}
                {selectedNode.metadata?.version && (
                  <span className="ml-auto text-[10px] font-mono text-white/40">
                    v{selectedNode.metadata.version as string}
                  </span>
                )}
              </div>

              {/* risk bar */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white/40">RISK SCORE</span>
                  <span className="font-mono font-bold" style={{ color: tone.hex }}>
                    {Math.round((selectedNode.riskScore ?? 0) * 100)}% — {tone.label}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${tone.color}`}
                    style={{ width: `${Math.round((selectedNode.riskScore ?? 0) * 100)}%` }} />
                </div>
              </div>

              {/* metadata */}
              {(selectedNode.metadata?.license || selectedNode.metadata?.version) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5">
                  <p className="text-[10px] font-mono font-bold tracking-wider text-white/40">PACKAGE INFO</p>
                  {[
                    ['VERSION', selectedNode.metadata.version ? `v${selectedNode.metadata.version}` : null],
                    ['LICENSE', selectedNode.metadata.license],
                    ['SOURCE',  selectedNode.metadata.source],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string} className="flex justify-between text-xs font-mono">
                      <span className="text-white/40">{k as string}</span>
                      <span className="text-white/80">{v as string}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* depends on */}
              {nodeConnections.outgoing.length > 0 && (
                <ConnList
                  title={`DEPENDS ON (${nodeConnections.outgoing.length})`}
                  color="#34d399"
                  items={nodeConnections.outgoing}
                  onSelect={(name) => {
                    const n = nodes.find((x) => x.label === name);
                    if (n) { setSelectedNode(n.id); setTab('node'); }
                  }}
                />
              )}

              {/* used by */}
              {nodeConnections.incoming.length > 0 && (
                <ConnList
                  title={`USED BY (${nodeConnections.incoming.length})`}
                  color="#fb923c"
                  items={nodeConnections.incoming}
                  onSelect={(name) => {
                    const n = nodes.find((x) => x.label === name);
                    if (n) { setSelectedNode(n.id); setTab('node'); }
                  }}
                />
              )}
            </div>
          )}

        </div>
      )}
    </aside>
  );
}