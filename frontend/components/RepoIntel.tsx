'use client';

import { useMemo } from 'react';
import type { RepoIntelData, CommitPoint, ContributorStat, ChurnFile, ModuleOwnership } from '@/hooks/useRepoIntel';

// ── Colour helpers ─────────────────────────────────────────────────── //

function healthColor(label: string) {
  if (label === 'Healthy')  return { text: '#34d399', bg: '#064e3b33', border: '#34d39940' };
  if (label === 'Fair')     return { text: '#fbbf24', bg: '#78350f33', border: '#fbbf2440' };
  return                           { text: '#f87171', bg: '#7f1d1d33', border: '#f8717140' };
}

function riskColor(pct: number) {
  if (pct >= 70) return '#f87171';
  if (pct >= 40) return '#fbbf24';
  return '#34d399';
}

function momentumColor(m: number) {
  if (m > 0)  return '#34d399';
  if (m < -20) return '#f87171';
  return '#fbbf24';
}

// ── Tiny components ───────────────────────────────────────────────── //

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-xl font-semibold text-white font-mono">{value}</span>
      {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Commit timeline (pure SVG sparkline) ──────────────────────────── //

function Timeline({ data }: { data: CommitPoint[] }) {
  const pts = useMemo(() => {
    if (!data.length) return { points: '', max: 0, labels: [] };
    const W = 560, H = 80;
    const max = Math.max(...data.map(d => d.count), 1);
    // sample to last 30 days
    const slice = data.slice(-30);
    const n = slice.length;
    const points = slice.map((d, i) => {
      const x = (i / Math.max(n - 1, 1)) * W;
      const y = H - (d.count / max) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Pick 5 evenly-spaced labels
    const labels = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .map(i => ({ x: (i / Math.max(n - 1, 1)) * W, label: slice[i]?.date?.slice(5) ?? '' }));

    return { points, max, labels };
  }, [data]);

  if (!pts.points) {
    return <div className="h-24 flex items-center justify-center text-xs text-slate-600">No data</div>;
  }

  return (
    <div className="w-full overflow-hidden">
      <svg width="100%" viewBox="0 0 560 100" preserveAspectRatio="none" className="overflow-visible">
        {/* Area fill */}
        <defs>
          <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,80 ${pts.points} 560,80`}
          fill="url(#tl-grad)"
          stroke="none"
        />
        <polyline
          points={pts.points}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* X-axis labels */}
        {pts.labels.map(({ x, label }) => (
          <text key={label} x={x} y="98" textAnchor="middle"
            fontSize="9" fill="#475569">{label}</text>
        ))}
      </svg>
    </div>
  );
}

// ── Contributors bar chart ─────────────────────────────────────────── //

function ContributorBars({ data }: { data: ContributorStat[] }) {
  const max = Math.max(...data.map(d => d.commits), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((c, i) => (
        <div key={c.login} className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-4 shrink-0 text-right">#{i + 1}</span>
          <span className="text-xs font-mono text-slate-300 w-24 shrink-0 truncate">{c.login}</span>
          <MiniBar pct={(c.commits / max) * 100} color="#34d399" />
          <span className="text-[10px] font-mono text-slate-400 w-8 text-right shrink-0">{c.commits}</span>
          <span className="text-[10px] text-slate-600 w-10 text-right shrink-0">{c.pct}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Churn files ───────────────────────────────────────────────────── //

function ChurnList({ data }: { data: ChurnFile[] }) {
  const max = Math.max(...data.map(d => d.changes), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((f) => {
        const pct = (f.changes / max) * 100;
        const color = pct > 70 ? '#f87171' : pct > 40 ? '#fbbf24' : '#60a5fa';
        const name = f.path.split('/').pop() ?? f.path;
        const dir  = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '';
        return (
          <div key={f.path} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1">
                {dir && <span className="text-[10px] text-slate-600 truncate">{dir}/</span>}
                <span className="text-xs font-mono text-slate-300 truncate">{name}</span>
              </div>
              <MiniBar pct={pct} color={color} />
            </div>
            <span className="text-[10px] font-mono text-slate-500 shrink-0 w-14 text-right">
              {f.changes.toLocaleString()} chg
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Module ownership ──────────────────────────────────────────────── //

function ModuleOwnershipList({ data }: { data: ModuleOwnership[] }) {
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((m) => (
        <div key={m.module} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: m.ownerPct > 80 ? '#f87171' : m.ownerPct > 60 ? '#fbbf24' : '#34d399' }}
          />
          <span className="text-xs font-mono text-slate-300 w-24 shrink-0 truncate">{m.module}</span>
          <MiniBar pct={m.ownerPct} color={riskColor(m.ownerPct)} />
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-slate-400">{m.owner}</div>
            <div className="text-[10px] text-slate-600">{m.ownerPct}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────── //

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-800">
        <span className="text-xs font-medium text-slate-300">{title}</span>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────── //

interface Props {
  data:        RepoIntelData;
  owner:       string;
  repo:        string;
}

export default function RepoIntel({ data, owner, repo }: Props) {
  const hc = healthColor(data.healthLabel);

  return (
    <aside className="flex h-full flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Repository Intelligence</p>
          <h2 className="mt-0.5 text-sm font-semibold font-mono text-white truncate">
            {owner}/{repo}
          </h2>
        </div>
        {/* Health badge */}
        <div
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold border"
          style={{ color: hc.text, backgroundColor: hc.bg, borderColor: hc.border }}
        >
          {data.healthLabel}
        </div>
      </div>

      <div className="flex-1 px-3 py-3 space-y-3">

        {/* ── Health score ─────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 flex items-center justify-between"
          style={{ borderColor: hc.border, backgroundColor: hc.bg }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: hc.text }}>Health Score</p>
            <p className="text-3xl font-semibold font-mono mt-0.5" style={{ color: hc.text }}>
              {data.healthScore}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Overall repo quality</p>
          </div>
          {/* Circular arc indicator */}
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={hc.text}
              strokeWidth="6"
              strokeDasharray={`${(data.healthScore / 100) * 163.4} 163.4`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
            <text x="32" y="36" textAnchor="middle" fontSize="11" fontWeight="600" fill={hc.text}>
              {Math.round(data.healthScore)}
            </text>
          </svg>
        </div>

        {/* ── Stats grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Commits"     value={data.totalCommits} />
          <StatCard label="Active days" value={data.activeDays}   />
          <StatCard label="Bus factor"  value={data.busFactor} sub="contributors for 50%" />
          <StatCard label="PRs"         value={data.totalPRs}     />
          <StatCard label="Issues"      value={data.totalIssues} sub={`${data.openIssues} open`} />
          <StatCard label="Last commit" value={`${data.activityDaysAgo}d`} sub="days ago" />
        </div>

        {/* ── Signal cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Contributor risk */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Contributor risk</p>
            <p className="text-lg font-semibold font-mono" style={{ color: riskColor(data.contributorRiskPct) }}>
              {data.contributorRiskPct}%
            </p>
            <p className="text-[10px] text-slate-600">
              {data.contributors[0]?.login ?? '—'} leads
            </p>
          </div>

          {/* Momentum */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Momentum</p>
            <p className="text-lg font-semibold font-mono" style={{ color: momentumColor(data.momentumPct) }}>
              {data.momentumPct > 0 ? '+' : ''}{data.momentumPct}%
            </p>
            <p className="text-[10px] text-slate-600">7d vs prev 7d</p>
          </div>

          {/* Activity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Activity</p>
            <p className="text-lg font-semibold font-mono text-white">{data.activityDaysAgo}d ago</p>
            <p className="text-[10px] text-slate-600">Last commit</p>
          </div>

          {/* Issue handling */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Issue handling</p>
            <p className="text-lg font-semibold font-mono" style={{ color: riskColor(100 - data.issueHandlingPct) }}>
              {data.issueHandlingPct}%
            </p>
            <p className="text-[10px] text-slate-600">Issues closed</p>
          </div>
        </div>

        {/* ── Commit timeline ──────────────────────────────────── */}
        <Section title="📈 Commit timeline">
          <Timeline data={data.timeline} />
        </Section>

        {/* ── Top contributors ─────────────────────────────────── */}
        <Section title="👥 Top contributors">
          <ContributorBars data={data.contributors} />
        </Section>

        {/* ── Code churn ───────────────────────────────────────── */}
        {data.churnFiles.length > 0 && (
          <Section title="🔥 Code churn — hottest files">
            <ChurnList data={data.churnFiles} />
          </Section>
        )}

        {/* ── Module ownership ─────────────────────────────────── */}
        {data.moduleOwnership.length > 0 && (
          <Section title="🗂 Module ownership risk">
            <ModuleOwnershipList data={data.moduleOwnership} />
          </Section>
        )}

      </div>
    </aside>
  );
}