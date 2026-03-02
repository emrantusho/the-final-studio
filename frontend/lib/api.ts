const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// This function now runs only in the browser
function getAuthToken() {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
        if (response.status === 401) {
            sessionStorage.removeItem('authToken');
            // Redirecting from here can be tricky, let the AuthContext handle it.
            // window.location.href = '/login';
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
}
export const useApi = () => { return new ApiClient(); };
