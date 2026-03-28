'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ECOSYSTEM_COLORS, NODE_COLORS } from '../lib/constants';
import { useGraphStore } from '../stores/graphStore';
import type { NodeType } from '../types/graph';
import { 
  Package, 
  TrendingUp, 
  Network, 
  Info, 
  X, 
  ChevronDown, 
  Search, 
  AlertTriangle,
  Layers,
  GitBranch,
  Activity,
  Zap,
  Eye,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────── //

function riskTone(v?: number) {
  if (v === undefined) return { label: 'Unknown', color: 'bg-white/20',   hex: '#94a3b8', glow: 'rgba(148,163,184,0.3)' };
  if (v >= 0.7)        return { label: 'High',    color: 'bg-white/40',    hex: '#f87171', glow: 'rgba(248,113,113,0.5)' };
  if (v >= 0.4)        return { label: 'Medium',  color: 'bg-white/30',   hex: '#fbbf24', glow: 'rgba(251,191,36,0.4)' };
  return                      { label: 'Low',     color: 'bg-white/20', hex: '#4ade80', glow: 'rgba(74,222,128,0.3)' };
}

function RiskBar({ score }: { score: number }) {
  const t = riskTone(score);
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full rounded-full ${t.color}`} 
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ boxShadow: `0 0 4px ${t.hex}` }}
        />
      </div>
      <motion.span 
        className="text-[10px] font-mono w-7 text-right shrink-0"
        style={{ color: t.hex }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {Math.round(score * 100)}%
      </motion.span>
    </div>
  );
}

function EcoBadge({ eco }: { eco: string }) {
  const color = ECOSYSTEM_COLORS[eco] ?? '#94a3b8';
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="text-[10px] px-2 py-0.5 rounded-full font-medium border relative overflow-hidden"
      style={{
        backgroundColor: color + '11',
        color,
        borderColor: color + '40',
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {eco}
    </motion.span>
  );
}

function Collapse({ title, children, defaultOpen = false, icon }: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div 
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
      whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
      transition={{ duration: 0.2 }}
    >
      <motion.button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        whileTap={{ scale: 0.99 }}
      >
        <span className="text-xs font-medium text-white/70 flex items-center gap-2">
          {icon}
          {title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-3 pb-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConnList({ title, color, items, onSelect }: {
  title: string; color: string;
  items: { id: string; label: string; type: NodeType; riskScore?: number; ecosystem?: string }[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <motion.div 
      className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color }}>
        {title === "Depends on" ? <ArrowRight className="w-3 h-3" /> : title === "Used by" ? <ArrowLeft className="w-3 h-3" /> : null}
        {title} ({items.length})
      </p>
      <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <motion.button 
            key={item.id} 
            type="button" 
            onClick={() => onSelect(item.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all text-left group"
          >
            <motion.span 
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: NODE_COLORS[item.type] ?? '#6b7280' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-white/80 truncate flex-1 group-hover:text-white transition-colors">{item.label}</span>
            {item.ecosystem && (
              <span className="text-[9px] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ color: ECOSYSTEM_COLORS[item.ecosystem] ?? '#94a3b8' }}>
                {item.ecosystem}
              </span>
            )}
            {item.riskScore !== undefined && (
              <div className="w-16 shrink-0"><RiskBar score={item.riskScore} /></div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
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
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);

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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info className="w-3 h-3" /> },
    { id: 'risk',     label: 'Risk', icon: <AlertTriangle className="w-3 h-3" /> },
    { id: 'graph',    label: 'Graph', icon: <Network className="w-3 h-3" /> },
    { id: 'node',     label: 'Node', icon: <Package className="w-3 h-3" /> },
  ];

  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      className="flex h-full flex-col border-l border-white/10 bg-black/60 backdrop-blur-2xl overflow-hidden relative"
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* ── Tab nav with animations ───────────────────────────────── */}
      <div className="shrink-0 border-b border-white/10 bg-black/40">
        <div className="flex">
          {TABS.map((t) => (
            <motion.button 
              key={t.id} 
              type="button" 
              onClick={() => setTab(t.id)}
              onHoverStart={() => setHoveredTab(t.id)}
              onHoverEnd={() => setHoveredTab(null)}
              className={`flex-1 py-3 text-xs font-medium transition-all relative overflow-hidden ${
                tab === t.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {t.icon}
                {t.label}
                {t.id === 'node' && selectedNode && (
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-white/60"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </span>
              {tab === t.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              {hoveredTab === t.id && tab !== t.id && (
                <motion.div
                  className="absolute inset-0 bg-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Search bar with glow effect */}
        <div className="relative px-3 pb-3 pt-2">
          <motion.div
            className="relative"
            animate={search ? { scale: 1.01 } : { scale: 1 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none z-10" />
            <input
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search package name…"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
            {search && (
              <motion.button 
                onClick={() => setSearch('')}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content with animations ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* Search Results */}
          {search.trim() ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-1"
            >
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                {searchResults.length === 0
                  ? 'No packages found'
                  : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
              </p>
              {searchResults.map((node, idx) => (
                <motion.button 
                  key={node.id} 
                  type="button"
                  onClick={() => { setSelectedNode(node.id); setSearch(''); setTab('node'); }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group"
                >
                  <motion.span 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs font-mono text-white/80 truncate flex-1 group-hover:text-white">{node.label}</span>
                  {typeof node.metadata?.ecosystem === 'string' && (
                    <EcoBadge eco={node.metadata.ecosystem} />
                  )}
                  <span className="text-[10px] text-white/40 capitalize shrink-0">{node.type}</span>
                  <div className="w-16 shrink-0"><RiskBar score={node.riskScore ?? 0} /></div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* ═══ OVERVIEW ═══ */}
              {tab === 'overview' && (
                <>
                  <motion.div 
                    className="grid grid-cols-3 gap-2 text-center text-xs"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {[
                      { v: summary.nodes, l: 'Packages', icon: Package },
                      { v: summary.edges, l: 'Deps', icon: GitBranch },
                      { v: `${Math.round(summary.avgRisk * 100)}%`, l: 'Avg risk', icon: Activity },
                    ].map(({ v, l, icon: Icon }, idx) => (
                      <motion.div 
                        key={l} 
                        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3"
                        whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Icon className="w-4 h-4 text-white/40 mx-auto mb-1" />
                        <div className="text-lg font-semibold text-white">{v}</div>
                        <div className="text-white/40 text-[10px]">{l}</div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Ecosystem breakdown */}
                  {ecoCounts.length > 0 && (
                    <Collapse title="Ecosystems" defaultOpen icon={<Layers className="w-3 h-3" />}>
                      <div className="space-y-2 pt-1">
                        {ecoCounts.map(([eco, count], idx) => (
                          <motion.div 
                            key={eco} 
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: ECOSYSTEM_COLORS[eco] ?? '#94a3b8' }} />
                            <span className="text-xs text-white/60 flex-1 capitalize">{eco}</span>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / summary.nodes) * 100}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                style={{ backgroundColor: ECOSYSTEM_COLORS[eco] ?? '#94a3b8' }}
                              />
                            </div>
                            <span className="text-xs text-white/40 font-mono w-5 text-right">{count}</span>
                          </motion.div>
                        ))}
                      </div>
                    </Collapse>
                  )}

                  <Collapse title="Node types" defaultOpen icon={<Package className="w-3 h-3" />}>
                    <div className="space-y-2 pt-1">
                      {typeCounts.map(([type, count], idx) => (
                        <motion.div 
                          key={type} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280' }} />
                          <span className="text-xs text-white/60 capitalize flex-1">{type}</span>
                          <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / summary.nodes) * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              style={{ backgroundColor: NODE_COLORS[type as NodeType] ?? '#6b7280' }}
                            />
                          </div>
                          <span className="text-xs text-white/40 font-mono w-5 text-right">{count}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Collapse>

                  <Collapse title="Controls" defaultOpen icon={<Zap className="w-3 h-3" />}>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {[['Drag','Rotate'],['Scroll','Zoom'],['Right-drag','Pan'],['Click node','Inspect']].map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-white/70">{k}</span>
                          <span className="text-white/40">— {v}</span>
                        </div>
                      ))}
                    </div>
                  </Collapse>
                </>
              )}

              {/* ═══ RISK ═══ */}
              {tab === 'risk' && (
                <>
                  <motion.p 
                    className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Top {riskRanking.length} riskiest packages
                  </motion.p>
                  {riskRanking.length === 0
                    ? <p className="text-xs text-white/40 italic">No data — analyse a repo first.</p>
                    : riskRanking.map((node, i) => (
                      <motion.button 
                        key={node.id} 
                        type="button"
                        onClick={() => { setSelectedNode(node.id); setTab('node'); }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left group"
                      >
                        <span className="text-[10px] text-white/40 w-5 shrink-0 text-right">#{i + 1}</span>
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: NODE_COLORS[node.type as NodeType] ?? '#6b7280' }} />
                        <span className="text-xs font-mono text-white/70 truncate flex-1 group-hover:text-white">{node.label}</span>
                        {typeof node.metadata?.ecosystem === 'string' && (
                          <span className="text-[9px] shrink-0 opacity-60"
                            style={{ color: ECOSYSTEM_COLORS[node.metadata.ecosystem] }}>
                            {node.metadata.ecosystem}
                          </span>
                        )}
                        <div className="w-16 shrink-0"><RiskBar score={node.riskScore ?? 0} /></div>
                      </motion.button>
                    ))
                  }
                </>
              )}

              {/* ═══ GRAPH ═══ */}
              {tab === 'graph' && (
                <>
                  <Collapse title="Independent (no connections)" defaultOpen icon={<Eye className="w-3 h-3" />}>
                    <ConnList title="" color="#64748b" items={connectivity.independent.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                  </Collapse>
                  <Collapse title="Depends on others" defaultOpen icon={<ArrowRight className="w-3 h-3" />}>
                    <ConnList title="Depends on" color="#4ade80" items={connectivity.onlyDepends.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                  </Collapse>
                  <Collapse title="Used by others" defaultOpen icon={<ArrowLeft className="w-3 h-3" />}>
                    <ConnList title="Used by" color="#fbbf24" items={connectivity.onlyUsedBy.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                  </Collapse>
                  <Collapse title="Both depends & used" defaultOpen icon={<GitBranch className="w-3 h-3" />}>
                    <ConnList title="Both" color="#a78bfa" items={connectivity.both.map((n) => ({ id: n.id, label: n.label, type: n.type as NodeType, riskScore: n.riskScore, ecosystem: n.metadata?.ecosystem as string }))}
                      onSelect={(id) => { setSelectedNode(id); setTab('node'); }} />
                  </Collapse>
                </>
              )}

              {/* ═══ NODE ═══ */}
              {tab === 'node' && !selectedNode && (
                <motion.div 
                  className="flex flex-col items-center justify-center h-40 text-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Eye className="w-6 h-6 text-white/40" />
                  </motion.div>
                  <p className="text-xs text-white/40">Click any node in the graph to inspect it here.</p>
                </motion.div>
              )}

              {tab === 'node' && selectedNode && (
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Package</p>
                      <motion.h3 
                        className="mt-0.5 break-all text-sm font-semibold font-mono text-white"
                        animate={{ textShadow: ['0 0 0px white', '0 0 4px white', '0 0 0px white'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {selectedNode.label}
                      </motion.h3>
                    </div>
                    <motion.button 
                      type="button"
                      onClick={() => { setSelectedNode(null); setTab('overview'); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/40 hover:border-white/40 hover:text-white/60 transition-colors"
                    >
                      Clear
                    </motion.button>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[selectedNode.type as NodeType] }} />
                    <motion.span 
                      className="text-xs px-2 py-0.5 rounded-full font-medium capitalize border"
                      style={{
                        backgroundColor: (NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280') + '11',
                        color:           NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280',
                        borderColor:     (NODE_COLORS[selectedNode.type as NodeType] ?? '#6b7280') + '40',
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {selectedNode.type}
                    </motion.span>
                    {typeof selectedNode.metadata?.ecosystem === 'string' && (
                      <EcoBadge eco={selectedNode.metadata.ecosystem} />
                    )}
                    {(selectedNode.metadata?.isDev as boolean) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/20">
                        devDep
                      </span>
                    )}
                    {typeof selectedNode.metadata?.version === 'string' && (
                      <span className="ml-auto text-[10px] text-white/40 font-mono">
                        v{selectedNode.metadata.version as string}
                      </span>
                    )}
                  </div>

                  {/* Risk bar */}
                  <motion.div 
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 space-y-2"
                    whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Risk score</span>
                      <span className="font-mono" style={{ color: tone.hex }}>
                        {Math.round((selectedNode.riskScore ?? 0) * 100)}% — {tone.label}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div 
                        className={`h-full rounded-full ${tone.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedNode.riskScore ?? 0) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        style={{ boxShadow: `0 0 8px ${tone.hex}` }}
                      />
                    </div>
                  </motion.div>

                  {/* Package info */}
                  <Collapse title="Package info" defaultOpen icon={<Info className="w-3 h-3" />}>
                    <div className="space-y-1.5 pt-1">
                      {[
                        ['Name',      selectedNode.label],
                        ['Version',   selectedNode.metadata?.version ? `v${selectedNode.metadata.version}` : null],
                        ['Ecosystem', selectedNode.metadata?.ecosystem],
                        ['Type',      selectedNode.type],
                        ['Manifest',  selectedNode.metadata?.manifestPath],
                        ['License',   selectedNode.metadata?.license],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k as string} className="flex justify-between text-xs">
                          <span className="text-white/40">{k as string}</span>
                          <span className="font-mono text-white/60 truncate max-w-[60%] text-right">
                            {v as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Collapse>

                  {/* Connections */}
                  <ConnList
                    title="Depends on"
                    color="#4ade80"
                    items={connections.outgoing}
                    onSelect={(id) => { setSelectedNode(id); }}
                  />
                  <ConnList
                    title="Used by"
                    color="#fbbf24"
                    items={connections.incoming}
                    onSelect={(id) => { setSelectedNode(id); }}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </motion.aside>
  );
}