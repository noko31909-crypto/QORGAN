import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/api_service.dart';

class SOSScreen extends StatefulWidget {
  @override
  _SOSScreenState createState() => _SOSScreenState();
}

class _SOSScreenState extends State<SOSScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  bool _isPressed = false;
  bool _isSending = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  
  bool _locationSharing = true;
  bool _deviceEmergency = true;
  bool _instantHelp = true;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }
  
  Future<void> _sendSOS() async {
    if (_isSending) return;
    
    setState(() => _isSending = true);
    
    try {
      // Get location
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition();
      } catch (e) {
        print('Location error: $e');
      }
      
      await _apiService.sendSOS(
        description: 'Emergency SOS Alert',
        location: 'Current Location',
        latitude: position?.latitude,
        longitude: position?.longitude,
      );
      
      // Show success
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.green,
          title: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('SOS Sent!', style: TextStyle(color: Colors.white)),
            ],
          ),
          content: Text(
            'Emergency services have been notified. Help is on the way!',
            style: TextStyle(color: Colors.white),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send SOS: $e')),
      );
    } finally {
      setState(() => _isSending = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF7B2CBF),
      appBar: AppBar(
        backgroundColor: Color(0xFF7B2CBF),
        elevation: 0,
        title: Text('SOS', style: TextStyle(color: Color(0xFFFFC107))),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications, color: Color(0xFFFFC107)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'We are always here, in case of emergencies!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      color: Color(0xFFFFC107),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Tap to initiate emergency protocol',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                  SizedBox(height: 60),
                  
                  // SOS Button
                  GestureDetector(
                    onTapDown: (_) => setState(() => _isPressed = true),
                    onTapUp: (_) {
                      setState(() => _isPressed = false);
                      _sendSOS();
                    },
                    onTapCancel: () => setState(() => _isPressed = false),
                    child: AnimatedBuilder(
                      animation: _scaleAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _isPressed ? 0.9 : _scaleAnimation.value,
                          child: Container(
                            width: 200,
                            height: 200,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  Colors.red[400]!,
                                  Colors.red[700]!,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red.withOpacity(0.5),
                                  blurRadius: 30,
                                  spreadRadius: 10,
                                ),
                              ],
                            ),
                            child: Center(
                              child: _isSending
                                  ? CircularProgressIndicator(color: Colors.white)
                                  : Icon(
                                      Icons.notifications_active,
                                      size: 80,
                                      color: Colors.white,
                                    ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  
                  SizedBox(height: 40),
                  
                  if (!_isSending)
                    Text(
                      'Hold to activate SOS',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
          
          // Control Panel
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Color(0xFF6A1BA2),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(30),
                topRight: Radius.circular(30),
              ),
            ),
            child: Column(
              children: [
                _buildToggleButton(
                  icon: Icons.my_location,
                  label: 'Location sharing',
                  value: _locationSharing,
                  onChanged: (val) => setState(() => _locationSharing = val),
                ),
                SizedBox(height: 12),
                _buildToggleButton(
                  icon: Icons.phonelink_ring,
                  label: 'Device emergency',
                  value: _deviceEmergency,
                  onChanged: (val) => setState(() => _deviceEmergency = val),
                ),
                SizedBox(height: 12),
                _buildToggleButton(
                  icon: Icons.flash_on,
                  label: 'Instantly helping',
                  value: _instantHelp,
                  onChanged: (val) => setState(() => _instantHelp = val),
                ),
                SizedBox(height: 20),
                
                // Emergency Contacts
                Row(
                  children: [
                    Expanded(
                      child: _buildEmergencyButton(
                        icon: Icons.local_hospital,
                        label: 'Ambulance: 911',
                        color: Colors.red[400]!,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: _buildEmergencyButton(
                        icon: Icons.local_police,
                        label: 'Police: 100',
                        color: Colors.blue[400]!,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildToggleButton({
    required IconData icon,
    required String label,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Color(0xFF7B2CBF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.green,
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyButton({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 32),
          SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}
