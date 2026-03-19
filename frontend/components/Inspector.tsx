'use client';

import { useMemo } from 'react';

import { NODE_COLORS } from '@/lib/constants';
import { useGraphStore } from '@/stores/graphStore';

function riskTone(value?: number) {
  if (value === undefined) {
    return { label: 'Unknown', color: 'bg-slate-500' };
  }
  if (value >= 0.7) {
    return { label: 'High', color: 'bg-rose-500' };
  }
  if (value >= 0.4) {
    return { label: 'Medium', color: 'bg-amber-400' };
  }
  return { label: 'Low', color: 'bg-emerald-400' };
}

export default function Inspector() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const nodeMetrics = useMemo(() => {
    if (!selectedNode) {
      return { incoming: 0, outgoing: 0, neighbors: [] as string[] };
    }

    const incoming = edges.filter((edge) => edge.target === selectedNode.id);
    const outgoing = edges.filter((edge) => edge.source === selectedNode.id);
    const neighbors = [...incoming.map((edge) => edge.source), ...outgoing.map((edge) => edge.target)];
    return {
      incoming: incoming.length,
      outgoing: outgoing.length,
      neighbors,
    };
  }, [edges, selectedNode]);

  const summary = useMemo(() => {
    const avgRisk =
      nodes.length > 0
        ? nodes.reduce((total, node) => total + (node.riskScore ?? 0), 0) / nodes.length
        : 0;

    return {
      nodes: nodes.length,
      edges: edges.length,
      avgRisk,
    };
  }, [edges.length, nodes]);

  const tone = riskTone(selectedNode?.riskScore);

  return (
    <aside className="flex h-full flex-col border-l border-slate-900 bg-slate-950/92 px-4 py-4 backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Node details</h2>
        <p className="mt-1 text-sm text-slate-400">Click a node in the graph to inspect it.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-lg font-semibold text-white">{summary.nodes}</div>
          <div>Nodes</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-lg font-semibold text-white">{summary.edges}</div>
          <div>Edges</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-lg font-semibold text-white">{Math.round(summary.avgRisk * 100)}%</div>
          <div>Avg risk</div>
        </div>
      </div>

      {selectedNode ? (
        <div className="mt-4 flex-1 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected</p>
              <h3 className="mt-1 break-all text-base font-semibold text-slate-100">{selectedNode.label}</h3>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
              onClick={() => setSelectedNode(null)}
            >
              Clear
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
            />
            <span className="capitalize text-slate-200">{selectedNode.type}</span>
            <span className={`ml-auto h-2.5 w-2.5 rounded-full ${tone.color}`} />
            <span>{tone.label}</span>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Risk score</span>
              <span className="font-medium text-slate-100">{Math.round((selectedNode.riskScore ?? 0) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${tone.color}`}
                style={{ width: `${Math.round((selectedNode.riskScore ?? 0) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Incoming {nodeMetrics.incoming}</span>
              <span>Outgoing {nodeMetrics.outgoing}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Metadata</p>
            <div className="mt-2 space-y-2 text-xs text-slate-300">
              {Object.entries(selectedNode.metadata ?? {}).map(([key, value]) => (
                <div className="flex items-center justify-between gap-3" key={key}>
                  <span className="text-slate-500">{key}</span>
                  <span className="truncate font-mono text-slate-200">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Connected nodes</p>
            <div className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto text-xs text-slate-300">
              {nodeMetrics.neighbors.map((neighborId) => (
                <button
                  type="button"
                  key={neighborId}
                  onClick={() => setSelectedNode(neighborId)}
                  className="truncate rounded-xl border border-slate-800 px-3 py-2 text-left hover:border-slate-600 hover:bg-slate-900"
                >
                  {neighborId}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
          Select a node to inspect package type, risk score, and graph connectivity.
        </div>
      )}
    </aside>
  );
}
