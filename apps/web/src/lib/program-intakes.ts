import { ApiError, apiRequest } from "./api-client";
import { getAccessToken } from "./token-storage";

export type IntakeCompletion = {
  completed: boolean;
  updated_at: string | null;
};

export type ProgramIntakeStatus = {
  nutrition: IntakeCompletion;
  workout: IntakeCompletion;
};

export type NutritionIntakeInput = {
  preferred_meal_count: number;
  meal_pattern: "regular" | "irregular" | "skips_breakfast" | "night_eating" | "other";
  dietary_style: "none" | "vegetarian" | "vegan" | "low_carb" | "high_protein" | "other";
  cooking_time_availability: "very_low" | "moderate" | "enough";
  cooking_frequency: "rarely" | "few_times_weekly" | "most_days";
  budget_level: "economical" | "moderate" | "flexible";
  eating_out_frequency: "rarely" | "weekly_1_2" | "weekly_3_5" | "most_days";
  food_allergies: string;
  food_restrictions: string;
  disliked_foods: string;
  favorite_foods_or_cuisines: string;
  notes: string;
};

export type WorkoutIntakeInput = {
  workout_location: "home" | "gym" | "outdoor" | "mixed";
  available_days_per_week: number;
  preferred_session_duration: 20 | 30 | 45 | 60 | 90;
  experience_level: "beginner" | "intermediate" | "advanced";
  equipment_access: "none" | "basic" | "dumbbells_bands" | "full_gym";
  preferred_workout_style: "no_preference" | "strength" | "cardio" | "mobility" | "mixed";
  intensity_preference: "light" | "moderate" | "challenging";
  preferred_workout_time: "" | "morning" | "midday" | "evening" | "flexible";
  injuries_or_limitations: string;
  disliked_exercises: string;
  notes: string;
};

type IntakeMetadata = {
  completed_at: string;
  created_at: string;
  updated_at: string;
};

export type NutritionIntake = NutritionIntakeInput & IntakeMetadata;
export type WorkoutIntake = WorkoutIntakeInput & IntakeMetadata;

function requireAccessToken() {
  const token = getAccessToken();
  if (!token) throw new ApiError("توکن ورود پیدا نشد.", 401, null);
  return token;
}

export function getProgramIntakeStatus() {
  return apiRequest<ProgramIntakeStatus>("/api/program-intakes/status/", {
    token: requireAccessToken(),
  });
}

export function getNutritionIntake() {
  return apiRequest<NutritionIntake>("/api/program-intakes/nutrition/", {
    token: requireAccessToken(),
  });
}

export function saveNutritionIntake(value: NutritionIntakeInput) {
  return apiRequest<NutritionIntake>("/api/program-intakes/nutrition/", {
    method: "PUT",
    token: requireAccessToken(),
    body: value,
  });
}

export function getWorkoutIntake() {
  return apiRequest<WorkoutIntake>("/api/program-intakes/workout/", {
    token: requireAccessToken(),
  });
}

export function saveWorkoutIntake(value: WorkoutIntakeInput) {
  return apiRequest<WorkoutIntake>("/api/program-intakes/workout/", {
    method: "PUT",
    token: requireAccessToken(),
    body: value,
  });
}
