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
  method?: "GET" | "POST" | "PUT";
};

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data), response.status, data);
  }

  return data as TResponse;
}

export async function apiDownload(path: string, token: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    throw new ApiError(extractErrorMessage(data), response.status, data);
  }
  return response.blob();
}
