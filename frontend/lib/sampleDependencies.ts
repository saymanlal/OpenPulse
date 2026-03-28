import type { PackageJson, DependencyAnalysis } from '@/types/dependency';
import { DependencyAnalyzer } from './dependencyAnalyzer';

/**
 * Generate sample package.json for testing
 */
export function generateSamplePackageJson(): PackageJson {
  return {
    name: 'sample-web-app',
    version: '1.0.0',
    description: 'A sample web application with dependencies',
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      next: '^14.0.0',
      axios: '^1.6.0',
      lodash: '^4.17.21',
      dayjs: '^1.11.10',
      zustand: '^4.4.7',
      '@tanstack/react-query': '^5.0.0',
      'framer-motion': '^10.16.0',
    },
    devDependencies: {
      typescript: '^5.3.0',
      '@types/react': '^18.2.0',
      '@types/node': '^20.10.0',
      eslint: '^8.55.0',
      prettier: '^3.1.0',
      tailwindcss: '^3.3.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
    },
    peerDependencies: {
      react: '^18.0.0',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/example/sample-web-app',
    },
    license: 'MIT',
  };
}

/**
 * Generate sample requirements.txt for Python
 */
export function generateSampleRequirementsTxt(): string {
  return `# Web Framework
Django==4.2.0
djangorestframework==3.14.0
celery==5.3.0

# Database
psycopg2-binary==2.9.9
redis==5.0.0

# API & HTTP
requests==2.31.0
httpx==0.25.0

# Data Processing
pandas==2.1.3
numpy==1.26.0

# Testing
pytest==7.4.0
pytest-django==4.7.0
black==23.11.0

# Monitoring
sentry-sdk==1.38.0
`;
}

/**
 * Generate realistic dependency graph with metadata
 */
export function generateRealisticDependencies(): DependencyAnalysis {
  const packageJson: PackageJson = {
    name: 'enterprise-dashboard',
    version: '2.3.1',
    description: 'Enterprise analytics dashboard',
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      next: '^14.0.4',
      zustand: '^4.4.7',
      '@tanstack/react-query': '^5.8.0',
      '@radix-ui/react-dialog': '^1.0.5',
      '@radix-ui/react-dropdown-menu': '^2.0.6',
      'lucide-react': '^0.294.0',
      recharts: '^2.10.0',
      d3: '^7.8.5',
      axios: '^1.6.2',
      lodash: '^4.17.21',
      dayjs: '^1.11.10',
      clsx: '^2.0.0',
      'tailwind-merge': '^2.1.0',
      'react-hook-form': '^7.48.2',
      zod: '^3.22.4',
      'next-auth': '^4.24.5',
      '@prisma/client': '^5.7.0',
    },
    devDependencies: {
      typescript: '^5.3.3',
      '@types/react': '^18.2.45',
      '@types/react-dom': '^18.2.18',
      '@types/node': '^20.10.4',
      '@types/lodash': '^4.14.202',
      '@types/d3': '^7.4.3',
      eslint: '^8.55.0',
      'eslint-config-next': '^14.0.4',
      prettier: '^3.1.1',
      '@typescript-eslint/eslint-plugin': '^6.14.0',
      '@typescript-eslint/parser': '^6.14.0',
      tailwindcss: '^3.3.6',
      autoprefixer: '^10.4.16',
      postcss: '^8.4.32',
      '@next/bundle-analyzer': '^14.0.4',
      '@testing-library/react': '^14.1.2',
      '@testing-library/jest-dom': '^6.1.5',
      vitest: '^1.0.4',
      prisma: '^5.7.0',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/enterprise/dashboard',
    },
    license: 'MIT',
  };

  const analyzer = new DependencyAnalyzer();
  const analysis = analyzer.parsePackageJson(packageJson, {
    includeDevDependencies: true,
    maxDepth: 2,
  });
  if (!analysis) throw new Error('Failed to generate DependencyAnalysis');
  return analysis;
}

/**
 * Generate Python project dependencies
 */
export function generatePythonDependencies(): DependencyAnalysis {
  const requirements = `# Core Framework
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1

# Database
psycopg2-binary==2.9.9
django-redis==5.4.0
redis==5.0.1

# Authentication & Security
djangorestframework-simplejwt==5.3.0
django-allauth==0.57.0
cryptography==41.0.7

# API & HTTP
requests==2.31.0
httpx==0.25.2
aiohttp==3.9.1

# Data Processing
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
matplotlib==3.8.2

# Async & Tasks
celery==5.3.4
django-celery-beat==2.5.0
kombu==5.3.4

# Monitoring & Logging
sentry-sdk==1.38.0
django-debug-toolbar==4.2.0
django-extensions==3.2.3

# Testing
pytest==7.4.3
pytest-django==4.7.0
pytest-cov==4.1.0
factory-boy==3.3.0
faker==20.1.0

# Code Quality
black==23.12.0
isort==5.13.2
flake8==6.1.0
mypy==1.7.1

# Documentation
sphinx==7.2.6
sphinx-rtd-theme==2.0.0

# Environment
python-dotenv==1.0.0
pydantic==2.5.2
pydantic-settings==2.1.0
`;

  const analyzer = new DependencyAnalyzer();
  const analysis = analyzer.parseRequirementsTxt(requirements, 'django-api-server');
  if (!analysis) throw new Error('Failed to generate Python DependencyAnalysis');
  return analysis;
}

/**
 * Generate microservices architecture dependencies
 */
export function generateMicroservicesDependencies(): DependencyAnalysis {
  const packageJson: PackageJson = {
    name: 'microservices-platform',
    version: '1.0.0',
    description: 'Microservices orchestration platform',
    dependencies: {
      '@grpc/grpc-js': '^1.9.0',
      '@grpc/proto-loader': '^0.7.10',
      amqplib: '^0.10.3',
      'socket.io': '^4.6.0',
      express: '^4.18.2',
      fastify: '^4.25.0',
      '@nestjs/core': '^10.2.0',
      '@nestjs/common': '^10.2.0',
      mongoose: '^8.0.3',
      'ioredis': '^5.3.2',
      '@prisma/client': '^5.7.0',
      consul: '^1.1.0',
      etcd3: '^1.1.2',
      'prom-client': '^15.1.0',
      winston: '^3.11.0',
      dotenv: '^16.3.1',
      joi: '^17.11.0',
    },
    devDependencies: {
      typescript: '^5.3.0',
      '@types/node': '^20.10.0',
      '@types/express': '^4.17.0',
      nodemon: '^3.0.2',
      ts-node: '^10.9.2',
      jest: '^29.7.0',
      supertest: '^6.3.3',
    },
    license: 'Apache-2.0',
  };

  const analyzer = new DependencyAnalyzer();
  const analysis = analyzer.parsePackageJson(packageJson);
  if (!analysis) throw new Error('Failed to generate Microservices DependencyAnalysis');
  return analysis;
}