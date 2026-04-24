// pour frontend : services\httpClient.ts

// BASE_URL dynamique : pointe vers le backend local en dev, Vercel en prod

// Configurer VITE_API_URL dans .env pour changer l'environnement
const BASE_URL = `${import.meta.env.VITE_API_URL || ""}/api/v1`;

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class HttpClient {
  private async getAuthToken(): Promise<string | null> {
    const userStr = localStorage.getItem("piyes-user");
    if (!userStr) return null;
    try {
      // On assume que le token est stocké dans l'objet user ou séparément
      const user = JSON.parse(userStr);
      return localStorage.getItem("piyes-auth-token") || user.token;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const token = await this.getAuthToken();
    const fullUrl = `${BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Timeout réseau : 15 secondes pour les requêtes critiques (login, signup)
    const isAuthEndpoint = endpoint.includes("/auth/login") || endpoint.includes("/auth/signup");
    const timeoutMs = isAuthEndpoint ? 15000 : 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    };

    try {
      console.log(`[HTTP] ${options.method || "GET"} ${fullUrl}`);
      const response = await fetch(fullUrl, config);
      clearTimeout(timeoutId);

      const is401FromSync =
        response.status === 401 && endpoint.includes("/user/sync");
      const is401FromAuth =
        response.status === 401 &&
        endpoint.includes("/auth/") &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/otp") &&
        !endpoint.includes("/auth/forgot-password") &&
        !endpoint.includes("/auth/reset-password");

      if (is401FromSync || is401FromAuth) {
        window.dispatchEvent(new CustomEvent("piyes:auth_expired"));
        throw new Error("Session expirée");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || errorData.message || "Erreur réseau";
        throw {
          status: response.status,
          message: errorMessage,
          data: errorData,
        };
      }

      if (response.status === 204) return {} as T;

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[HTTP Timeout] ${options.method || "GET"} ${endpoint}`);
        throw {
          status: 0,
          message: "La requête a expiré. Vérifiez votre connexion internet.",
          data: { error: { code: "NETWORK_TIMEOUT" } },
        };
      }
      console.error(
        `[HTTP Error] ${options.method || "GET"} ${endpoint}:`,
        error,
      );
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const http = new HttpClient();
