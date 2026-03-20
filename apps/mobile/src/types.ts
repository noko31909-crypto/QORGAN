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
