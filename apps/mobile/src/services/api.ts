import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './network';

type RequestOptions = RequestInit & { auth?: boolean };

class ApiService {
  private token: string | null = null;

  private async loadToken() {
    if (!this.token) this.token = await AsyncStorage.getItem('auth_token');
    return this.token;
  }

  private async saveToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private async request(path: string, options: RequestOptions = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (options.auth) {
      const token = await this.loadToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
      const text = await res.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      }
      return data;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw new Error('Request timeout. Check backend connection and try again.');
      }

      if (e instanceof TypeError) {
        throw new Error(`Network error. Cannot reach API at ${API_BASE_URL}.`);
      }

      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  register(payload: {
    email?: string;
    phone?: string;
    password: string;
    role: 'guard' | 'student';
    school_code: string;
    cashier_code?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(async (data) => {
      await this.saveToken(data.token);
      return data;
    });
  }

  login(payload: {
    email?: string;
    phone?: string;
    password: string;
    school_code?: string;
    cashier_code?: string;
  }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(async (data) => {
      await this.saveToken(data.token);
      return data;
    });
  }

  getCameras() { return this.request('/cameras', { auth: true }); }
  getCamerasStatus() { return this.request('/cameras/status', { auth: true }); }
  startCamera(cameraId: number) {
    return this.request(`/cameras/${cameraId}/start`, { method: 'POST', auth: true });
  }
  stopCamera(cameraId: number) {
    return this.request(`/cameras/${cameraId}/stop`, { method: 'POST', auth: true });
  }
  getIncidents(params?: { status?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/incidents${suffix}`, { auth: true });
  }
  getNotifications() { return this.request('/notifications', { auth: true }); }
  getMetricsSummary() { return this.request('/metrics/summary', { auth: true }); }
  getMetricsTrends(days = 7) { return this.request(`/metrics/trends?days=${days}`, { auth: true }); }
  getDetectionStatus() { return this.request('/detection/status', { auth: true }); }

  markNotificationRead(id: number) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT', auth: true });
  }

  updateIncidentStatus(id: number, status: 'new' | 'acknowledged' | 'resolved') {
    return this.request(`/incidents/${id}/status`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ status }),
    });
  }

  getIncidentTimeline(id: number) {
    return this.request(`/incidents/${id}/timeline`, { auth: true });
  }

  getIncidentNotes(id: number) {
    return this.request(`/incidents/${id}/notes`, { auth: true });
  }

  addIncidentNote(id: number, note: string) {
    return this.request(`/incidents/${id}/notes`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ note }),
    });
  }

  setFalsePositive(id: number, isFalsePositive: boolean) {
    return this.request(`/incidents/${id}/false-positive`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ is_false_positive: isFalsePositive }),
    });
  }

  sendSOS(payload: { description?: string; location?: string; latitude?: number; longitude?: number; }) {
    return this.request('/incidents/sos', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
