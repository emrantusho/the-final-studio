const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
function getAuthToken() { return sessionStorage.getItem('authToken'); }
class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) { headers.set('Content-Type', 'application/json'); }
    const token = getAuthToken(); if (token) { headers.set('Authorization', `Bearer ${token}`); }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) { sessionStorage.removeItem('authToken'); window.location.hash = '#/login'; window.location.reload(); }
      const errorData = await response.json().catch(() => ({ error: 'A network error occurred' }));
      throw new Error(errorData.error || 'An unknown error occurred');
    }
    if (response.status === 204) return null as T;
    return response.json();
  }
  get<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'GET' }); }
  post<T>(endpoint: string, body: any) { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put<T>(endpoint: string, body: any) { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
}
export const api = new ApiClient();
