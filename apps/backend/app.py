from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from pathlib import Path
import os
import jwt

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BACKEND_DIR / 'instance'
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = BASE_DIR / 'models' / 'best.onnx'
DETECTION_IMAGES_DIR = BASE_DIR / 'data' / 'detection_images'
DB_PATH = INSTANCE_DIR / 'school_safety.db'

app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_PATH}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
db = SQLAlchemy(app)

# Detection is optional in dev because some macOS Python/OpenCV builds crash on import.
ENABLE_DETECTION = os.getenv('ENABLE_DETECTION', '0') == '1'
detection_service = None
if ENABLE_DETECTION:
    from detection_service import DetectionService
    detection_service = DetectionService(
        model_path=str(MODEL_PATH),
        save_dir=str(DETECTION_IMAGES_DIR)
    )

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'guard' or 'student'
    school_code = db.Column(db.String(50), nullable=False)
    cashier_code = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # 'weapon_detected', 'sos_alert'
    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_path = db.Column(db.String(255))
    confidence = db.Column(db.Float)
    status = db.Column(db.String(20), default='active')  # active, resolved
    reported_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50))  # 'reminder', 'update', 'alert', 'transaction'
    icon = db.Column(db.String(50))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Camera(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255))
    stream_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    school_code = db.Column(db.String(50), nullable=False)

# Authentication Helper
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user exists
    existing_user = User.query.filter(
        (User.email == data.get('email')) | (User.phone == data.get('phone'))
    ).first()
    
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    # Create new user
    user = User(
        email=data.get('email'),
        phone=data.get('phone'),
        password=generate_password_hash(data['password']),
        role=data['role'],
        school_code=data['school_code'],
        cashier_code=data.get('cashier_code')
    )
    
    db.session.add(user)
    db.session.commit()
    
    token = generate_token(user.id)
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'phone': user.phone,
            'role': user.role
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    # Find user
    user = None
    if 'email' in data:
        user = User.query.filter_by(email=data['email']).first()
    elif 'phone' in data:
        user = User.query.filter_by(phone=data['phone']).first()
    
    if data.get('school_code'):
        user = user if user and user.school_code == data['school_code'] else None
    
    if data.get('cashier_code'):
        user = user if user and user.cashier_code == data['cashier_code'] else None
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'phone': user.phone,
            'role': user.role
        }
    })

@app.route('/api/cameras', methods=['GET'])
def get_cameras():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    cameras = Camera.query.filter_by(school_code=user.school_code, is_active=True).all()
    
    return jsonify([{
        'id': cam.id,
        'name': cam.name,
        'location': cam.location,
        'stream_url': cam.stream_url
    } for cam in cameras])

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    incidents = Incident.query.order_by(Incident.created_at.desc()).limit(50).all()
    
    return jsonify([{
        'id': inc.id,
        'type': inc.type,
        'description': inc.description,
        'location': inc.location,
        'latitude': inc.latitude,
        'longitude': inc.longitude,
        'image_path': inc.image_path,
        'confidence': inc.confidence,
        'status': inc.status,
        'created_at': inc.created_at.isoformat()
    } for inc in incidents])

@app.route('/api/incidents/sos', methods=['POST'])
def create_sos():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    
    incident = Incident(
        type='sos_alert',
        description=data.get('description', 'SOS Alert'),
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        reported_by=user_id
    )
    
    db.session.add(incident)
    db.session.commit()
    
    # Send real-time notification to all guards
    socketio.emit('sos_alert', {
        'id': incident.id,
        'location': incident.location,
        'latitude': incident.latitude,
        'longitude': incident.longitude,
        'time': incident.created_at.isoformat()
    }, namespace='/')
    
    return jsonify({'message': 'SOS alert sent', 'incident_id': incident.id}), 201

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    notifications = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).all()
    
    return jsonify([{
        'id': notif.id,
        'title': notif.title,
        'message': notif.message,
        'type': notif.type,
        'icon': notif.icon,
        'is_read': notif.is_read,
        'created_at': notif.created_at.isoformat()
    } for notif in notifications])

