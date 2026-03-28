import type {
  GitHubRepository,
  PackageJson,
  DependencyAnalysis,
  ScanOptions,
} from '@/types/dependency';
import { DependencyAnalyzer } from './dependencyAnalyzer';

export class GitHubScanner {
  private apiBase = 'https://api.github.com';

  parseGitHubUrl(url: string): GitHubRepository | null {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+)/,
      /github\.com\/([^/]+)\/([^/]+)\.git/,
      /git@github\.com:([^/]+)\/([^/]+)\.git/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const owner = match[1];
        const repo = match[2].replace('.git', '');

        return {
          owner,
          repo,
          fullName: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
        };
      }
    }

    return null;
  }

  async fetchRepositoryInfo(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await fetch(`${this.apiBase}/repos/${owner}/${repo}`);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;

    return {
      owner,
      repo,
      fullName: data.full_name as string,
      url: data.html_url as string,
      description: data.description as string | undefined,
      stars: data.stargazers_count as number | undefined,
      forks: data.forks_count as number | undefined,
      openIssues: data.open_issues_count as number | undefined,
      license: (data.license as Record<string, string> | null)?.spdx_id,
      language: data.language as string | undefined,
    };
  }

  async hasPackageJson(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${owner}/${repo}/contents/package.json`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async hasRequirementsTxt(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${owner}/${repo}/contents/requirements.txt`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchPackageJson(
    owner: string,
    repo: string,
    branch = 'main'
  ): Promise<PackageJson> {
    let response = await fetch(
      `${this.apiBase}/repos/${owner}/${repo}/contents/package.json?ref=${branch}`
    );

    if (!response.ok && branch === 'main') {
      response = await fetch(
        `${this.apiBase}/repos/${owner}/${repo}/contents/package.json?ref=master`
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch package.json: ${response.status}`);
    }

    const data = await response.json() as { content: string };
    const content = atob(data.content);
    return JSON.parse(content) as PackageJson;
  }

  async fetchRequirementsTxt(
    owner: string,
    repo: string,
    branch = 'main'
  ): Promise<string> {
    let response = await fetch(
      `${this.apiBase}/repos/${owner}/${repo}/contents/requirements.txt?ref=${branch}`
    );

    if (!response.ok && branch === 'main') {
      response = await fetch(
        `${this.apiBase}/repos/${owner}/${repo}/contents/requirements.txt?ref=master`
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch requirements.txt: ${response.status}`);
    }

    const data = await response.json() as { content: string };
    return atob(data.content);
  }

  async scanRepository(
    githubUrl: string,
    options: ScanOptions = {}
  ): Promise<DependencyAnalysis | null> {
    const repoInfo = this.parseGitHubUrl(githubUrl);
    if (!repoInfo) {
      throw new Error('Invalid GitHub URL');
    }

    const analyzer = new DependencyAnalyzer();

    const hasPackageJson = await this.hasPackageJson(repoInfo.owner, repoInfo.repo);

    if (hasPackageJson) {
      const packageJson = await this.fetchPackageJson(
        repoInfo.owner,
        repoInfo.repo,
        repoInfo.branch
      );

      const analysis = analyzer.parsePackageJson(packageJson, options);
      analysis.repositoryUrl = repoInfo.url;
      return analysis;
    }

    const hasRequirements = await this.hasRequirementsTxt(
      repoInfo.owner,
      repoInfo.repo
    );

    if (hasRequirements) {
      const requirements = await this.fetchRequirementsTxt(
        repoInfo.owner,
        repoInfo.repo,
        repoInfo.branch
      );

      const analysis = analyzer.parseRequirementsTxt(requirements, repoInfo.repo);
      analysis.repositoryUrl = repoInfo.url;
      return analysis;
    }

    return null;
  }

  async detectPackageManager(
    owner: string,
    repo: string
  ): Promise<'npm' | 'pip' | 'unknown'> {
    const hasPackageJson = await this.hasPackageJson(owner, repo);
    if (hasPackageJson) return 'npm';

    const hasRequirements = await this.hasRequirementsTxt(owner, repo);
    if (hasRequirements) return 'pip';

    return 'unknown';
  }
}

export async function scanGitHubRepository(
  url: string,
  options?: ScanOptions
): Promise<DependencyAnalysis | null> {
  const scanner = new GitHubScanner();
  return scanner.scanRepository(url, options);
}