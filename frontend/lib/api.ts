const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) { headers.set('Content-Type', 'application/json'); }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers
    });

    if (!response.ok) {
        let errorData: { error?: string; message?: string } = {};
        try { errorData = await response.json(); } catch (e) { errorData = { message: `HTTP error! status: ${response.status}` }; }
        throw new Error(errorData.error || errorData.message || 'An unknown error occurred');
    }
    if (response.status === 204) { return null as T; }
    return response.json();
  }
  get<T>(endpoint: string, options?: RequestInit): Promise<T> { return this.request<T>(endpoint, { ...options, method: 'GET' }); }
  post<T>(endpoint:string, body: any, options?: RequestInit): Promise<T> { return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }); }
  put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> { return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }); }
}
export const useApi = () => { return new ApiClient(); };
export default ApiClient;
