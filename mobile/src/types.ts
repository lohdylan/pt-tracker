export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  goals: string | null;
  notes: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  client_id: number;
  scheduled_at: string;
  duration_min: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  exercise_name: string;
  sets?: number;
  reps?: number;
  weight?: number;
}

export interface WorkoutLog {
  id: number;
  session_id: number;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  sort_order: number;
  created_at: string;
}

export interface DashboardStats {
  active_clients: number;
  today_sessions: number;
  week_sessions: number;
  completion_rate: number;
}

export interface DashboardTodaySession {
  id: number;
  client_id: number;
  first_name: string;
  last_name: string;
  scheduled_at: string;
  duration_min: number;
  status: Session["status"];
}

export interface DashboardWeeklyTrend {
  day: string;
  count: number;
}

export interface DashboardRecentActivity {
  type: "session_completed" | "new_client" | "measurement_recorded";
  description: string;
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStats;
  today_sessions: DashboardTodaySession[];
  weekly_trend: DashboardWeeklyTrend[];
  recent_activity: DashboardRecentActivity[];
}

export interface Measurement {
  id: number;
  client_id: number;
  recorded_at: string;
  weight_lbs: number | null;
  body_fat_pct: number | null;
  chest_in: number | null;
  waist_in: number | null;
  hips_in: number | null;
  arm_in: number | null;
  thigh_in: number | null;
  created_at: string;
}
