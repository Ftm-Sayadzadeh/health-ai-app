import { ApiError, apiRequest } from "./api-client";
import { getAccessToken } from "./token-storage";

export type HealthGoal =
  | "lose_weight"
  | "maintain_weight"
  | "gain_weight"
  | "build_muscle"
  | "general_wellness";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "very_high";

export type HealthProfileInput = {
  display_name: string;
  birth_date: string;
  height_cm: string;
  weight_kg: string;
  goal: HealthGoal;
  activity_level: ActivityLevel;
  food_preferences: string;
  food_restrictions: string;
};

export type HealthProfile = HealthProfileInput & {
  created_at: string;
  updated_at: string;
};

function requireAccessToken() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiError("توکن ورود پیدا نشد.", 401, null);
  }
  return accessToken;
}

export function getHealthProfile() {
  return apiRequest<HealthProfile>("/api/health-profile/", {
    token: requireAccessToken(),
  });
}

export function saveHealthProfile(profile: HealthProfileInput) {
  return apiRequest<HealthProfile>("/api/health-profile/", {
    method: "PUT",
    token: requireAccessToken(),
    body: profile,
  });
}
