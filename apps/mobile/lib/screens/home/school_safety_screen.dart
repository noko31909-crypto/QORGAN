import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';

class SchoolSafetyScreen extends StatefulWidget {
  @override
  _SchoolSafetyScreenState createState() => _SchoolSafetyScreenState();
}

class _SchoolSafetyScreenState extends State<SchoolSafetyScreen> {
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();
  
  List<dynamic> _cameras = [];
  List<dynamic> _recentIncidents = [];
  bool _isLoading = true;
  
  bool _locationTracking = false;
  bool _deviceEmergency = true;
  bool _instantHelp = true;
  
  @override
  void initState() {
    super.initState();
    _loadData();
    _connectSocket();
  }
  
  Future<void> _loadData() async {
    try {
      final cameras = await _apiService.getCameras();
      final incidents = await _apiService.getIncidents();
      
      setState(() {
        _cameras = cameras;
        _recentIncidents = incidents.take(5).toList();
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading data: $e');
      setState(() => _isLoading = false);
    }
  }
  
  void _connectSocket() {
    _socketService.connect();
    _socketService.onWeaponAlert = (data) {
      _showWeaponAlert(data);
      _loadData(); // Refresh incidents
    };
  }
  
  void _showWeaponAlert(Map<String, dynamic> data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.red,
        title: Row(
          children: [
            Icon(Icons.warning, color: Colors.white, size: 32),
            SizedBox(width: 12),
            Text(
              '🚨 WEAPON DETECTED',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
        content: Text(
          '${data['class_name']} detected\n'
          'Confidence: ${(data['confidence'] * 100).toStringAsFixed(1)}%\n'
          'Location: ${data['location'] ?? 'Unknown'}',
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
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF7B2CBF),
      appBar: AppBar(
        backgroundColor: Color(0xFF7B2CBF),
        elevation: 0,
        title: Text('School Safety', style: TextStyle(color: Color(0xFFFFC107))),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications, color: Color(0xFFFFC107)),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Colors.white))
          : Column(
              children: [
                // Camera Preview Section
                Expanded(
                  flex: 2,
                  child: Container(
                    margin: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: _cameras.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.videocam_off, size: 64, color: Colors.grey),
                                SizedBox(height: 16),
                                Text(
                                  'No cameras available',
                                  style: TextStyle(fontSize: 16, color: Colors.grey),
                                ),
                              ],
                            ),
                          )
                        : ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Stack(
                              children: [
                                // Placeholder for camera feed
                                Container(
                                  color: Colors.black,
                                  child: Center(
                                    child: Icon(
                                      Icons.videocam,
                                      size: 100,
                                      color: Colors.white54,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 16,
                                  left: 16,
                                  child: Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(Icons.fiber_manual_record,
                                            color: Colors.white, size: 12),
                                        SizedBox(width: 6),
                                        Text(
                                          'LIVE',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
                        value: _locationTracking,
                        onChanged: (val) =>
                            setState(() => _locationTracking = val),
                      ),
                      SizedBox(height: 12),
                      _buildToggleButton(
                        icon: Icons.phonelink_ring,
                        label: 'Device emergency',
                        value: _deviceEmergency,
                        onChanged: (val) =>
                            setState(() => _deviceEmergency = val),
                      ),
                      SizedBox(height: 12),
                      _buildToggleButton(
                        icon: Icons.flash_on,
                        label: 'Instantly helping',
                        value: _instantHelp,
                        onChanged: (val) =>
                            setState(() => _instantHelp = val),
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
                      SizedBox(height: 12),
                      
                      // Safe Scale Indicator
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green[400],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle, color: Colors.white),
                            SizedBox(width: 8),
                            Text(
                              'Safe scale 95%',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 12),
                      
                      // Strange Activity Alert
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Color(0xFF9D4EDD),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded,
                                color: Color(0xFFFFC107)),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                '⚡ 2 strange',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
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
    _socketService.disconnect();
    super.dispose();
  }
}
