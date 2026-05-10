export type User = {
  id: number;
  email?: string | null;
  phone?: string | null;
  role: "guard" | "student";
};

export type Threat = {
  id?: number;
  class_name?: string;
  confidence?: number;
  location?: string;
  time?: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type?: string;
  icon?: string;
  is_read: boolean;
  created_at: string;
};

export type Incident = {
  id: number;
  type: 'weapon_detected' | 'sos_alert' | string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_path?: string | null;
  confidence?: number | null;
  status?: 'new' | 'acknowledged' | 'resolved' | 'active' | string;
  reported_by?: number | null;
  is_false_positive?: boolean;
  created_at: string;
};

export type MetricsSummary = {
  incidents: {
    total: number;
    open: number;
    resolved: number;
    weapon_detected: number;
    sos_alert: number;
    false_positives: number;
    false_positive_rate_pct: number;
  };
  notifications: {
    total: number;
    unread: number;
  };
  response: {
    ack_count: number;
    ack_avg_seconds: number | null;
    ack_p95_seconds: number | null;
  };
};

export type DetectionStatus = {
  enabled: boolean;
  is_running: boolean;
  detections_count: number;
};

export type MetricsTrendPoint = {
  date: string;
  total_detections: number;
  false_positives: number;
  false_positive_rate_pct: number;
};

export type IncidentNote = {
  id: number;
  incident_id: number;
  user_id: number;
  note: string;
  created_at: string;
};
