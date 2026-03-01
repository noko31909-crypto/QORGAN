import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }
  
  Future<void> _loadNotifications() async {
    try {
      final notifications = await _apiService.getNotifications();
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading notifications: $e');
      setState(() => _isLoading = false);
    }
  }
  
  IconData _getIconForType(String type) {
    switch (type) {
      case 'reminder':
        return Icons.notifications;
      case 'alert':
        return Icons.warning;
      case 'update':
        return Icons.star;
      case 'transaction':
        return Icons.attach_money;
      default:
        return Icons.info;
    }
  }
  
  Color _getColorForType(String type) {
    switch (type) {
      case 'reminder':
        return Colors.amber;
      case 'alert':
        return Colors.red;
      case 'update':
        return Colors.blue;
      case 'transaction':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
  
  String _groupByDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final yesterday = today.subtract(Duration(days: 1));
      final notifDate = DateTime(date.year, date.month, date.day);
      
      if (notifDate == today) {
        return 'Today';
      } else if (notifDate == yesterday) {
        return 'Yesterday';
      } else if (notifDate.isAfter(today.subtract(Duration(days: 7)))) {
        return 'This Week';
      } else {
        return 'Earlier';
      }
    } catch (e) {
      return 'Unknown';
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF7B2CBF),
      appBar: AppBar(
        backgroundColor: Color(0xFF7B2CBF),
        elevation: 0,
        title: Text('Notification', style: TextStyle(color: Color(0xFFFFC107))),
        actions: [
          IconButton(
            icon: Icon(Icons.more_vert, color: Color(0xFFFFC107)),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Colors.white))
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No notifications',
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : Container(
                  margin: EdgeInsets.only(top: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(30),
                      topRight: Radius.circular(30),
                    ),
                  ),
                  child: ListView.separated(
                    padding: EdgeInsets.all(20),
                    itemCount: _notifications.length,
                    separatorBuilder: (context, index) => Divider(),
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      final type = notification['type'] ?? 'info';
                      final icon = _getIconForType(type);
                      final color = _getColorForType(type);
                      
                      // Show date header
                      bool showDateHeader = false;
                      String dateGroup = '';
                      if (index == 0 ||
                          _groupByDate(_notifications[index]['created_at']) !=
                              _groupByDate(_notifications[index - 1]['created_at'])) {
                        showDateHeader = true;
                        dateGroup = _groupByDate(notification['created_at']);
                      }
                      
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (showDateHeader) ...[
                            Padding(
                              padding: EdgeInsets.only(top: 8, bottom: 16),
                              child: Text(
                                dateGroup,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                            ),
                          ],
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(icon, color: color),
                            ),
                            title: Text(
                              notification['title'],
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SizedBox(height: 4),
                                Text(
                                  notification['message'],
                                  style: TextStyle(fontSize: 12),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  _formatTime(notification['created_at']),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                            trailing: !notification['is_read']
                                ? Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: color,
                                      shape: BoxShape.circle,
                                    ),
                                  )
                                : null,
                            onTap: () async {
                              if (!notification['is_read']) {
                                await _apiService.markNotificationRead(notification['id']);
                                _loadNotifications();
                              }
                            },
                          ),
                        ],
                      );
                    },
                  ),
                ),
    );
  }
  
  String _formatTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('HH:mm - MMM dd').format(date);
    } catch (e) {
      return '';
    }
  }
}
