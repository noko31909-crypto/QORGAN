import 'package:flutter/material.dart';

class FirstAidScreen extends StatelessWidget {
  final List<Map<String, dynamic>> _firstAidGuides = [
    {
      'title': 'Control Bleeding',
      'description': 'Apply direct pressure with clean cloth',
      'icon': Icons.bloodtype,
      'color': Colors.red,
    },
    {
      'title': 'Dog Bite',
      'description': 'Wash wound, apply pressure, seek medical help',
      'icon': Icons.pets,
      'color': Colors.orange,
    },
    {
      'title': 'Seizures',
      'description': 'Clear area, protect head, time the seizure',
      'icon': Icons.healing,
      'color': Colors.purple,
    },
    {
      'title': 'SCOT',
      'description': 'Stop, Check, Observe, Treat',
      'icon': Icons.search,
      'color': Colors.green,
    },
    {
      'title': 'CPR (Heart Beating Stop)',
      'description': '30 compressions, 2 breaths, repeat',
      'icon': Icons.favorite,
      'color': Colors.pink,
    },
    {
      'title': 'Choking',
      'description': '5 back blows, 5 abdominal thrusts',
      'icon': Icons.air,
      'color': Colors.blue,
    },
  ];
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF7B2CBF),
      appBar: AppBar(
        backgroundColor: Color(0xFF7B2CBF),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Color(0xFFFFC107)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('First Aid', style: TextStyle(color: Color(0xFFFFC107))),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications, color: Color(0xFFFFC107)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Use the following guides to help someone in',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFFFFC107),
                  ),
                ),
                Text(
                  'case of an emergency!',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFFFFC107),
                  ),
                ),
                SizedBox(height: 16),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: Colors.white),
                      SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          style: TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'Search a symptom/procedure',
                            hintStyle: TextStyle(color: Colors.white70),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      Icon(Icons.mic, color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
              ),
              child: ListView.builder(
                padding: EdgeInsets.all(20),
                itemCount: _firstAidGuides.length,
                itemBuilder: (context, index) {
                  final guide = _firstAidGuides[index];
                  return Container(
                    margin: EdgeInsets.only(bottom: 12),
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          _showGuideDetails(context, guide);
                        },
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: guide['color'].withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  guide['icon'],
                                  color: guide['color'],
                                  size: 32,
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      guide['title'],
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      guide['description'],
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.arrow_forward_ios, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  void _showGuideDetails(BuildContext context, Map<String, dynamic> guide) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: guide['color'].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    guide['icon'],
                    color: guide['color'],
                    size: 40,
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Text(
                    guide['title'],
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            Text(
              'Steps to follow:',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  guide['description'] +
                      '\n\n' +
                      'Detailed instructions would be displayed here with step-by-step guidance for emergency response.',
                  style: TextStyle(fontSize: 16, height: 1.5),
                ),
              ),
            ),
            SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF7B2CBF),
                ),
                child: Text('Got it', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
