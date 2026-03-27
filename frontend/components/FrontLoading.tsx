'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Cpu, GitBranch, Zap, Shield, Layers } from 'lucide-react';

interface FrontLoadingProps {
  onComplete?: () => void;
}

export default function FrontLoading({ onComplete }: FrontLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const stages = [
    { message: "Initializing 3D engine", icon: Cpu },
    { message: "Calibrating dependency radar", icon: GitBranch },
    { message: "Spawning node clusters", icon: Layers },
    { message: "Optimizing instanced meshes", icon: Zap },
    { message: "Ready. Pulse active.", icon: Shield },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => onComplete?.(), 400);
          return 100;
        }
        
        const newStage = Math.floor((prev + 2) / 20);
        if (newStage < stages.length && newStage !== loadingStage) {
          setLoadingStage(newStage);
        }
        
        return Math.min(prev + Math.random() * 3 + 1, 100);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [loadingStage, onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
        >
          {/* Animated background with white/grey accents */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-zinc-900" />
            
            {/* White/grey grid pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px',
              }}
            />
            
            {/* White/grey pulse rings with glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[500px] w-[500px] rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute h-[400px] w-[400px] rounded-full border border-white/20" />
              <div className="absolute h-[300px] w-[300px] rounded-full border border-white/30" />
              <div className="absolute h-[200px] w-[200px] rounded-full border border-white/40" />
            </div>
            
            {/* Animated white/grey glowing orbs */}
            <motion.div
              animate={{
                x: [0, 120, -80, 0],
                y: [0, -100, 60, 0],
                scale: [1, 1.3, 0.8, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"
              style={{ filter: 'blur(80px)' }}
            />
            <motion.div
              animate={{
                x: [0, -140, 100, 0],
                y: [0, 80, -120, 0],
                scale: [1, 0.7, 1.4, 1],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
              className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-zinc-500/20 blur-3xl"
              style={{ filter: 'blur(80px)' }}
            />
            <motion.div
              animate={{
                x: [0, 80, -60, 0],
                y: [0, -60, 40, 0],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 1 }}
              className="absolute top-1/2 left-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl"
              style={{ filter: 'blur(80px)' }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
            {/* Logo with White Glow Effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative mb-8"
            >
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-white/30 blur-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl border border-white/20">
                <Hexagon className="h-14 w-14 text-white/90" strokeWidth={1.5} />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/10 to-transparent" />
              </div>
            </motion.div>

            {/* Title with subtle white glow */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl font-black tracking-tight text-white md:text-7xl"
            >
              OPEN<span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">PULSE</span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-3 max-w-md text-sm font-medium tracking-wide text-zinc-400 md:text-base"
            >
              DEPENDENCY GRAPH · 3D EXPLORER
            </motion.p>

            {/* Loading Stage Indicator with White Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex flex-col items-center gap-6"
            >
              <div className="flex items-center gap-3 rounded-full bg-white/5 px-5 py-2 backdrop-blur-sm border border-white/20">
                {stages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isActive = idx === loadingStage;
                  const isPast = idx < loadingStage;
                  return (
                    <motion.div
                      key={idx}
                      animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: isActive ? Infinity : 0, duration: 1.2 }}
                      className="relative"
                    >
                      <Icon
                        size={18}
                        className={`transition-all duration-300 ${
                          isActive
                            ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                            : isPast
                            ? 'text-white/60'
                            : 'text-white/20'
                        }`}
                      />
                      {isActive && (
                        <motion.span 
                          className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-lg shadow-white"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress Bar with White Glow */}
              <div className="w-72 space-y-3">
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-white/40 via-white to-white/60"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                    style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}
                  />
                </div>
                <motion.p
                  key={loadingStage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-mono tracking-wider text-zinc-500"
                >
                  {stages[loadingStage]?.message || "Synchronizing graph engine..."}
                </motion.p>
              </div>
            </motion.div>

            {/* Decorative Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-9 left-0 right-0 flex justify-center gap-6 text-[11px] font-mono text-white"
            >
              <span className="flex items-center gap-1"><Zap size={10} /> INSTANCED MESH</span>
              <span className="flex items-center gap-1"><Layers size={10} /> 120 NODES CAP</span>
              <span className="flex items-center gap-1"><Shield size={10} /> RISK SCORING</span>
            </motion.div>

            {/* Progress Numeric */}
            <div className="absolute bottom-2 right-6 text-right text-[10px] font-mono text-zinc-700">
              {Math.floor(progress)}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}