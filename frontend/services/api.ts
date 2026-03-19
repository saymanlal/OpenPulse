import type { AnalyzerGraphData } from '@/types/graph';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  async health(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  async analyzeRepository(repo: string): Promise<AnalyzerGraphData> {
    const response = await fetch(
      `${this.baseUrl}/analyze?repo=${encodeURIComponent(repo)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      let message = 'Repository analysis failed';
      try {
        const payload = await response.json();
        message = payload.detail || message;
      } catch {
        // Ignore JSON parsing failures for plain-text error responses.
      }
      throw new Error(message);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
