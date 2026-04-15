const host = window.location.hostname || '127.0.0.1';

const normalizeBase = (url: string) => url.trim().replace(/\/$/, '');

const envApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const envSocketBase = import.meta.env.VITE_SOCKET_URL as string | undefined;
const envWsApiKey = import.meta.env.VITE_WS_API_KEY as string | undefined;

export const API_BASE_URL = normalizeBase(envApiBase || `http://${host}:5001/api`);
export const SOCKET_URL = normalizeBase(envSocketBase || `http://${host}:5001`);
export const WS_API_KEY = envWsApiKey || 'qorgan-demo-ws-key';
