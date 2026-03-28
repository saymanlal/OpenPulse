import type { AnalyzerGraphData } from '@/types/graph';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://openpulse-43sj.onrender.com';

export class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  async health(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return response.json();
  }

  async analyzeRepository(repo: string): Promise<AnalyzerGraphData> {
    // Parse repo input
    const parsed = this.parseRepoInput(repo);
    if (!parsed) {
      throw new Error('Invalid repository format. Use: owner/repo or GitHub URL');
    }

    const response = await fetch(`${this.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        owner: parsed.owner,
        repo: parsed.repo,
        ecosystem: null,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let message = 'Repository analysis failed';
      try {
        const payload = await response.json();
        message = payload.detail || message;
      } catch {
        message = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(message);
    }

    return response.json();
  }

  private parseRepoInput(raw: string): { owner: string; repo: string } | null {
    const s = raw.trim().replace(/\.git$/, '');
    
    // Try URL format
    const urlMatch = s.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2] };
    }
    
    // Try owner/repo format
    const slashMatch = s.match(/^([^/]+)\/([^/]+)$/);
    if (slashMatch) {
      return { owner: slashMatch[1], repo: slashMatch[2] };
    }
    
    return null;
  }
}

export const apiClient = new ApiClient();