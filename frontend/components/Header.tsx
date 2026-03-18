'use client';

import { useState } from 'react';
import { useLoadGraphFromApi, useSaveGraphToApi, useApiConnection } from '@/hooks/useApiGraph';
import { generateSampleGraph, getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';

export default function Header() {
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const { loadGraph, loading: loadLoading } = useLoadGraphFromApi();
  const { saveGraph, loading: saveLoading } = useSaveGraphToApi();
  const { connected, checking } = useApiConnection();
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLoadFromApi = async () => {
    try {
      const data = await loadGraph();
      showMessage(`Loaded ${data.nodes.length} nodes and ${data.edges.length} edges`);
    } catch {
      showMessage('Failed to load from API. Using demo data.', 'error');
      handleLoadDemo200();
    }
  };

  const handleSaveToApi = async () => {
    try {
      const data = await saveGraph();
      showMessage(`Saved ${data.nodes.length} nodes and ${data.edges.length} edges`);
    } catch {
      showMessage('Failed to save to API', 'error');
    }
  };

  const handleLoadDemo = () => {
    const demo = generateSampleGraph(20);
    setNodes(demo.nodes);
    setEdges(demo.edges);
    showMessage('Demo data loaded (20 nodes)');
  };

  const handleLoadDemo200 = () => {
    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setNodes(demo.nodes);
    setEdges(demo.edges);
    showMessage('Phase 15 dataset loaded (200 nodes / 400 edges)');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            OpenPulse
          </h1>
          <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">
            v0.2.0
          </span>

          {!checking && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {connected ? 'API Connected' : 'API Offline'}
              </span>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={handleLoadFromApi}
            disabled={loadLoading || !connected}
            className="text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadLoading ? 'Loading...' : 'Load from API'}
          </button>

          <button
            onClick={handleSaveToApi}
            disabled={saveLoading || !connected}
            className="text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveLoading ? 'Saving...' : 'Save to API'}
          </button>

          <button
            onClick={handleLoadDemo200}
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors"
          >
            Demo 200/400
          </button>

          <button
            onClick={handleLoadDemo}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Quick Demo
          </button>
        </nav>
      </div>

      {message && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
          <div
            className={`px-4 py-2 rounded shadow-lg text-sm ${
              messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {message}
          </div>
        </div>
      )}
    </header>
  );
}
