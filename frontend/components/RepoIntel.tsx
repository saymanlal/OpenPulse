'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Activity,
  Calendar,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Flame,
  BarChart3,
  GitBranch,
} from 'lucide-react';
import type { RepoIntelData } from '@/hooks/useRepoIntel';

interface RepoIntelProps {
  data: RepoIntelData;
  owner: string;
  repo: string;
}

// Metric Card Component
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'indigo' 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  trend?: string; 
  color?: string 
}) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/20 border-rose-500/30 text-rose-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden rounded-lg border bg-gradient-to-br p-3 ${colors[color as keyof typeof colors] || colors.indigo}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-slate-400">{trend}</p>
          )}
        </div>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
    </motion.div>
  );
}

// Chart Container
function ChartContainer({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// Simple Bar Chart
function SimpleBarChart({ data, maxValue }: { data: Array<{ label: string; value: number; color?: string }>; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-32 truncate">{item.label}</span>
          <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="h-full rounded-full flex items-center justify-end px-2"
              style={{ backgroundColor: item.color || '#6366f1' }}
            >
              <span className="text-xs font-medium text-white">{item.value}</span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline Chart
function TimelineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map(d => d.count));
  
  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-30).map((item, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(item.count / max) * 100}%` }}
          transition={{ duration: 0.3, delay: i * 0.01 }}
          className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t min-w-[2px] relative group"
        >
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-slate-700 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {item.date}: {item.count}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Activity Heatmap
function ActivityHeatmap({ data }: { data: Array<{ week: number; day: number; commits: number }> }) {
  const max = Math.max(...data.map(d => d.commits), 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 12;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <div className="w-8" />
        {Array.from({ length: weeks }).map((_, i) => (
          <div key={i} className="flex-1 text-[8px] text-slate-500 text-center">
            W{i + 1}
          </div>
        ))}
      </div>
      
      {days.map((day, dayIdx) => (
        <div key={dayIdx} className="flex gap-1 items-center">
          <div className="w-8 text-[9px] text-slate-500">{day}</div>
          {Array.from({ length: weeks }).map((_, weekIdx) => {
            const cell = data.find(d => d.week === weekIdx && d.day === dayIdx);
            const commits = cell?.commits || 0;
            const intensity = commits / max;
            
            return (
              <motion.div
                key={weekIdx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (weekIdx * 7 + dayIdx) * 0.005 }}
                className="flex-1 aspect-square rounded-sm relative group"
                style={{
                  backgroundColor: commits === 0 
                    ? '#1e293b' 
                    : `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`
                }}
              >
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black border border-slate-700 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {commits} commits
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Donut Chart for PRs
function DonutChart({ 
  merged, 
  closed, 
  open 
}: { 
  merged: number; 
  closed: number; 
  open: number 
}) {
  const total = merged + closed + open;
  const mergedPct = (merged / total) * 100;
  const closedPct = (closed / total) * 100;
  const openPct = (open / total) * 100;

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Merged */}
          <motion.circle
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (283 * mergedPct / 100) }}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#10b981"
            strokeWidth="10"
            strokeDasharray="283"
            strokeLinecap="round"
          />
          {/* Closed */}
          <motion.circle
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (283 * closedPct / 100) }}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#ef4444"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * mergedPct / 100)}
            strokeLinecap="round"
          />
          {/* Open */}
          <motion.circle
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (283 * openPct / 100) }}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * (mergedPct + closedPct) / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-[9px] text-slate-500">Total PRs</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400">Merged</span>
          <span className="text-xs font-medium ml-auto">{merged}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-xs text-slate-400">Closed</span>
          <span className="text-xs font-medium ml-auto">{closed}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-400">Open</span>
          <span className="text-xs font-medium ml-auto">{open}</span>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function RepoIntel({ data, owner, repo }: RepoIntelProps) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Repository Intelligence
          </h2>
          <p className="text-xs text-slate-500">
            {owner}/{repo}
          </p>
        </div>

        {/* Health Score - Hero Metric */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          />
          <div className="relative">
            <p className="text-sm text-indigo-300 font-medium mb-2">Repository Health Score</p>
            <p className="text-5xl font-bold text-white mb-1">{data.healthMetrics.healthScore}</p>
            <p className="text-xs text-slate-400">out of 100</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-300">
                {data.healthMetrics.healthScore >= 80 ? 'Excellent' : 
                 data.healthMetrics.healthScore >= 60 ? 'Good' :
                 data.healthMetrics.healthScore >= 40 ? 'Fair' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={Users}
            label="Bus Factor"
            value={data.healthMetrics.busFactor}
            color="indigo"
          />
          <MetricCard
            icon={TrendingUp}
            label="Momentum"
            value={`${data.healthMetrics.momentum > 0 ? '+' : ''}${data.healthMetrics.momentum}%`}
            trend="7-day trend"
            color={data.healthMetrics.momentum > 0 ? 'emerald' : 'rose'}
          />
          <MetricCard
            icon={Calendar}
            label="Active Days"
            value={data.healthMetrics.activeDays}
            trend="last 90 days"
            color="purple"
          />
          <MetricCard
            icon={AlertCircle}
            label="Contributor Risk"
            value={`${data.healthMetrics.contributorRisk}%`}
            color={data.healthMetrics.contributorRisk > 50 ? 'amber' : 'emerald'}
          />
        </div>

        {/* Commit Timeline */}
        <ChartContainer title="Commit Activity (Last 30 Days)" icon={GitCommit}>
          <TimelineChart data={data.commitTimeline} />
          <p className="text-xs text-slate-500 mt-2">
            Total: {data.commitTimeline.reduce((sum, d) => sum + d.count, 0)} commits
          </p>
        </ChartContainer>

        {/* Top Contributors */}
        <ChartContainer title="Top Contributors" icon={Award}>
          <SimpleBarChart
            data={data.topContributors.slice(0, 5).map(c => ({
              label: c.author,
              value: c.commits,
              color: '#6366f1',
            }))}
          />
        </ChartContainer>

        {/* Branch Activity */}
        <ChartContainer title="Commits by Branch" icon={GitBranch}>
          <SimpleBarChart
            data={data.commitsByBranch.map((b, i) => ({
              label: b.branch,
              value: b.commits,
              color: ['#6366f1', '#8b5cf6', '#a78bfa'][i % 3],
            }))}
          />
        </ChartContainer>

        {/* PR Statistics */}
        <ChartContainer title="Pull Request Overview" icon={GitPullRequest}>
          <DonutChart
            merged={data.prStats.merged}
            closed={data.prStats.closed}
            open={data.prStats.open}
          />
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Success Rate</span>
              <span className="text-sm font-bold text-emerald-400">
                {data.prStats.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">Avg Merge Time</span>
              <span className="text-sm font-medium text-slate-300">
                {(data.healthMetrics.avgPrMergeTime / 24).toFixed(1)} days
              </span>
            </div>
          </div>
        </ChartContainer>

        {/* Issue Handling */}
        <ChartContainer title="Issue Management" icon={Target}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Closed</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{data.issueStats.closed}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">Open</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{data.issueStats.open}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">Avg Response Time</span>
              </div>
              <span className="text-lg font-bold text-indigo-400">
                {(data.issueStats.avgResponseTime / 24).toFixed(1)}d
              </span>
            </div>
          </div>
        </ChartContainer>

        {/* Code Churn Heatmap */}
        <ChartContainer title="Code Churn (Most Changed Files)" icon={Flame}>
          <SimpleBarChart
            data={data.codeChurn.slice(0, 8).map(f => ({
              label: f.file.split('/').pop() || f.file,
              value: f.changes,
              color: '#f59e0b',
            }))}
          />
        </ChartContainer>

        {/* Activity Heatmap */}
        <ChartContainer title="Activity Heatmap (12 Weeks)" icon={Activity}>
          <ActivityHeatmap data={data.activityHeatmap} />
        </ChartContainer>

        {/* Footer */}
        <div className="pt-4 pb-2 text-center">
          <p className="text-[10px] text-slate-600">
            Data refreshes on every analysis • Based on repository history
          </p>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
