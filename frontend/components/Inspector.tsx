'use client';

import { useState, useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { NODE_COLORS } from '@/lib/constants';

export default function Inspector() {
  const [isOpen, setIsOpen] = useState(true);
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
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Inspector</h2>
          
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
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Connections</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Incoming:</span>
                      <span className="ml-2 text-gray-200 font-mono">{nodeConnections.incoming.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Outgoing:</span>
                      <span className="ml-2 text-gray-200 font-mono">{nodeConnections.outgoing.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total:</span>
                      <span className="ml-2 text-gray-200 font-mono">
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

            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Graph Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Nodes:</span>
                  <span className="text-gray-200 font-mono">{nodes.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Edges:</span>
                  <span className="text-gray-200 font-mono">{edges.length}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Node Types</h3>
              <div className="space-y-1 text-xs">
                {['service', 'library', 'repository', 'database', 'api', 'server'].map((type) => {
                  const count = nodes.filter((n) => n.type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex justify-between text-gray-400">
                      <span className="capitalize">{type}:</span>
                      <span className="text-gray-200 font-mono">{count}</span>
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
        </div>
      )}
    </div>
  );
}