// Bulletproof URL logic: Remove trailing slash if it exists
let rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
if (rawBaseUrl.endsWith('/')) {
    rawBaseUrl = rawBaseUrl.slice(0, -1);
}
const API_BASE_URL = rawBaseUrl;

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('authToken');
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    const token = getAuthToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Bulletproof endpoint logic: Ensure it starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const targetUrl = `${API_BASE_URL}${formattedEndpoint}`;

    const response = await fetch(targetUrl, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem('authToken');
            if (typeof window !== 'undefined') window.location.href = '/login';
        }
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
  delete<T>(endpoint: string, options?: RequestInit): Promise<T> { return this.request<T>(endpoint, { ...options, method: 'DELETE' }); }
}
export const useApi = () => { return new ApiClient(); };
export default ApiClient;
