import type {
  GitHubRepository,
  PackageJson,
  DependencyAnalysis,
  ScanOptions,
} from '@/types/dependency';
import { DependencyAnalyzer } from './dependencyAnalyzer';

export class GitHubScanner {
  private apiBase = 'https://api.github.com';

  /**
   * Parse GitHub URL to extract owner and repo
   */
  parseGitHubUrl(url: string): GitHubRepository | null {
    // Support various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,           // https://github.com/owner/repo
      /github\.com\/([^\/]+)\/([^\/]+)\.git/,      // https://github.com/owner/repo.git
      /git@github\.com:([^\/]+)\/([^\/]+)\.git/,   // git@github.com:owner/repo.git
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

  /**
   * Fetch repository information from GitHub API
   */
  async fetchRepositoryInfo(
    owner: string,
    repo: string
  ): Promise<GitHubRepository> {
    try {
      const response = await fetch(`${this.apiBase}/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        owner,
        repo,
        fullName: data.full_name,
        url: data.html_url,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        license: data.license?.spdx_id,
        language: data.language,
      };
    } catch (error) {
      console.error('Failed to fetch repository info:', error);
      throw error;
    }
  }

  /**
   * Check if repository has package.json
   */
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

  /**
   * Check if repository has requirements.txt
   */
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

  /**
   * Fetch package.json from GitHub repository
   */
  async fetchPackageJson(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<PackageJson> {
    try {
      // Try main branch first
      let response = await fetch(
        `${this.apiBase}/repos/${owner}/${repo}/contents/package.json?ref=${branch}`
      );

      // If main doesn't exist, try master
      if (!response.ok && branch === 'main') {
        response = await fetch(
          `${this.apiBase}/repos/${owner}/${repo}/contents/package.json?ref=master`
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch package.json: ${response.status}`);
      }

      const data = await response.json();

      // GitHub API returns base64 encoded content
      const content = atob(data.content);
      return JSON.parse(content) as PackageJson;
    } catch (error) {
      console.error('Failed to fetch package.json:', error);
      throw error;
    }
  }

  /**
   * Fetch requirements.txt from GitHub repository
   */
  async fetchRequirementsTxt(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
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

      const data = await response.json();
      return atob(data.content);
    } catch (error) {
      console.error('Failed to fetch requirements.txt:', error);
      throw error;
    }
  }

  /**
   * Scan GitHub repository and analyze dependencies
   */
  async scanRepository(
    githubUrl: string,
    options: ScanOptions = {}
  ): Promise<DependencyAnalysis | null> {
    const repoInfo = this.parseGitHubUrl(githubUrl);
    if (!repoInfo) {
      throw new Error('Invalid GitHub URL');
    }

    const analyzer = new DependencyAnalyzer();

    // Try to find and parse package.json
    const hasPackageJson = await this.hasPackageJson(
      repoInfo.owner,
      repoInfo.repo
    );

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

    // Try to find and parse requirements.txt
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

      const analysis = analyzer.parseRequirementsTxt(
        requirements,
        repoInfo.repo
      );
      analysis.repositoryUrl = repoInfo.url;
      return analysis;
    }

    return null;
  }

  /**
   * Detect package manager from repository
   */
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

/**
 * Helper function to scan GitHub URL
 */
export async function scanGitHubRepository(
  url: string,
  options?: ScanOptions
): Promise<DependencyAnalysis | null> {
  const scanner = new GitHubScanner();
  return scanner.scanRepository(url, options);
}