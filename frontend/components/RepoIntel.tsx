'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  GitMerge,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { RepoIntelData } from '@/hooks/useRepoIntel';

interface RepoIntelProps {
  data: RepoIntelData;
  owner: string;
  repo: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────── //

function ghUrl(path: string, owner?: string, repo?: string) {
  if (!owner || !repo || !path.includes(owner)) {
    console.error("Invalid GitHub URL:", path, { owner, repo });
    return "#";
  }
  return `https://github.com/${path}`;
}

function healthColor(score: number) {
  if (score >= 75) return { text: 'text-emerald-400', stroke: '#10b981', glow: '#10b981', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' };
  if (score >= 50) return { text: 'text-amber-400',   stroke: '#f59e0b', glow: '#f59e0b', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' };
  return                  { text: 'text-rose-400',    stroke: '#f43f5e', glow: '#f43f5e', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400' };
}

function healthLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Needs Attention';
}

// ─── Reusable primitives ─────────────────────────────────────────────────── //

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.25)', y: -1 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, href }: { icon: any; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Icon className="w-3 h-3 text-indigo-400" />
        </div>
        <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">{title}</span>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          View on GitHub <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}

function InlineBar({ pct, color = '#6366f1', delay = 0 }: { pct: number; color?: string; delay?: number }) {
  return (
    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── Health Ring ─────────────────────────────────────────────────────────── //

function HealthRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const c = healthColor(score);

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={c.stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
          style={{ filter: `drop-shadow(0 0 5px ${c.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold tabular-nums ${c.text}`}>{score}</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

// ─── Commit Sparkline ────────────────────────────────────────────────────── //

function CommitSparkline({ data }: { data: Array<{ date: string; count: number }> }) {
  const slice = data.slice(-30);
  const max = Math.max(...slice.map(d => d.count), 1);
  const total = slice.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-end gap-px h-16 mb-2">
        {slice.map((item, i) => {
          const pct = item.count / max;
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-sm relative group cursor-default"
              style={{
                height: `${Math.max(pct * 100, item.count > 0 ? 6 : 2)}%`,
                backgroundColor: item.count > 0
                  ? `rgba(99,102,241,${0.2 + pct * 0.8})`
                  : 'rgba(255,255,255,0.04)',
                transformOrigin: 'bottom',
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.25, delay: i * 0.007 }}
            >
              {item.count > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                  {item.date.slice(5)}: <span className="text-indigo-400 font-medium">{item.count}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-slate-600">
        <span>{slice[0]?.date.slice(5)}</span>
        <span className="text-slate-500">{total} commits</span>
        <span>{slice[slice.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── Contributor Row ─────────────────────────────────────────────────────── //

function ContributorRow({
  contributor, rank, owner, max,
}: {
  contributor: { author: string; commits: number; avatar?: string };
  rank: number;
  owner: string;
  max: number;
}) {
  const rankColors = ['text-amber-400', 'text-slate-400', 'text-orange-700', 'text-slate-500', 'text-slate-600'];
  const pct = (contributor.commits / max) * 100;

  return (
    <motion.a
      href={`https://github.com/${contributor.author}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group"
    >
      <span className={`text-[10px] font-mono w-4 shrink-0 text-right ${rankColors[rank] ?? 'text-slate-600'}`}>
        #{rank + 1}
      </span>

      {/* Avatar or initials */}
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 overflow-hidden">
        {contributor.avatar ? (
          <img src={contributor.avatar} alt={contributor.author} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[9px] font-bold text-indigo-400 uppercase">
            {contributor.author.slice(0, 2)}
          </span>
        )}
      </div>

      <span className="text-xs text-slate-300 group-hover:text-indigo-400 transition-colors font-mono truncate flex-1">
        {contributor.author}
      </span>

      <InlineBar pct={pct} color="#6366f1" delay={rank * 0.05} />

      <span className="text-xs font-medium text-slate-400 tabular-nums shrink-0 w-8 text-right">
        {contributor.commits}
      </span>

      <ExternalLink className="w-2.5 h-2.5 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
    </motion.a>
  );
}

// ─── PR Donut ────────────────────────────────────────────────────────────── //

function PRDonut({ merged, closed, open }: { merged: number; closed: number; open: number }) {
  const total = merged + closed + open || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: merged, color: '#10b981', label: 'Merged', offset: 0 },
    { value: closed, color: '#f43f5e', label: 'Closed', offset: (merged / total) * circ },
    { value: open,   color: '#f59e0b', label: 'Open',   offset: ((merged + closed) / total) * circ },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
          {segments.map((seg, i) =>
            seg.value > 0 ? (
              <motion.circle
                key={i}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={circ}
                strokeDashoffset={circ - (seg.value / total) * circ}
                strokeLinecap="butt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, strokeDashoffset: circ - (seg.value / total) * circ }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                style={{
                  transform: `rotate(${(seg.offset / circ) * 360}deg)`,
                  transformOrigin: '50px 50px',
                }}
              />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-200">{total}</span>
          <span className="text-[8px] text-slate-500">PRs</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-slate-500 flex-1">{seg.label}</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: seg.color }}>{seg.value}</span>
            <span className="text-[10px] text-slate-600 w-8 text-right">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity Heatmap ────────────────────────────────────────────────────── //

function ActivityHeatmap({ data }: { data: Array<{ week: number; day: number; commits: number }> }) {
  const max = Math.max(...data.map(d => d.commits), 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weeks = 12;

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-4">
          {days.map((d, i) => (
            <div key={i} className="h-3 flex items-center">
              <span className="text-[8px] text-slate-600 w-3">{i % 2 === 0 ? d : ''}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1 flex-1">
          {Array.from({ length: weeks }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1 flex-1">
              <span className="text-[7px] text-slate-700 text-center mb-0.5">W{weekIdx + 1}</span>
              {days.map((_, dayIdx) => {
                const cell = data.find(d => d.week === weekIdx && d.day === dayIdx);
                const commits = cell?.commits ?? 0;
                const intensity = commits / max;
                return (
                  <motion.div
                    key={dayIdx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (weekIdx * 7 + dayIdx) * 0.003 }}
                    className="h-3 rounded-sm relative group cursor-default"
                    style={{
                      backgroundColor: commits === 0
                        ? 'rgba(255,255,255,0.04)'
                        : `rgba(99,102,241,${0.15 + intensity * 0.85})`,
                    }}
                  >
                    {commits > 0 && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                        {commits} commit{commits !== 1 ? 's' : ''}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-slate-600">Less</span>
        {[0.04, 0.25, 0.45, 0.65, 0.85].map((o, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(99,102,241,${o})` }} />
        ))}
        <span className="text-[9px] text-slate-600">More</span>
      </div>
    </div>
  );
}

// ─── Branch Bar ──────────────────────────────────────────────────────────── //

function BranchBar({ branch, commits, max, owner, repo, idx }: {
  branch: string; commits: number; max: number; owner: string; repo: string; idx: number;
}) {
  const branchColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#4f46e5'];
  const color = branchColors[idx % branchColors.length];

  return (
    <motion.a
    href={owner && repo ? ghUrl(`${owner}/${repo}/tree/${branch}`, owner, repo) : "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.06 }}
      whileHover={{ x: 2 }}
      className="flex items-center gap-3 group"
    >
      <GitBranch className="w-3 h-3 shrink-0" style={{ color }} />
      <span className="text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors w-24 truncate shrink-0">
        {branch}
      </span>
      <InlineBar pct={(commits / max) * 100} color={color} delay={idx * 0.06} />
      <span className="text-xs tabular-nums text-slate-500 shrink-0 w-6 text-right">{commits}</span>
      <ExternalLink className="w-2.5 h-2.5 text-slate-700 group-hover:text-slate-400 shrink-0 transition-colors" />
    </motion.a>
  );
}

// ─── Code Churn ──────────────────────────────────────────────────────────── //

function ChurnRow({ file, changes, max, idx }: { file: string; changes: number; max: number; idx: number }) {
  const pct = (changes / max) * 100;
  const color = pct > 70 ? '#f43f5e' : pct > 40 ? '#f59e0b' : '#6366f1';
  const short = file.split('/').pop() ?? file;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex items-center gap-3"
    >
      <span className="text-[10px] font-mono text-slate-500 w-28 truncate shrink-0" title={file}>
        {short}
      </span>
      <InlineBar pct={pct} color={color} delay={idx * 0.04} />
      <span className="text-xs tabular-nums shrink-0 w-8 text-right font-medium" style={{ color }}>
        {changes}
      </span>
    </motion.div>
  );
}

// ─── Issue Stats ─────────────────────────────────────────────────────────── //

function IssueRow({ icon: Icon, label, value, color, href }: {
  icon: any; label: string; value: string | number; color: string; href?: string;
}) {
  const inner = (
    <motion.div
      whileHover={href ? { x: 2 } : {}}
      className={`flex items-center justify-between p-3 rounded-lg border ${color} group`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold tabular-nums">{value}</span>
        {href && <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </motion.div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : inner;
}

// ─── Main Component ───────────────────────────────────────────────────────── //

export default function RepoIntel({ data, owner, repo }: RepoIntelProps) {
  const [showAllContributors, setShowAllContributors] = useState(false);
  const c = healthColor(data.healthMetrics.healthScore);
  const maxContribCommits = Math.max(...data.topContributors.map(c => c.commits), 1);
  const maxBranchCommits  = Math.max(...data.commitsByBranch.map(b => b.commits), 1);
  const maxChurn          = Math.max(...data.codeChurn.map(f => f.changes), 1);
  const visibleContribs   = showAllContributors ? data.topContributors : data.topContributors.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto overscroll-contain custom-scrollbar-intel">
      <div className="p-4 space-y-4">

        {/* ── Repo Header ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Repository</p>
            <a
              href={owner && repo ? ghUrl(`${owner}/${repo}`, owner, repo) : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-slate-100 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
            >
              {owner}/{repo}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${c.badge}`}>
            {healthLabel(data.healthMetrics.healthScore)}
          </span>
        </div>

        {/* ── Health Score + Key Stats ─────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center gap-5">
            <HealthRing score={data.healthMetrics.healthScore} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Bus Factor</p>
                <p className="text-lg font-bold text-indigo-400 tabular-nums">{data.healthMetrics.busFactor}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Active Days</p>
                <p className="text-lg font-bold text-purple-400 tabular-nums">{data.healthMetrics.activeDays}</p>
                <p className="text-[9px] text-slate-600">last 90d</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Momentum</p>
                <p className={`text-lg font-bold tabular-nums ${data.healthMetrics.momentum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.healthMetrics.momentum >= 0 ? '+' : ''}{data.healthMetrics.momentum}%
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Contributor Risk</p>
                <p className={`text-lg font-bold tabular-nums ${data.healthMetrics.contributorRisk > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {data.healthMetrics.contributorRisk}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Commit Activity ──────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={GitCommit}
            title="Commit Activity"
            href={owner && repo ? ghUrl(`${owner}/${repo}/commits`, owner, repo) : "#"}
          />
          <CommitSparkline data={data.commitTimeline} />
        </Card>

        {/* ── Top Contributors ─────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={Award}
            title="Contributors"
            href={owner && repo ? ghUrl(`${owner}/${repo}/graphs/contributors`, owner, repo) : "#"}
          />
          <div className="space-y-0.5">
            <AnimatePresence>
              {visibleContribs.map((contrib, i) => (
                <ContributorRow
                  key={contrib.author}
                  contributor={contrib}
                  rank={i}
                  owner={owner}
                  max={maxContribCommits}
                />
              ))}
            </AnimatePresence>
          </div>
          {data.topContributors.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllContributors(!showAllContributors)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors py-1"
            >
              {showAllContributors ? (
                <><ChevronUp className="w-3 h-3" /> Show less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show {data.topContributors.length - 5} more</>
              )}
            </button>
          )}
        </Card>

        {/* ── Pull Requests ────────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={GitPullRequest}
            title="Pull Requests"
            href={owner && repo ? ghUrl(`${owner}/${repo}/pulls`, owner, repo) : "#"}
          />
          <PRDonut
            merged={data.prStats.merged}
            closed={data.prStats.closed}
            open={data.prStats.open}
          />
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Success Rate</p>
              <p className="text-base font-bold text-emerald-400 tabular-nums">
                {data.prStats.successRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Avg Merge Time</p>
              <p className="text-base font-bold text-indigo-400 tabular-nums">
                {(data.healthMetrics.avgPrMergeTime / 24).toFixed(1)}d
              </p>
            </div>
          </div>
        </Card>

        {/* ── Issues ───────────────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={Target}
            title="Issues"
            href={owner && repo ? ghUrl(`${owner}/${repo}/issues`, owner, repo) : "#"}
          />
          <div className="space-y-2">
            <IssueRow
              icon={CheckCircle2}
              label="Closed"
              value={data.issueStats.closed}
              color="bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
              href={owner && repo ? ghUrl(`${owner}/${repo}/issues?state=closed`, owner, repo) : "#"}
            />
            <IssueRow
              icon={XCircle}
              label="Open"
              value={data.issueStats.open}
              color="bg-amber-500/5 border-amber-500/20 text-amber-400"
              href={owner && repo ? ghUrl(`${owner}/${repo}/issues?state=open`, owner, repo) : "#"}
            />
            <IssueRow
              icon={Clock}
              label="Avg Response Time"
              value={`${(data.issueStats.avgResponseTime / 24).toFixed(1)}d`}
              color="bg-indigo-500/5 border-indigo-500/20 text-indigo-400"
            />
          </div>
        </Card>

        {/* ── Branches ─────────────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={GitBranch}
            title="Branch Activity"
            href={owner && repo ? ghUrl(`${owner}/${repo}/branches`, owner, repo) : "#"}
          />
          <div className="space-y-2.5">
            {data.commitsByBranch.map((b, i) => (
              <BranchBar
                key={b.branch}
                branch={b.branch}
                commits={b.commits}
                max={maxBranchCommits}
                owner={owner}
                repo={repo}
                idx={i}
              />
            ))}
          </div>
        </Card>

        {/* ── Code Churn ───────────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle icon={Flame} title="Code Churn" />
          <div className="space-y-2.5">
            {data.codeChurn.slice(0, 8).map((f, i) => (
              <ChurnRow
                key={f.file}
                file={f.file}
                changes={f.changes}
                max={maxChurn}
                idx={i}
              />
            ))}
          </div>
        </Card>

        {/* ── Activity Heatmap ─────────────────────────────────────── */}
        <Card className="p-4">
          <SectionTitle
            icon={Activity}
            title="Activity Heatmap"
            href={owner && repo ? ghUrl(`${owner}/${repo}/graphs/commit-activity`, owner, repo) : "#"}
          />
          <ActivityHeatmap data={data.activityHeatmap} />
        </Card>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="pt-2 pb-4 flex items-center justify-between">
          <p className="text-[9px] text-slate-700">Based on repository history</p>
          <a
            href={owner && repo ? ghUrl(`${owner}/${repo}`, owner, repo) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-slate-600 hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            Open on GitHub <ExternalLink className="w-2 h-2" />
          </a>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar-intel::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-intel::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-intel::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
        .custom-scrollbar-intel::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
      `}</style>
    </div>
  );
}