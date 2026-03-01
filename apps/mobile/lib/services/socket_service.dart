import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static const String serverUrl = 'http://192.168.0.142:5001';
  
  IO.Socket? socket;
  Function(Map<String, dynamic>)? onWeaponAlert;
  Function(Map<String, dynamic>)? onSOSAlert;
  
  void connect() {
    try {
      socket = IO.io(serverUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'timeout': 5000,
      });
      
      socket!.connect();
      
      socket!.on('connect', (_) {
        print('Connected to server');
      });
      
      socket!.on('disconnect', (_) {
        print('Disconnected from server');
      });
      
      socket!.on('connect_error', (error) {
        print('Socket connection error: $error');
      });
      
      socket!.on('connect_timeout', (_) {
        print('Socket connection timeout');
      });
      
      socket!.on('weapon_alert', (data) {
        print('Weapon alert received: $data');
        if (onWeaponAlert != null) {
          onWeaponAlert!(Map<String, dynamic>.from(data));
        }
      });
      
      socket!.on('sos_alert', (data) {
        print('SOS alert received: $data');
        if (onSOSAlert != null) {
          onSOSAlert!(Map<String, dynamic>.from(data));
        }
      });
    } catch (e) {
      print('Error initializing socket: $e');
    }
  }
  
  void subscribeToCamera(int cameraId) {
    socket?.emit('subscribe_camera', {'camera_id': cameraId});
  }
  
  void disconnect() {
    socket?.disconnect();
    socket = null;
  }
}
