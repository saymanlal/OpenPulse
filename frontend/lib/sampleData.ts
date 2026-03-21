import type { GraphData, GraphEdge, GraphNode, NodeType } from '@/types/graph';

const NODE_TYPES: NodeType[] = ['library', 'api', 'service', 'database', 'server', 'repository'];
const DEMO_STORAGE_KEY = 'openpulse-demo-v6-realnames';
const DEMO_NODE_COUNT = 120;

const REAL_PACKAGE_NAMES = [
  'react', 'next', 'typescript', 'tailwindcss', 'prisma', 'axios', 'lodash',
  'zod', 'trpc', 'express', 'fastify', 'mongoose', 'redis', 'postgres',
  'graphql', 'apollo', 'webpack', 'vite', 'vitest', 'jest', 'eslint',
  'prettier', 'husky', 'stripe', 'socket.io', 'jsonwebtoken', 'bcrypt', 'dotenv',
  'cors', 'helmet', 'morgan', 'winston', 'pino', 'dayjs', 'uuid',
  'sharp', 'multer', 'nodemailer', 'bull', 'ioredis', 'typeorm', 'drizzle',
  'zustand', 'jotai', 'swr', 'react-query', 'framer-motion', 'radix-ui',
  'lucide-react', 'clsx', 'class-variance-authority', 'three', 'react-three-fiber',
  'openai', 'langchain', 'anthropic-sdk', 'resend', 'uploadthing', 'clerk',
  'next-auth', 'supabase', 'firebase', 'planetscale', 'neon', 'turso',
  'vercel-ai', 'react-hook-form', 'tanstack-table', 'tanstack-query',
  'recharts', 'd3', 'mapbox-gl', 'pusher-js', 'twilio', 'sendgrid',
  'aws-sdk', 'googleapis', 'octokit', 'cheerio', 'puppeteer',
  'playwright', 'cypress', 'storybook', 'sentry', 'posthog',
  'mixpanel', 'datadog', 'newrelic', 'kafkajs', 'amqplib',
  'grpc-js', 'protobufjs', 'turborepo', 'nx', 'lerna',
  'docker-compose', 'nginx', 'caddy', 'traefik',
  'date-fns', 'moment', 'yup', 'superjson', 'immer',
  'p-queue', 'p-limit', 'got', 'node-fetch', 'undici',
  'chalk', 'ora', 'inquirer', 'commander', 'yargs',
  'ts-node', 'tsx', 'esbuild', 'rollup', 'swc',
  'react-router', 'wouter', 'next-i18next', 'i18next',
  'react-dnd', 'dnd-kit', 'react-virtualized', 'react-window',
  'react-pdf', 'pdfkit', 'exceljs', 'csv-parse', 'papaparse',
  'node-cron', 'agenda', 'bee-queue', 'bottleneck', 'limiter',
  'passport', 'express-session', 'connect-redis', 'cookie-parser',
  'compression', 'express-rate-limit', 'express-validator',
];

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function createNode(index: number, rand: () => number): GraphNode {
  const type = NODE_TYPES[Math.floor(rand() * NODE_TYPES.length)];
  const pkgName = REAL_PACKAGE_NAMES[index % REAL_PACKAGE_NAMES.length];
  const suffix = index >= REAL_PACKAGE_NAMES.length ? `-${Math.floor(index / REAL_PACKAGE_NAMES.length)}` : '';
  const name = index === 0 ? 'my-app' : `${pkgName}${suffix}`;

  return {
    id: name,
    label: name,
    type: index === 0 ? 'repository' : type,
    position: [
      Number(((rand() - 0.5) * 140).toFixed(2)),
      Number(((rand() - 0.5) * 80).toFixed(2)),
      Number(((rand() - 0.5) * 140).toFixed(2)),
    ] as [number, number, number],
    riskScore: Number((0.05 + rand() * 0.95).toFixed(2)),
    size: Number((0.6 + rand() * 0.9).toFixed(2)),
    metadata: {
      version: `${Math.floor(rand() * 5)}.${Math.floor(rand() * 20)}.${Math.floor(rand() * 10)}`,
      isDev: rand() > 0.65,
      license: (['MIT', 'Apache-2.0', 'ISC', 'BSD-3-Clause', 'GPL-3.0'] as const)[Math.floor(rand() * 5)],
      source: 'demo',
    },
  };
}

export function generateDemoDataset(seed = 77777): GraphData {
  const rand = seededRandom(seed);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < DEMO_NODE_COUNT; i++) {
    nodes.push(createNode(i, rand));
  }

  const rootId = nodes[0].id;

  // Root connects to first 18 nodes (direct dependencies)
  for (let i = 1; i <= Math.min(18, nodes.length - 1); i++) {
    edges.push({
      id: `root-dep-${i}`,
      source: rootId,
      target: nodes[i].id,
      weight: 1,
    });
  }

  // Each node gets 1-4 random connections (transitive dependencies)
  for (let i = 1; i < nodes.length; i++) {
    const connCount = Math.floor(rand() * 4) + 1;
    for (let j = 0; j < connCount; j++) {
      const t = Math.floor(rand() * nodes.length);
      if (t !== i) {
        edges.push({
          id: `dep-${i}-${t}-${j}`,
          source: nodes[i].id,
          target: nodes[t].id,
          weight: Number((0.3 + rand() * 0.7).toFixed(2)),
        });
      }
    }
  }

  return { nodes, edges };
}

export function getOrCreateDemoDataset(): GraphData {
  if (typeof window === 'undefined') return generateDemoDataset();
  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GraphData;
      if (parsed.nodes?.length === DEMO_NODE_COUNT) return parsed;
    }
  } catch { /* regen */ }
  const data = generateDemoDataset();
  try { window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

export function persistDemoDataset(data: GraphData): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function evolveDemoDataset(current: GraphData): GraphData {
  const nodes = current.nodes.map((node) => {
    const [x, y, z] = node.position;
    return {
      ...node,
      position: [
        Number(Math.max(-70, Math.min(70, x + (Math.random() - 0.5) * 14)).toFixed(2)),
        Number(Math.max(-40, Math.min(40, y + (Math.random() - 0.5) * 10)).toFixed(2)),
        Number(Math.max(-70, Math.min(70, z + (Math.random() - 0.5) * 14)).toFixed(2)),
      ] as [number, number, number],
    };
  });
  return { nodes, edges: current.edges };
}