import type { AnalyzerGraphData } from '@/types/graph';

// ✅ Smart API URL detection
// - If NEXT_PUBLIC_API_URL is set, use it
// - If running on localhost, use http://localhost:8001
// - Otherwise, use Render production URL
const getApiBaseUrl = (): string => {
  // Environment variable takes precedence
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Client-side detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }
  }
  
  // Production default (Render)
  return 'https://openpulse-43sj.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {
    console.log(`[API Client] Initialized with base URL: ${this.baseUrl}`);
  }

  async health(): Promise<{ status: string; service: string; version: string }> {
    try {
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
    } catch (error) {
      console.error('[API Client] Health check failed:', error);
      throw error;
    }
  }

  async analyzeRepository(repo: string): Promise<AnalyzerGraphData> {
    // Parse repo input
    const parsed = this.parseRepoInput(repo);
    if (!parsed) {
      throw new Error('Invalid repository format. Use: owner/repo or GitHub URL');
    }

    try {
      console.log(`[API Client] Analyzing: ${parsed.owner}/${parsed.repo}`);
      
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
    } catch (error) {
      console.error('[API Client] Analysis failed:', error);
      throw error;
    }
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