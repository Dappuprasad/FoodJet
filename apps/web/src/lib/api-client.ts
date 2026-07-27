import type {
  AuthResponse,
  CreateOrderPayload,
  LoginPayload,
  MenuItem,
  MenuQuery,
  MenuResponse,
  Order,
  Paginated,
  RegisterPayload,
  UpdateOrderStatusPayload,
  UpsertMenuItemPayload,
  User,
} from '@foodjet/shared';
import { ApiError } from './api-error';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '');
const ACCESS_TOKEN_STORAGE_KEY = 'foodjet.accessToken';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skips the refresh-and-retry dance. Used by the auth calls themselves. */
  skipAuthRetry?: boolean;
  signal?: AbortSignal;
}

/**
 * Thin typed wrapper over fetch.
 *
 * The access token is short-lived and held in memory; the refresh token lives in
 * an httpOnly cookie the JavaScript here cannot read, which is the point — a
 * cross-site scripting bug can steal at most a token that expires in minutes.
 * localStorage keeps the access token across a page reload only so a refresh
 * does not visibly log the user out before the silent refresh completes.
 */
class ApiClient {
  private accessToken: string | null = null;
  /** In-flight refresh, shared so a burst of 401s triggers exactly one. */
  private refreshInFlight: Promise<string | null> | null = null;
  private onSessionExpired: (() => void) | null = null;

  constructor() {
    try {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
      // Private browsing modes can throw on storage access. Not fatal.
      this.accessToken = null;
    }
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;

    try {
      if (token) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
      /* storage unavailable — the in-memory token still works for this tab */
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Lets AuthContext clear its state when a refresh finally fails. */
  setSessionExpiredHandler(handler: (() => void) | null): void {
    this.onSessionExpired = handler;
  }

  /* ------------------------------------------------------------- auth --- */

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const auth = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
      skipAuthRetry: true,
    });
    this.setAccessToken(auth.accessToken);
    return auth;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const auth = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuthRetry: true,
    });
    this.setAccessToken(auth.accessToken);
    return auth;
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', { method: 'POST', skipAuthRetry: true });
    } finally {
      this.setAccessToken(null);
    }
  }

  me(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  /* ------------------------------------------------------------- menu --- */

  getMenu(query: MenuQuery = {}, signal?: AbortSignal): Promise<MenuResponse> {
    return this.request<MenuResponse>('/menu', {
      query: {
        category: query.category,
        search: query.search,
        vegetarianOnly: query.vegetarianOnly,
      },
      signal,
    });
  }

  getMenuItem(idOrSlug: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu/${encodeURIComponent(idOrSlug)}`);
  }

  /* ----------------------------------------------------------- orders --- */

  createOrder(payload: CreateOrderPayload): Promise<Order> {
    return this.request<Order>('/orders', { method: 'POST', body: payload });
  }

  getOrder(id: string, signal?: AbortSignal): Promise<Order> {
    return this.request<Order>(`/orders/${encodeURIComponent(id)}`, { signal });
  }

  getOrderByReference(reference: string): Promise<Order> {
    return this.request<Order>(`/orders/reference/${encodeURIComponent(reference)}`);
  }

  getMyOrders(page = 1, pageSize = 20): Promise<Paginated<Order>> {
    return this.request<Paginated<Order>>('/orders/me', { query: { page, pageSize } });
  }

  cancelOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    });
  }

  /* ------------------------------------------------------------ admin --- */

  getAdminMenu(): Promise<MenuResponse> {
    return this.request<MenuResponse>('/admin/menu');
  }

  createMenuItem(payload: UpsertMenuItemPayload): Promise<MenuItem> {
    return this.request<MenuItem>('/admin/menu', { method: 'POST', body: payload });
  }

  updateMenuItem(id: string, payload: Partial<UpsertMenuItemPayload>): Promise<MenuItem> {
    return this.request<MenuItem>(`/admin/menu/${id}`, { method: 'PATCH', body: payload });
  }

  delistMenuItem(id: string): Promise<MenuItem> {
    return this.request<MenuItem>(`/admin/menu/${id}`, { method: 'DELETE' });
  }

  getAllOrders(page = 1, pageSize = 20): Promise<Paginated<Order>> {
    return this.request<Paginated<Order>>('/admin/orders', { query: { page, pageSize } });
  }

  updateOrderStatus(id: string, payload: UpdateOrderStatusPayload): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: payload,
    });
  }

  /* --------------------------------------------------------- internals --- */

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, options);

    // One retry, and only after a successful token refresh. Retrying blindly
    // would turn an expired session into an infinite loop of 401s.
    if (response.status === 401 && !options.skipAuthRetry) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        return this.parse<T>(await this.send(path, options));
      }

      this.setAccessToken(null);
      this.onSessionExpired?.();
    }

    return this.parse<T>(response);
  }

  private async send(path: string, options: RequestOptions): Promise<Response> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    try {
      return await fetch(url.toString(), {
        method: options.method ?? 'GET',
        headers,
        // Sends the httpOnly refresh cookie on the auth routes.
        credentials: 'include',
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw ApiError.offline();
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const body: unknown = text ? safeJsonParse(text) : {};

    if (!response.ok) {
      throw ApiError.fromBody(body ?? {}, response.status);
    }

    return body as T;
  }

  /**
   * Collapses concurrent refreshes into one request. Three components mounting
   * at once with a stale token would otherwise fire three rotations, and since
   * refresh tokens rotate, the losers would invalidate the winner.
   */
  private refreshAccessToken(): Promise<string | null> {
    this.refreshInFlight ??= (async () => {
      try {
        const auth = await this.request<AuthResponse>('/auth/refresh', {
          method: 'POST',
          skipAuthRetry: true,
        });
        this.setAccessToken(auth.accessToken);
        return auth.accessToken;
      } catch {
        return null;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

export const api = new ApiClient();
export { ApiError };
