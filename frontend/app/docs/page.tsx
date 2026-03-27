import Link from 'next/link';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-7 rounded-full bg-indigo-500 inline-block" />
        {title}
      </h2>
      <div className="text-slate-300 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Table({ rows, heads }: { heads: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-black">
            {heads.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-900 hover:bg-black transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-300 font-mono text-xs">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  );
}

function Callout({ color, children }: { color: 'blue' | 'yellow' | 'red' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue:   'border-blue-700 bg-blue-950/40 text-blue-300',
    yellow: 'border-yellow-700 bg-yellow-950/40 text-yellow-300',
    red:    'border-red-700 bg-red-950/40 text-red-300',
    green:  'border-green-700 bg-green-950/40 text-green-300',
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${styles[color]}`}>{children}</div>
  );
}

export default function DocsPage() {
  const toc = [
    { id: 'what',      label: 'What is OpenPulse?' },
    { id: 'quickstart',label: 'Quick start'         },
    { id: 'graph',     label: 'The 3-D graph'       },
    { id: 'colors',    label: 'Node colours'         },
    { id: 'edges',     label: 'Edge colours'         },
    { id: 'risk',      label: 'Risk scoring'         },
    { id: 'inspector', label: 'Inspector panel'      },
    { id: 'controls',  label: 'Camera controls'      },
    { id: 'multi',     label: 'Multiple package.json'},
    { id: 'demo',      label: 'Demo mode'            },
    { id: 'faq',       label: 'FAQ'                  },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* top bar */}
      <header className="sticky top-0 z-50 bg-black backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← Back to app</Link>
          <span className="text-slate-700">|</span>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            OpenPulse Docs
          </span>
        </div>
        <span className="text-xs text-slate-600 border border-slate-800 px-2 py-1 rounded">v0.3.0</span>
      </header>

      <div className="max-w-6xl mx-auto flex gap-8 px-6 py-10">

        {/* sidebar TOC */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">On this page</p>
            <nav className="space-y-1">
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`}
                  className="block text-sm text-slate-500 hover:text-slate-200 transition-colors py-0.5">
                  {t.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* main content */}
        <main className="flex-1 min-w-0">

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">OpenPulse Documentation</h1>
            <p className="text-slate-400 text-lg">
              Everything you need to understand, use, and get the most out of OpenPulse.
            </p>
          </div>

          <Section id="what" title="What is OpenPulse?">
            <p>
              OpenPulse is an interactive 3-D dependency graph visualiser for GitHub repositories.
              It fetches every <Code>package.json</Code> in a repo, builds a graph of all packages
              and their relationships, scores each dependency for risk, and renders it in a
              navigable 3-D scene right in your browser.
            </p>
            <p>
              It is designed for developers who want to quickly understand the health, complexity,
              and potential security risks of a project's dependency tree — without reading hundreds
              of lines of JSON.
            </p>
            <Callout color="blue">
              OpenPulse runs entirely locally. No data leaves your machine except the GitHub API
              request to fetch the repository contents.
            </Callout>
          </Section>

          <Section id="quickstart" title="Quick start">
            <ol className="list-decimal list-inside space-y-3 text-slate-300">
              <li>Make sure the backend is running: <Code>cd backend && uvicorn main:app --port 8001 --reload</Code></li>
              <li>Make sure the frontend is running: <Code>cd frontend && npm run dev</Code></li>
              <li>Open <Code>http://localhost:3000</Code> in your browser.</li>
              <li>
                In the top bar, paste a GitHub URL or <Code>owner/repo</Code> — for example{' '}
                <Code>vercel/next.js</Code> or <Code>https://github.com/facebook/react</Code>
              </li>
              <li>Click <strong>Analyze</strong>. The graph loads in a few seconds.</li>
              <li>Click any sphere to inspect that package in the right panel.</li>
            </ol>
            <Callout color="yellow">
              If the API is offline the app automatically falls back to a 120-node demo dataset
              so you can still explore the interface.
            </Callout>
          </Section>

          <Section id="graph" title="The 3-D graph">
            <p>
              Each <strong>sphere</strong> represents one package (either the root project or a
              dependency). Spheres are placed randomly in 3-D space using a Fibonacci-sphere
              distribution so they spread evenly and don't clump.
            </p>
            <p>
              Sphere <strong>size</strong> reflects risk — high-risk packages are rendered slightly
              larger so they stand out at a glance.
            </p>
            <p>
              <strong>Lines (edges)</strong> between spheres are hidden by default to keep the
              scene clean. They appear in colour only when you click a node:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Green lines = packages <em>this node depends on</em></li>
              <li>Orange lines = packages that <em>depend on this node</em></li>
            </ul>
            <p>
              In demo mode the graph gently animates, with each node drifting a random amount
              every 3 seconds to give the scene a living feel.
            </p>
          </Section>

          <Section id="colors" title="Node colours">
            <p>
              Every node is coloured by its detected <strong>package type</strong>, inferred from
              the package name:
            </p>
            <Table
              heads={['Colour', 'Type', 'Examples']}
              rows={[
                ['🩷 Pink',    'repository',  'Your root project'],
                ['🟣 Violet',  'library',     'react, lodash, zod, clsx'],
                ['🩵 Cyan',    'service',     'express, fastify, koa, nestjs'],
                ['🟡 Amber',   'database',    'mongoose, prisma, typeorm, redis'],
                ['🟢 Emerald', 'api',         'axios, got, node-fetch, grpc-js'],
                ['🔵 Blue',    'server',      'webpack, vite, esbuild, babel'],
                ['🟠 Orange',  'ip',          'network / infrastructure packages'],
                ['🔴 Red',     'threat',      'packages with known security issues'],
                ['💜 Fuchsia', 'vulnerability','packages with active CVEs'],
              ]}
            />
            <p className="mt-3">
              The <strong>selected node</strong> turns <span className="text-yellow-300 font-semibold">yellow</span> regardless of type,
              so you can always spot which one you clicked. Hovering a node lightens its colour slightly.
            </p>
          </Section>

          <Section id="edges" title="Edge colours">
            <Table
              heads={['Colour', 'Meaning']}
              rows={[
                ['Invisible (default)', 'All edges hidden when nothing is selected — keeps the scene clean'],
                ['🟢 Green',  'Outgoing edge — the selected node DEPENDS ON the target'],
                ['🟠 Orange', 'Incoming edge — the target DEPENDS ON the selected node'],
                ['Gray (hover)', 'Edges connected to the hovered node, shown faintly'],
              ]}
            />
          </Section>

          <Section id="risk" title="Risk scoring — how it works">
            <p>
              Every dependency gets a <strong>risk score from 0 % (very safe) to 100 % (critical)</strong>.
              The score is calculated from four independent factors that are added together:
            </p>
            <Table
              heads={['Factor', 'What it checks', 'Max contribution']}
              rows={[
                ['Known history',   'Packages that have had real CVEs, supply-chain attacks, or critical bugs in the past start with a higher base score.', '55%'],
                ['Version pinning', 'Using ^ or ~ in the version string means npm can silently install a newer (potentially broken) version. Using * or latest is the worst.', '40%'],
                ['Dev vs prod',     'devDependencies are not shipped to end users, so they pose less risk. They receive a 15% discount on their score.', '−15%'],
                ['Repo size',       'Projects with many dependencies are harder to audit manually. A small penalty is added for large repos.', '10%'],
              ]}
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { range: '0 – 39%', label: 'Low risk',    color: 'bg-emerald-900/40 border-emerald-700 text-emerald-300' },
                { range: '40 – 69%', label: 'Medium risk', color: 'bg-amber-900/40 border-amber-700 text-amber-300'     },
                { range: '70 – 100%', label: 'High risk',   color: 'bg-rose-900/40 border-rose-700 text-rose-300'       },
              ].map(({ range, label, color }) => (
                <div key={label} className={`border rounded-xl p-3 text-center text-sm ${color}`}>
                  <div className="font-bold">{label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{range}</div>
                </div>
              ))}
            </div>
            <Callout color="yellow">
              Risk scores are heuristic estimates based on package reputation and version pinning.
              They are not a substitute for a real security audit or CVE database lookup.
              A low score does not guarantee safety.
            </Callout>
          </Section>

          <Section id="inspector" title="Inspector panel (right side)">
            <p>The Inspector has four tabs:</p>
            <Table
              heads={['Tab', 'What you see']}
              rows={[
                ['Overview', 'Total package count, edge count, average risk score, node type breakdown with mini bar chart, and camera controls reminder.'],
                ['Risk',     'All packages ranked from highest to lowest risk score. Click any row to jump straight to that node.'],
                ['Graph',    'Packages grouped by connectivity: Independent (no edges), Only depends on others, Only used by others, Both directions.'],
                ['Node',     'Detailed view of the currently selected node — type badge, risk bar, version/license metadata, full "Depends on" and "Used by" lists.'],
              ]}
            />
            <p>
              The <strong>search bar</strong> at the top of every tab lets you type a package name
              and instantly filter — results show with their risk bar so you can triage quickly.
            </p>
          </Section>

          <Section id="controls" title="Camera controls">
            <Table
              heads={['Action', 'How']}
              rows={[
                ['Rotate',        'Left-click and drag anywhere in the scene'],
                ['Zoom',          'Scroll wheel — zoom in/out'],
                ['Pan',           'Right-click and drag (or two-finger drag on trackpad)'],
                ['Select node',   'Left-click a sphere'],
                ['Deselect',      'Click the same sphere again, or click empty space'],
                ['Inspect node',  'Selected node details appear in the Node tab automatically'],
              ]}
            />
          </Section>

          <Section id="multi" title="Multiple package.json files">
            <p>
              Many monorepos (like Turborepo or Nx workspaces) contain several{' '}
              <Code>package.json</Code> files — one for the root and one per app/package.
              OpenPulse handles this automatically:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>The backend uses the GitHub Trees API to recursively scan every file in the repo.</li>
              <li>All <Code>package.json</Code> files outside <Code>node_modules</Code> are found.</li>
              <li>
                If more than one is found, a picker modal appears showing each file's:
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                  <li>Path in the repo</li>
                  <li>Package name and version</li>
                  <li>Short description (if any)</li>
                  <li>Total dependency count</li>
                </ul>
              </li>
              <li>Select the one you want to analyse — the graph loads immediately.</li>
            </ol>
          </Section>

          <Section id="demo" title="Demo mode">
            <p>
              If the backend is unreachable (API Offline indicator in the header), or if GitHub
              analysis fails, OpenPulse automatically loads a deterministic 120-node demo dataset.
            </p>
            <p>
              In demo mode nodes use real npm package names (react, prisma, stripe, etc.) and
              positions evolve gently every 3 seconds to show the graph is alive.
              The <strong>Demo</strong> button in the header also loads this dataset manually at
              any time.
            </p>
            <Callout color="green">
              The demo dataset is generated from a fixed seed so it is always the same, but stored
              in <Code>localStorage</Code> so evolved positions are remembered between refreshes.
            </Callout>
          </Section>

          <Section id="faq" title="FAQ">
            {[
              {
                q: 'Why are some packages marked high risk even though they are popular?',
                a: 'Popularity does not equal safety. Packages like lodash, moment, and axios have had real CVEs in the past. The risk score reflects historical reputation and version pinning, not current patch status.',
              },
              {
                q: 'Can I analyse a private repository?',
                a: 'Not yet. The backend uses unauthenticated GitHub API requests. Private repo support (via a GitHub token) is planned for a future release.',
              },
              {
                q: 'Why does the graph look different each time I analyse the same repo?',
                a: 'Node positions are placed using a Fibonacci-sphere spread on first load, then each node drifts a small random amount every 3 seconds in demo mode. In live mode positions are stable.',
              },
              {
                q: 'The graph has too many nodes — how do I find a specific package?',
                a: 'Use the search bar at the top of the Inspector panel. Type any part of the package name and matching results appear instantly with their risk scores.',
              },
              {
                q: 'Edges are invisible — is that a bug?',
                a: 'No, this is intentional. With 100+ nodes showing all edges at once creates an unreadable mess. Click any node to reveal its edges in green (depends on) and orange (used by).',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-slate-800 bg-black p-4">
                <p className="font-medium text-slate-200 mb-1.5">{q}</p>
                <p className="text-sm text-slate-400">{a}</p>
              </div>
            ))}
          </Section>

        </main>
      </div>
    </div>
  );
}