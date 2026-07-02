import { ApiError, apiRequest } from "./api-client";
import { clearTokens, getAccessToken, saveTokens } from "./token-storage";

export type AuthUser = {
  id: number;
  phone_number: string;
  role: "normal" | "coach" | "admin";
  has_health_profile: boolean;
};

export type RequestOtpResponse = {
  detail: string;
  expires_in_seconds: number;
  otp?: string;
};

export type VerifyOtpResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export function requestOtp(phoneNumber: string) {
  return apiRequest<RequestOtpResponse>("/api/auth/request-otp/", {
    body: { phone_number: phoneNumber },
  });
}

export async function verifyOtp(phoneNumber: string, otp: string) {
  const response = await apiRequest<VerifyOtpResponse>("/api/auth/verify-otp/", {
    body: { phone_number: phoneNumber, otp },
  });

  saveTokens({ access: response.access, refresh: response.refresh });
  return response;
}

export function getCurrentUser() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return Promise.reject(new ApiError("توکن ورود پیدا نشد.", 401, null));
  }

  return apiRequest<AuthUser>("/api/auth/me/", {
    token: accessToken,
  });
}

export function logout() {
  clearTokens();
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function needsHealthProfile(user: AuthUser) {
  return user.role === "normal" && !user.has_health_profile;
}
