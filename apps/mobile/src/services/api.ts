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
  getIncidents() { return this.request('/incidents', { auth: true }); }
  getNotifications() { return this.request('/notifications', { auth: true }); }

  markNotificationRead(id: number) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT', auth: true });
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
