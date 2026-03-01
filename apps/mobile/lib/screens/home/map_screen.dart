import 'package:flutter/material.dart';

class MapScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF7B2CBF),
      appBar: AppBar(
        backgroundColor: Color(0xFF7B2CBF),
        elevation: 0,
        title: Text('Map', style: TextStyle(color: Color(0xFFFFC107))),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list, color: Color(0xFFFFC107)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Map Container
          Expanded(
            child: Container(
              margin: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  children: [
                    // Placeholder for actual map
                    Container(
                      color: Colors.grey[200],
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.map, size: 80, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'School Map',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey[600],
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Safe zones and emergency exits',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Legend
                    Positioned(
                      top: 16,
                      right: 16,
                      child: Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLegendItem(
                              Colors.green,
                              'Safe Zone',
                            ),
                            SizedBox(height: 8),
                            _buildLegendItem(
                              Colors.red,
                              'Danger',
                            ),
                            SizedBox(height: 8),
                            _buildLegendItem(
                              Colors.blue,
                              'Exit',
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
          
          // Alerts Panel
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
                _buildAlert(
                  icon: Icons.security,
                  title: 'Oran-free alerts',
                  subtitle: '',
                  iconColor: Colors.orange,
                ),
                SizedBox(height: 12),
                _buildAlert(
                  icon: Icons.battery_alert,
                  title: 'Verify if the battery is properly connected',
                  subtitle: 'and not drained',
                  iconColor: Colors.amber,
                ),
                SizedBox(height: 12),
                _buildAlert(
                  icon: Icons.insights,
                  title: 'Activate your insights to alert other',
                  subtitle: 'drivers of your blueprint',
                  iconColor: Colors.green,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(fontSize: 12),
        ),
      ],
    );
  }
  
  Widget _buildAlert({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color iconColor,
  }) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFF7B2CBF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (subtitle.isNotEmpty)
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
