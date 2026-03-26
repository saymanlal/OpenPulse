'use client';

import { useEffect, useState } from 'react';
import { useGraphStore } from '@/stores/graphStore';

export default function NodeTooltip() {
  const nodes = useGraphStore((s) => s.nodes);
  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const hoveredNode = nodes.find((n) => n.id === hoveredNodeId);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    setVisible(!!hoveredNode);
  }, [hoveredNode]);

  if (!visible || !hoveredNode) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
      }}
    >
      <div className="font-semibold text-white">{hoveredNode.label}</div>
      <div className="mt-1 text-xs text-slate-400 capitalize">{hoveredNode.type}</div>
    </div>
  );
}