@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
def mark_notification_read(notif_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification = Notification.query.get(notif_id)
    if notification and notification.user_id == user_id:
        notification.is_read = True
        db.session.commit()
        return jsonify({'message': 'Notification marked as read'})
    
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/health', methods=['GET'])
def health():
    """Проверка работы сервера (для скриптов и тестов)."""
    return jsonify({
        'status': 'ok',
        'message': 'School Safety API is running',
    })

@app.route('/api/detection/status', methods=['GET'])
def detection_status():
    return jsonify({
        'enabled': ENABLE_DETECTION and detection_service is not None,
        'is_running': detection_service.is_running if detection_service else False,
        'detections_count': len(detection_service.recent_detections) if detection_service else 0
    })

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('subscribe_camera')
def handle_subscribe_camera(data):
    camera_id = data.get('camera_id')
    print(f'Client subscribed to camera {camera_id}')

# Detection callback (runs in detection thread — must use app context)
def on_weapon_detected(detection_data):
    """Called when weapon is detected"""
    with app.app_context():
        # Save to database
        incident = Incident(
            type='weapon_detected',
            description=f"{detection_data['class_name']} detected",
            location=detection_data.get('camera_location'),
            confidence=detection_data['confidence'],
            image_path=detection_data.get('image_path')
        )
        db.session.add(incident)
        db.session.commit()

        # Send real-time alert
        socketio.emit('weapon_alert', {
            'id': incident.id,
            'class_name': detection_data['class_name'],
            'confidence': detection_data['confidence'],
            'location': detection_data.get('camera_location'),
            'image_url': f'/api/images/{incident.id}',
            'time': incident.created_at.isoformat()
        }, namespace='/')

        # Create notifications for all guards
        guards = User.query.filter_by(role='guard').all()
        for guard in guards:
            notification = Notification(
                user_id=guard.id,
                title='Weapon detected',
                message=f"{detection_data['class_name']} detected with {detection_data['confidence']:.0%} confidence",
                type='alert',
                icon='warning'
            )
            db.session.add(notification)
        db.session.commit()

# Test endpoint to simulate weapon detection
@app.route('/api/test/simulate-weapon-alert', methods=['POST'])
def simulate_weapon_alert():
    """Тестовый endpoint для симуляции обнаружения оружия"""
    data = request.get_json()
    
    # Создаём тестовый инцидент
    incident = Incident(
        type='weapon_detected',
        description=data.get('description', 'Test: Knife detected'),
        location=data.get('location', 'Test Camera - Main Hall'),
        confidence=data.get('confidence', 0.95),
        status='active'
    )
    
    db.session.add(incident)
    db.session.commit()
    
    # Отправляем WebSocket уведомление всем подключенным клиентам
    socketio.emit('weapon_alert', {
        'id': incident.id,
        'type': incident.type,
        'description': incident.description,
        'location': incident.location,
        'confidence': incident.confidence,
        'time': incident.created_at.isoformat()
    }, namespace='/')
    
    # Создаём уведомления для всех охранников
    guards = User.query.filter_by(role='guard').all()
    for guard in guards:
        notification = Notification(
            user_id=guard.id,
            title='Weapon detected',
            message=f'Detected at {incident.location}',
            type='weapon_alert',
            icon='warning',
            is_read=False
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Test weapon alert sent successfully',
        'incident_id': incident.id,
        'guards_notified': len(guards)
    }), 201

# Set detection callback
if detection_service is not None:
    detection_service.set_detection_callback(on_weapon_detected)

# Initialize database and optionally start detection on cameras
with app.app_context():
    db.create_all()
    
    # Create default camera if none exist
    if Camera.query.count() == 0:
        default_camera = Camera(
            name='Main Entrance Camera',
            location='Main Entrance',
            stream_url='0',  # webcam
            school_code='SCH-1234'
        )
        db.session.add(default_camera)
        db.session.commit()
    
    # Start weapon/knife detection on all active cameras (so app receives notifications)
    if detection_service is not None:
        try:
            cameras = Camera.query.filter_by(is_active=True).all()
            for cam in cameras:
                source = int(cam.stream_url) if cam.stream_url and cam.stream_url.isdigit() else cam.stream_url or 0
                detection_service.start_camera_detection(
                    camera_id=str(cam.id),
                    camera_source=source,
                    camera_location=cam.location or cam.name or 'Unknown'
                )
            if cameras:
                print(f'Detection started on {len(cameras)} camera(s)')
        except Exception as e:
            print(f'Detection auto-start skipped (model/camera not available): {e}')
    else:
        print('Detection disabled (set ENABLE_DETECTION=1 to enable).')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)
