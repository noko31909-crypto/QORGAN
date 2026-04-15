import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, WS_API_KEY } from './network';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return this.socket;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      query: { apiKey: WS_API_KEY },
      extraHeaders: { 'X-API-Key': WS_API_KEY },
    });
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  onWeaponAlert(handler: (data: any) => void) {
    const socket = this.connect();
    socket.on('weapon_alert', handler);
    return () => { socket.off('weapon_alert', handler); };
  }

  onSosAlert(handler: (data: any) => void) {
    const socket = this.connect();
    socket.on('sos_alert', handler);
    return () => { socket.off('sos_alert', handler); };
  }
}

export const socketService = new SocketService();
