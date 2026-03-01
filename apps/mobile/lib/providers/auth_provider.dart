import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  Map<String, dynamic>? _user;
  bool _isAuthenticated = false;
  
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  
  Future<void> login({
    String? email,
    String? phone,
    required String password,
    String? schoolCode,
    String? cashierCode,
  }) async {
    try {
      final response = await _apiService.login(
        email: email,
        phone: phone,
        password: password,
        schoolCode: schoolCode,
        cashierCode: cashierCode,
      );
      
      _user = response['user'];
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
  
  Future<void> register({
    String? email,
    String? phone,
    required String password,
    required String role,
    required String schoolCode,
    String? cashierCode,
  }) async {
    try {
      final response = await _apiService.register(
        email: email,
        phone: phone,
        password: password,
        role: role,
        schoolCode: schoolCode,
        cashierCode: cashierCode,
      );
      
      _user = response['user'];
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
  
  Future<void> logout() async {
    await _apiService.clearToken();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
