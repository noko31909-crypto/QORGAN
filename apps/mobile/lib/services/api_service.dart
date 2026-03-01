import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Change this to your computer's IP address when testing on real device
  static const String baseUrl = 'http://192.168.0.142:5001/api';
  
  String? _token;
  
  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }
  
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    _token = token;
  }
  
  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    _token = null;
  }
  
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }
  
  // Auth APIs
  Future<Map<String, dynamic>> register({
    String? email,
    String? phone,
    required String password,
    required String role,
    required String schoolCode,
    String? cashierCode,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'phone': phone,
        'password': password,
        'role': role,
        'school_code': schoolCode,
        'cashier_code': cashierCode,
      }),
    ).timeout(Duration(seconds: 10));
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error']);
    }
  }
  
  Future<Map<String, dynamic>> login({
    String? email,
    String? phone,
    required String password,
    String? schoolCode,
    String? cashierCode,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'phone': phone,
        'password': password,
        'school_code': schoolCode,
        'cashier_code': cashierCode,
      }),
    ).timeout(Duration(seconds: 10));
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _saveToken(data['token']);
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['error']);
    }
  }
  
  // Cameras
  Future<List<dynamic>> getCameras() async {
    await _loadToken();
    final response = await http.get(
      Uri.parse('$baseUrl/cameras'),
      headers: _headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load cameras');
    }
  }
  
  // Incidents
  Future<List<dynamic>> getIncidents() async {
    await _loadToken();
    final response = await http.get(
      Uri.parse('$baseUrl/incidents'),
      headers: _headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load incidents');
    }
  }
  
  Future<Map<String, dynamic>> sendSOS({
    String? description,
    String? location,
    double? latitude,
    double? longitude,
  }) async {
    await _loadToken();
    final response = await http.post(
      Uri.parse('$baseUrl/incidents/sos'),
      headers: _headers,
      body: jsonEncode({
        'description': description,
        'location': location,
        'latitude': latitude,
        'longitude': longitude,
      }),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to send SOS');
    }
  }
  
  // Notifications
  Future<List<dynamic>> getNotifications() async {
    await _loadToken();
    final response = await http.get(
      Uri.parse('$baseUrl/notifications'),
      headers: _headers,
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load notifications');
    }
  }
  
  Future<void> markNotificationRead(int notificationId) async {
    await _loadToken();
    await http.put(
      Uri.parse('$baseUrl/notifications/$notificationId/read'),
      headers: _headers,
    );
  }
}
