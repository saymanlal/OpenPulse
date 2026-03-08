'use client';

import { useState } from 'react';

export default function Inspector() {
  const [isOpen, setIsOpen] = useState(true);

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
            <div className="text-sm text-gray-400 bg-gray-800/50 rounded p-4 text-center">
              Select a node to view details
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Graph Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Nodes:</span>
                  <span className="text-gray-200">0</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Edges:</span>
                  <span className="text-gray-200">0</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Controls</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Click and drag to rotate</p>
                <p>• Scroll to zoom</p>
                <p>• Click node to select</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}