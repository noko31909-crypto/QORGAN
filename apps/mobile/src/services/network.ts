import { Platform } from 'react-native';
import Constants from 'expo-constants';

const parseExpoHost = () => {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;
  const host = hostUri.split(':')[0]?.trim();
  return host || null;
};

const defaultHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || '127.0.0.1';
  }

  const expoHost = parseExpoHost();
  if (expoHost) return expoHost;

  // Android emulator does not map localhost to host machine.
  if (Platform.OS === 'android') return '10.0.2.2';

  return '127.0.0.1';
};

const normalizeBase = (url: string) => url.trim().replace(/\/$/, '');

const envApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
const envSocketBase = process.env.EXPO_PUBLIC_SOCKET_URL;
const envWsApiKey = process.env.EXPO_PUBLIC_WS_API_KEY;
const host = defaultHost();

export const API_BASE_URL = normalizeBase(envApiBase || `http://${host}:5001/api`);
export const SOCKET_URL = normalizeBase(envSocketBase || `http://${host}:5001`);
export const WS_API_KEY = envWsApiKey || 'qorgan-demo-ws-key';
