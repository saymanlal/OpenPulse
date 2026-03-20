'use client';

import { useState } from 'react';
import { useLoadGraphFromApi, useSaveGraphToApi, useApiConnection } from '@/hooks/useApiGraph';
import { getOrCreateDemoDataset, persistDemoDataset } from '@/lib/sampleData';
import { useGraphStore } from '@/stores/graphStore';

export default function Header() {
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [repoInput, setRepoInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const { loadGraph, loading: loadLoading } = useLoadGraphFromApi();
  const { saveGraph, loading: saveLoading } = useSaveGraphToApi();
  const { connected, checking } = useApiConnection();
  const setGraphData = useGraphStore((state) => state.setGraphData);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAnalyzeRepo = async () => {
    // Parse owner/repo from input
    const match = repoInput.trim().match(/(?:https?:\/\/github\.com\/)?([^\/]+)\/([^\/\s]+)/);
    
    if (!match) {
      showMessage('Invalid format. Use: owner/repo or GitHub URL', 'error');
      return;
    }

    const [, owner, repo] = match;
    
    setAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:8001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Analysis failed');
      }

      const data = await response.json();
      
      setGraphData({
        nodes: data.nodes,
        edges: data.edges,
      });

      showMessage(`Analyzed ${owner}/${repo}: ${data.nodes.length} dependencies`);
      setRepoInput('');
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Failed to analyze repository',
        'error'
      );
    } finally {
      setAnalyzing(false);
    }
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

  const handleLoadDemo200 = () => {
    const demo = getOrCreateDemoDataset();
    persistDemoDataset(demo);
    setGraphData(demo);
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
            v0.3.0 - Phase 16
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

        <nav className="flex items-center gap-3">
          {/* GitHub Analyzer Input */}
          <div className="flex items-center gap-2 border border-gray-700 rounded px-3 py-1.5">
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeRepo()}
              placeholder="owner/repo or GitHub URL"
              className="bg-transparent text-sm text-gray-300 outline-none w-64"
              disabled={analyzing || !connected}
            />
            <button
              onClick={handleAnalyzeRepo}
              disabled={analyzing || !connected || !repoInput.trim()}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          <div className="w-px h-6 bg-gray-700" />

          <button
            onClick={handleLoadFromApi}
            disabled={loadLoading || !connected}
            className="text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadLoading ? 'Loading...' : 'Load'}
          </button>

          <button
            onClick={handleSaveToApi}
            disabled={saveLoading || !connected}
            className="text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveLoading ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleLoadDemo200}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Demo
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