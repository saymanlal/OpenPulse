'use client';

import { useState, useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { NODE_COLORS } from '@/lib/constants';
import type { NodeType } from '@/types/graph';

type ViewMode = 'details' | 'search' | 'stats';

export default function Inspector() {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NodeType | 'all'>('all');

  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const nodeConnections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };

    const incoming = edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => nodes.find((n) => n.id === edge.source))
      .filter(Boolean);

    const outgoing = edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => nodes.find((n) => n.id === edge.target))
      .filter(Boolean);

    return { incoming, outgoing };
  }, [selectedNode, edges, nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch = 
        searchQuery === '' ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || node.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [nodes, searchQuery, typeFilter]);

  const nodeTypeStats = useMemo(() => {
    const stats = new Map<NodeType, number>();
    nodes.forEach((node) => {
      stats.set(node.type, (stats.get(node.type) || 0) + 1);
    });
    return stats;
  }, [nodes]);

  const graphStats = useMemo(() => {
    const avgConnections = nodes.length > 0 
      ? edges.length / nodes.length 
      : 0;

    const connectionCounts = nodes.map((node) => {
      const incoming = edges.filter((e) => e.target === node.id).length;
      const outgoing = edges.filter((e) => e.source === node.id).length;
      return incoming + outgoing;
    });

    const maxConnections = Math.max(...connectionCounts, 0);
    const hubNode = nodes[connectionCounts.indexOf(maxConnections)];

    return {
      avgConnections: avgConnections.toFixed(2),
      maxConnections,
      hubNode,
    };
  }, [nodes, edges]);

  return (
    <div 
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-4 -translate-x-full bg-gray-800 hover:bg-gray-700 p-2 rounded-l transition-colors"
        aria-label={isOpen ? 'Close inspector' : 'Open inspector'}
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Inspector</h2>
            
            {/* View Mode Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('details')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  viewMode === 'details'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  viewMode === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  viewMode === 'stats'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Stats
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Details View */}
            {viewMode === 'details' && (
              <div className="space-y-4">
                {selectedNode ? (
                  <>
                    <div className="bg-gray-800/50 rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-200">Selected Node</h3>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="text-xs text-gray-400 hover:text-gray-200"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">ID:</span>
                          <span className="ml-2 text-gray-200 font-mono text-xs">{selectedNode.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Label:</span>
                          <span className="ml-2 text-gray-200">{selectedNode.label}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400">Type:</span>
                          <span className="ml-2 capitalize text-gray-200">{selectedNode.type}</span>
                          <div 
                            className="ml-2 w-3 h-3 rounded-full"
                            style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                          />
                        </div>
                        {selectedNode.riskScore !== undefined && (
                          <div>
                            <span className="text-gray-400">Risk Score:</span>
                            <span className="ml-2 text-gray-200">
                              {(selectedNode.riskScore * 100).toFixed(0)}%
                            </span>
                            <div className="mt-1 w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${selectedNode.riskScore * 100}%`,
                                  backgroundColor: selectedNode.riskScore > 0.7 ? '#ef4444' : 
                                                   selectedNode.riskScore > 0.4 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {selectedNode.metadata && (
                          <div className="pt-2 border-t border-gray-700">
                            <span className="text-gray-400 text-xs">Metadata:</span>
                            <div className="mt-1 space-y-1 text-xs">
                              {Object.entries(selectedNode.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500">{key}:</span>
                                  <span className="text-gray-300 font-mono truncate ml-2">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-800 pt-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Connections</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Incoming:</span>
                          <span className="text-gray-200 font-mono">{nodeConnections.incoming.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Outgoing:</span>
                          <span className="text-gray-200 font-mono">{nodeConnections.outgoing.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Total:</span>
                          <span className="text-gray-200 font-mono font-bold">
                            {nodeConnections.incoming.length + nodeConnections.outgoing.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(nodeConnections.incoming.length > 0 || nodeConnections.outgoing.length > 0) && (
                      <div className="border-t border-gray-800 pt-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Connected Nodes</h3>
                        <div className="space-y-2 text-xs max-h-40 overflow-y-auto">
                          {nodeConnections.incoming.map((node) => (
                            <div 
                              key={node!.id} 
                              className="flex items-center gap-2 text-gray-400 hover:text-gray-200 cursor-pointer p-1 hover:bg-gray-800/50 rounded"
                              onClick={() => setSelectedNode(node!.id)}
                            >
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: NODE_COLORS[node!.type] }}
                              />
                              <span>← {node!.label}</span>
                            </div>
                          ))}
                          {nodeConnections.outgoing.map((node) => (
                            <div 
                              key={node!.id} 
                              className="flex items-center gap-2 text-gray-400 hover:text-gray-200 cursor-pointer p-1 hover:bg-gray-800/50 rounded"
                              onClick={() => setSelectedNode(node!.id)}
                            >
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: NODE_COLORS[node!.type] }}
                              />
                              <span>→ {node!.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-400 bg-gray-800/50 rounded p-4 text-center">
                    Click a node to view details
                  </div>
                )}
              </div>
            )}

            {/* Search View */}
            {viewMode === 'search' && (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Filter by Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as NodeType | 'all')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="service">Service</option>
                    <option value="library">Library</option>
                    <option value="repository">Repository</option>
                    <option value="database">Database</option>
                    <option value="api">API</option>
                    <option value="server">Server</option>
                  </select>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  Found {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''}
                </div>

                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {filteredNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node.id);
                        setViewMode('details');
                      }}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        node.id === selectedNodeId
                          ? 'bg-blue-600/50 border border-blue-500'
                          : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: NODE_COLORS[node.type] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-200 truncate">{node.label}</div>
                          <div className="text-xs text-gray-500 font-mono truncate">{node.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats View */}
            {viewMode === 'stats' && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded p-4">
                  <h3 className="text-sm font-medium text-gray-200 mb-3">Graph Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Total Nodes:</span>
                      <span className="text-gray-200 font-mono font-bold">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Total Edges:</span>
                      <span className="text-gray-200 font-mono font-bold">{edges.length}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Avg Connections:</span>
                      <span className="text-gray-200 font-mono">{graphStats.avgConnections}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Max Connections:</span>
                      <span className="text-gray-200 font-mono">{graphStats.maxConnections}</span>
                    </div>
                    {graphStats.hubNode && (
                      <div className="pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Hub Node:</span>
                        <div 
                          className="mt-1 text-sm text-gray-200 hover:text-white cursor-pointer"
                          onClick={() => {
                            setSelectedNode(graphStats.hubNode!.id);
                            setViewMode('details');
                          }}
                        >
                          {graphStats.hubNode.label}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Node Type Distribution</h3>
                  <div className="space-y-2">
                    {Array.from(nodeTypeStats.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const percentage = (count / nodes.length) * 100;
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize text-gray-400">{type}</span>
                              <span className="text-gray-300 font-mono">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: NODE_COLORS[type]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Controls</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Drag to rotate camera</p>
                    <p>• Scroll to zoom in/out</p>
                    <p>• Right-click drag to pan</p>
                    <p>• Click node to select</p>
                    <p>• Hover to highlight</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}