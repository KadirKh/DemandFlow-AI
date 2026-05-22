/**
 * API Client with JWT Token Management
 * Handles all API calls with proper authentication headers
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "demandflow_token";
const ROLE_KEY = "demandflow_role";

export class ApiClient {
  private static token: string | null = null;
  private static role: string | null = null;

  /**
   * Initialize token from localStorage
   */
  static initialize() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
      this.role = localStorage.getItem(ROLE_KEY);
    }
  }

  /**
   * Set authentication token and role
   */
  static setAuth(token: string, role: string) {
    this.token = token;
    this.role = role;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ROLE_KEY, role);
    }
  }

  /**
   * Clear authentication
   */
  static clearAuth() {
    this.token = null;
    this.role = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
    }
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return this.token;
  }

  /**
   * Get user role
   */
  static getRole(): string | null {
    return this.role;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Build request headers with JWT token
   */
  private static getHeaders(options: RequestInit = {}): RequestInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return {
      ...options,
      headers,
    };
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const config = this.getHeaders(options);

    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid
      this.clearAuth();
      throw new Error("Unauthorized - please log in again");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      const message =
        error?.error?.message || error?.detail || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * GET request
   */
  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  static post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Login
   */
  static async login(email: string, password: string): Promise<{ token: string; role: string }> {
    const response = await this.request<{
      access_token: string;
      token_type: string;
      user: { role: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.setAuth(response.access_token, response.user.role);
    return {
      token: response.access_token,
      role: response.user.role,
    };
  }

  /**
   * Register
   */
  static async register(
    email: string,
    password: string,
    role: string
  ): Promise<{ token: string; role: string }> {
    const response = await this.request<{
      access_token: string;
      token_type: string;
      user: { role: string };
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });

    this.setAuth(response.access_token, response.user.role);
    return {
      token: response.access_token,
      role: response.user.role,
    };
  }

  /**
   * Get current user
   */
  static getMe<T>(): Promise<T> {
    return this.get<T>("/api/auth/me");
  }

  /**
   * Check if user has uploaded data
   */
  static checkDataStatus(): Promise<{ has_data: boolean }> {
    return this.get<{ has_data: boolean }>("/api/auth/check-data-status");
  }

  /**
   * Upload file to backend
   */
  static async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.status === 401) {
      this.clearAuth();
      throw new Error("Unauthorized - please log in again");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      const message =
        error?.error?.message || error?.detail || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }
}

// Initialize on module load
ApiClient.initialize();
