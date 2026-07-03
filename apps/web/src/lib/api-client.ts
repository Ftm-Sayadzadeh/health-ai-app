import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "./token-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  body?: unknown;
  token?: string | null;
  method?: "GET" | "POST" | "PUT" | "DELETE";
};

type RefreshResponse = {
  access?: unknown;
};

let refreshRequest: Promise<string | null> | null = null;

function extractErrorMessage(details: unknown) {
  if (!details || typeof details !== "object") {
    return "درخواست با خطا روبه‌رو شد. دوباره تلاش کنید.";
  }

  if ("detail" in details && typeof details.detail === "string") {
    return details.detail;
  }

  const firstValue = Object.values(details)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
    return firstValue[0];
  }
  if (typeof firstValue === "string") {
    return firstValue;
  }

  return "درخواست با خطا روبه‌رو شد. دوباره تلاش کنید.";
}

function expireSession() {
  clearTokens();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function performTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as RefreshResponse;
    if (typeof data.access !== "string" || !data.access) return null;
    saveAccessToken(data.access);
    return data.access;
  } catch {
    return null;
  }
}

function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = performTokenRefresh().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

async function fetchWithAuthRetry(
  path: string,
  request: RequestInit,
  token?: string | null,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, request);
  if (response.status !== 401 || !token) return response;

  const currentToken = getAccessToken();
  const nextToken = currentToken && currentToken !== token
    ? currentToken
    : await refreshAccessToken();
  if (!nextToken) {
    expireSession();
    throw new ApiError("نشست ورودت به پایان رسیده. دوباره وارد شو.", 401, null);
  }

  const retryHeaders = new Headers(request.headers);
  retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
    ...request,
    headers: retryHeaders,
  });
  if (retryResponse.status === 401) {
    expireSession();
    throw new ApiError("نشست ورودت به پایان رسیده. دوباره وارد شو.", 401, null);
  }
  return retryResponse;
}

export async function apiRequest<TResponse>(
  path: string,
  { body, method = body ? "POST" : "GET", token }: RequestOptions = {},
) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithAuthRetry(path, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  }, token);

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data), response.status, data);
  }

  return data as TResponse;
}

export async function apiDownload(path: string, token: string) {
  const response = await fetchWithAuthRetry(path, {
    headers: { Authorization: `Bearer ${token}` },
  }, token);
  if (!response.ok) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    throw new ApiError(extractErrorMessage(data), response.status, data);
  }
  return response.blob();
}
