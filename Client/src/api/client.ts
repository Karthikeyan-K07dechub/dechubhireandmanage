import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
}

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY   = 'dechub_access_token';
const REFRESH_KEY = 'dechub_refresh_token';
const ADMIN_TOKEN_KEY   = 'dechub_admin_access_token';
const ADMIN_REFRESH_KEY = 'dechub_admin_refresh_token';

export const tokenStore = {
  getAccess():  string | null { return localStorage.getItem(TOKEN_KEY); },
  getRefresh(): string | null { return localStorage.getItem(REFRESH_KEY); },
  set(access: string, refresh: string): void {
    localStorage.setItem(TOKEN_KEY,   access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const adminTokenStore = {
  getAccess():  string | null { return localStorage.getItem(ADMIN_TOKEN_KEY); },
  getRefresh(): string | null { return localStorage.getItem(ADMIN_REFRESH_KEY); },
  set(access: string, refresh: string): void {
    localStorage.setItem(ADMIN_TOKEN_KEY,   access);
    localStorage.setItem(ADMIN_REFRESH_KEY, refresh);
  },
  clear(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_KEY);
  },
};

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export function unwrapApiData<T>(payload: ApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>) &&
    (payload as ApiResponse<T>).data !== undefined
  ) {
    return (payload as ApiResponse<T>).data as T;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>)
  ) {
    throw new Error('API response did not include a data payload');
  }

  return payload as T;
}

// ─── Request interceptor — attach access token ────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isAdminRoute = typeof config.url === 'string' && config.url.startsWith('/admin/');
  const isAuthRoute = typeof config.url === 'string'
    && (config.url.startsWith('/auth/') || config.url.startsWith('/company-auth/'));

  // Determine which token to use based on the route
  const token = isAdminRoute ? adminTokenStore.getAccess() : tokenStore.getAccess();

  if (isAuthRoute && config.headers) {
    config.headers.Authorization = undefined;
  } else if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — refresh token on 401 ─────────────────────────────

type RefreshState = { isRefreshing: boolean; pendingQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown)  => void;
}> };
const refreshStates: Record<'admin' | 'company', RefreshState> = {
  admin: { isRefreshing: false, pendingQueue: [] },
  company: { isRefreshing: false, pendingQueue: [] },
};

function drainQueue(state: RefreshState, token: string | null, err: unknown) {
  state.pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  state.pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAdminRoute = typeof original.url === 'string' && original.url.startsWith('/admin/');
    const refreshState = refreshStates[isAdminRoute ? 'admin' : 'company'];

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/company-auth/refresh') &&
      !original.url?.includes('/company-auth/login') &&
      !original.url?.includes('/admin/refresh') &&
      !original.url?.includes('/admin/login')
    ) {
      original._retry = true;

      if (refreshState.isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshState.pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      refreshState.isRefreshing = true;
      
      // Use the appropriate token store based on the route
      const currentTokenStore = isAdminRoute ? adminTokenStore : tokenStore;
      const refreshToken = currentTokenStore.getRefresh();

      if (!refreshToken) {
        currentTokenStore.clear();
        refreshState.isRefreshing = false;
        window.dispatchEvent(new Event(isAdminRoute ? 'dechub:admin-session-expired' : 'dechub:session-expired'));
        return Promise.reject(normalizeError(error));
      }

      const refreshEndpoint = isAdminRoute ? '/admin/refresh' : '/company-auth/refresh';

      try {
        const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          refreshEndpoint,
          { refreshToken },
          { headers: { Authorization: undefined } },
        );
        const { accessToken, refreshToken: newRefresh } = unwrapApiData(res.data);
        currentTokenStore.set(accessToken, newRefresh);
        drainQueue(refreshState, accessToken, null);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(original);
      } catch (refreshErr) {
        currentTokenStore.clear();
        drainQueue(refreshState, null, refreshErr);
        window.dispatchEvent(new Event(isAdminRoute ? 'dechub:admin-session-expired' : 'dechub:session-expired'));
        return Promise.reject(normalizeError(refreshErr as AxiosError));
      } finally {
        refreshState.isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

// ─── Error normalizer ─────────────────────────────────────────────────────────

export function normalizeError(err: unknown): ApiError {
  // API interceptors already normalize errors; preserve them on subsequent calls.
  if (err && typeof err === 'object' && !axios.isAxiosError(err)) {
    const normalized = err as Partial<ApiError>;
    if (typeof normalized.code === 'string' && typeof normalized.message === 'string') {
      return { code: normalized.code, message: normalized.message, fields: normalized.fields };
    }
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as {
      code?: string;
      message?: string;
      fields?: Record<string, string>;
      error?: { code?: string; message?: string; fields?: Record<string, string> };
    } | undefined;

    if (data?.error) {
      return {
        code:    data.error.code    ?? 'API_ERROR',
        message: data.error.message ?? 'Something went wrong',
        fields:  data.error.fields,
      };
    }

    if (data?.message || data?.code || data?.fields) {
      return {
        code: data.code ?? 'API_ERROR',
        message: data.message ?? 'Something went wrong',
        fields: data.fields,
      };
    }

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return { code: 'TIMEOUT', message: 'Request timed out. Please try again.' };
    }
    if (!err.response) {
      return { code: 'NETWORK_ERROR', message: 'Network error. Check your connection.' };
    }
  }

  return {
    code:    'UNKNOWN_ERROR',
    message: err instanceof Error ? err.message : 'An unexpected error occurred',
  };
}
