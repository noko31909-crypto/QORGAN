from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from pathlib import Path
import functools
import os
import jwt
import re
import cv2
from collections import defaultdict
from threading import Lock

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BACKEND_DIR / 'instance'
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = BASE_DIR / 'models' / 'best.onnx'
DETECTION_IMAGES_DIR = BASE_DIR / 'data' / 'detection_images'
DB_PATH = INSTANCE_DIR / 'school_safety.db'

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-insecure-key-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_PATH}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
APP_ENV = os.getenv('APP_ENV', 'development').lower()
WS_API_KEY = os.getenv('WS_API_KEY', 'qorgan-demo-ws-key')
raw_cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if raw_cors_origins:
    ALLOWED_ORIGINS = [o.strip() for o in raw_cors_origins.split(',') if o.strip()]
elif APP_ENV == 'production':
    ALLOWED_ORIGINS = ['http://localhost:19006']
else:
    # In dev Expo web frequently changes port, so allow all origins unless explicitly configured.
    ALLOWED_ORIGINS = '*'

CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
socketio = SocketIO(app, cors_allowed_origins=ALLOWED_ORIGINS)
db = SQLAlchemy(app)

rate_lock = Lock()
request_buckets = defaultdict(list)


def rate_limit(limit: int, window_seconds: int):
    def decorator(fn):
        def wrapped(*args, **kwargs):
            key = f"{request.remote_addr}:{request.endpoint}"
            now = datetime.now(timezone.utc).timestamp()
            with rate_lock:
                timestamps = request_buckets[key]
                cutoff = now - window_seconds
                while timestamps and timestamps[0] < cutoff:
                    timestamps.pop(0)
                if len(timestamps) >= limit:
                    return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429
                timestamps.append(now)
            return fn(*args, **kwargs)

        wrapped = functools.wraps(fn)(wrapped)
        return wrapped

    return decorator


def validate_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ''))


def validate_phone(phone: str) -> bool:
    clean = re.sub(r'\s+', '', phone or '')
    return bool(re.match(r'^\+?[0-9\-()]{7,20}$', clean))

if app.config['SECRET_KEY'] == 'dev-insecure-key-change-me':
    print('WARNING: SECRET_KEY is using insecure default. Set SECRET_KEY env variable for production.')
if len(app.config['SECRET_KEY']) < 32:
    print('WARNING: SECRET_KEY length is below 32 chars. Use a longer key for HS256 safety.')
if APP_ENV == 'production' and (
    app.config['SECRET_KEY'] == 'dev-insecure-key-change-me' or len(app.config['SECRET_KEY']) < 32
):
    raise RuntimeError('In production, SECRET_KEY must be custom and at least 32 characters long.')

# Detection is optional in dev because some macOS Python/OpenCV builds crash on import.
ENABLE_DETECTION = os.getenv('ENABLE_DETECTION', '0') == '1'
DEMO_SEED = os.getenv('DEMO_SEED', '1') == '1'
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
    status = db.Column(db.String(20), default='new')  # new, acknowledged, resolved
    reported_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    is_false_positive = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class IncidentNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey('incident.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class IncidentAction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey('incident.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    from_status = db.Column(db.String(20), nullable=True)
    to_status = db.Column(db.String(20), nullable=False)
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


def get_current_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return None
    return db.session.get(User, user_id)


def serialize_incident(inc):
    return {
        'id': inc.id,
        'type': inc.type,
        'description': inc.description,
        'location': inc.location,
        'latitude': inc.latitude,
        'longitude': inc.longitude,
        'image_path': inc.image_path,
        'confidence': inc.confidence,
        'status': inc.status,
        'reported_by': inc.reported_by,
        'is_false_positive': bool(inc.is_false_positive),
        'created_at': inc.created_at.isoformat(),
    }


def seed_demo_data():
    if not DEMO_SEED:
        return
    if Incident.query.count() > 0:
        return

    guard = User.query.filter_by(email='demo.guard@qorgan.local').first()
    if not guard:
        guard = User(
            email='demo.guard@qorgan.local',
            password=generate_password_hash('DemoPass123'),
            role='guard',
            school_code='SCH-1234',
        )
        db.session.add(guard)
        db.session.commit()

    now = datetime.utcnow()
    seed_rows = [
        Incident(type='weapon_detected', description='Demo: knife-like object in hallway', location='Main Hall', confidence=0.86, status='acknowledged', created_at=now - timedelta(days=2), reported_by=guard.id),
        Incident(type='sos_alert', description='Demo: SOS test from mobile app', location='Classroom 8', status='resolved', created_at=now - timedelta(days=1), reported_by=guard.id),
        Incident(type='weapon_detected', description='Demo: possible threat near entrance', location='Main Entrance', confidence=0.91, status='new', created_at=now - timedelta(hours=3), reported_by=guard.id),
    ]
    db.session.add_all(seed_rows)
    db.session.commit()

    for inc in seed_rows:
        db.session.add(Notification(
            user_id=guard.id,
            title='Demo alert',
            message=f'{inc.type} at {inc.location}',
            type='alert',
            icon='warning',
            is_read=False,
            created_at=inc.created_at,
        ))
    db.session.commit()

# Authentication Helper
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
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
@rate_limit(limit=20, window_seconds=60)
def register():
    data = request.json or {}

    email = data.get('email')
    phone = data.get('phone')
    if not email and not phone:
        return jsonify({'error': 'Email or phone is required'}), 400
    if email and not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    if phone and not validate_phone(phone):
        return jsonify({'error': 'Invalid phone format'}), 400
    if not data.get('password') or not data.get('role') or not data.get('school_code'):
        return jsonify({'error': 'password, role and school_code are required'}), 400
    if len(data.get('password', '')) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if data.get('role') not in ('guard', 'student'):
        return jsonify({'error': 'Invalid role. Use guard or student'}), 400

    # Check if user exists by provided identity fields only
    existing_user = None
    if email:
        existing_user = User.query.filter_by(email=email).first()
    if not existing_user and phone:
        existing_user = User.query.filter_by(phone=phone).first()
    
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
@rate_limit(limit=30, window_seconds=60)
def login():
    data = request.json or {}
    if not data.get('password'):
        return jsonify({'error': 'password is required'}), 400
    
    # Find user
    user = None
    if data.get('email'):
        user = User.query.filter_by(email=data['email']).first()
    elif data.get('phone'):
        user = User.query.filter_by(phone=data['phone']).first()
    else:
        return jsonify({'error': 'email or phone is required'}), 400
    
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
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    cameras = Camera.query.filter_by(school_code=user.school_code, is_active=True).all()
    
    return jsonify([{
        'id': cam.id,
        'name': cam.name,
        'location': cam.location,
        'stream_url': cam.stream_url
    } for cam in cameras])


@app.route('/api/cameras', methods=['POST'])
@rate_limit(limit=60, window_seconds=60)
def create_camera():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user.role != 'guard':
        return jsonify({'error': 'Only guards can create cameras'}), 403

    payload = request.json or {}
    name = (payload.get('name') or '').strip()
    stream_url = (payload.get('stream_url') or '').strip()
    location = (payload.get('location') or '').strip() or None
    school_code = (payload.get('school_code') or '').strip()

    if not name or not stream_url or not school_code:
        return jsonify({'error': 'name, stream_url and school_code are required'}), 400

    if school_code != user.school_code:
        return jsonify({'error': 'school_code mismatch'}), 403

    camera = Camera(
        name=name,
        location=location,
        stream_url=stream_url,
        school_code=school_code,
        is_active=True,
    )
    db.session.add(camera)
    db.session.commit()

    return jsonify({
        'id': camera.id,
        'name': camera.name,
        'location': camera.location,
        'stream_url': camera.stream_url,
        'school_code': camera.school_code,
        'is_active': camera.is_active,
    }), 201


def _parse_camera_source(stream_url: str):
    source_text = (stream_url or '').strip()
    if source_text.isdigit():
        return int(source_text)
    return source_text


def _open_stream_with_fallback(stream_source):
    capture = cv2.VideoCapture(stream_source)
    if capture.isOpened():
        return capture, False

    fallback = BASE_DIR / 'data' / 'demo' / 'sample_school_video.mp4'
    fallback_capture = cv2.VideoCapture(str(fallback))
    if fallback_capture.isOpened():
        capture.release()
        return fallback_capture, True

    return capture, False


@app.route('/api/video-feed/<camera_id>')
def video_feed(camera_id):
    # Auth via query param because some WebView contexts cannot attach headers to image requests.
    token = request.args.get('token')
    user_id = verify_token(token) if token else None
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if not str(camera_id).isdigit():
        return jsonify({'error': 'Invalid camera id'}), 400

    camera = Camera.query.filter_by(id=int(camera_id), school_code=user.school_code).first()
    if not camera:
        return jsonify({'error': 'Camera not found'}), 404

    stream_source = _parse_camera_source(camera.stream_url or '')

    def generate_frames():
        capture, using_fallback = _open_stream_with_fallback(stream_source)

        try:
            if not capture.isOpened():
                return

            while True:
                ok_read, frame = capture.read()
                if not ok_read:
                    # Loop local demo video to provide deterministic output.
                    if using_fallback:
                        capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    break

                if ENABLE_DETECTION and detection_service is not None:
                    try:
                        detections = detection_service.detect_single_frame(frame)
                    except Exception:
                        detections = []

                    for det in detections:
                        bbox = det.get('bbox') or []
                        if len(bbox) != 4:
                            continue

                        x1, y1, x2, y2 = [int(v) for v in bbox]
                        label = det.get('class_name', 'weapon')
                        confidence_pct = int(round(float(det.get('confidence', 0.0)) * 100))
                        caption = f'{label} {confidence_pct}%'

                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(
                            frame,
                            caption,
                            (x1, max(y1 - 10, 20)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.55,
                            (0, 0, 255),
                            2,
                            cv2.LINE_AA,
                        )

                encoded, buffer = cv2.imencode('.jpg', frame)
                if not encoded:
                    continue

                frame_bytes = buffer.tobytes()
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
                )
        except (GeneratorExit, BrokenPipeError, ConnectionResetError):
            return
        finally:
            capture.release()

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/incidents', methods=['GET'])
@rate_limit(limit=120, window_seconds=60)
def get_incidents():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    status = request.args.get('status')
    limit = min(int(request.args.get('limit', 50)), 200)

    query = Incident.query.order_by(Incident.created_at.desc())
    if status:
        query = query.filter_by(status=status)

    incidents = query.limit(limit).all()
    return jsonify([serialize_incident(inc) for inc in incidents])


@app.route('/api/incidents/<int:incident_id>/status', methods=['PUT'])
@rate_limit(limit=120, window_seconds=60)
def update_incident_status(incident_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user.role != 'guard':
        return jsonify({'error': 'Only guards can update incident status'}), 403

    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    data = request.json or {}
    next_status = (data.get('status') or '').strip().lower()
    allowed = {'new', 'acknowledged', 'resolved'}
    if next_status not in allowed:
        return jsonify({'error': f'Invalid status. Allowed: {sorted(allowed)}'}), 400

    prev_status = incident.status
    if prev_status == next_status:
        return jsonify({'message': 'Status unchanged', 'incident': serialize_incident(incident)})

    incident.status = next_status
    db.session.add(IncidentAction(
        incident_id=incident.id,
        user_id=user.id,
        from_status=prev_status,
        to_status=next_status,
    ))
    db.session.commit()

    return jsonify({'message': 'Incident status updated', 'incident': serialize_incident(incident)})


@app.route('/api/incidents/<int:incident_id>/notes', methods=['GET', 'POST'])
@rate_limit(limit=120, window_seconds=60)
def incident_notes(incident_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    if request.method == 'GET':
        notes = IncidentNote.query.filter_by(incident_id=incident_id).order_by(IncidentNote.created_at.asc()).all()
        return jsonify([
            {
                'id': n.id,
                'incident_id': n.incident_id,
                'user_id': n.user_id,
                'note': n.note,
                'created_at': n.created_at.isoformat(),
            }
            for n in notes
        ])

    if user.role != 'guard':
        return jsonify({'error': 'Only guards can add notes'}), 403

    payload = request.json or {}
    note_text = (payload.get('note') or '').strip()
    if not note_text:
        return jsonify({'error': 'note is required'}), 400
    if len(note_text) > 1000:
        return jsonify({'error': 'note is too long (max 1000 chars)'}), 400

    note = IncidentNote(incident_id=incident_id, user_id=user.id, note=note_text)
    db.session.add(note)
    db.session.commit()
    return jsonify({'message': 'Note added', 'note_id': note.id}), 201


@app.route('/api/incidents/<int:incident_id>/false-positive', methods=['PUT'])
@rate_limit(limit=120, window_seconds=60)
def mark_false_positive(incident_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user.role != 'guard':
        return jsonify({'error': 'Only guards can mark false positives'}), 403

    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    payload = request.json or {}
    value = bool(payload.get('is_false_positive', True))
    incident.is_false_positive = value
    db.session.commit()
    return jsonify({'message': 'Incident false-positive flag updated', 'incident': serialize_incident(incident)})


@app.route('/api/incidents/<int:incident_id>/timeline', methods=['GET'])
def get_incident_timeline(incident_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    incident = db.session.get(Incident, incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404

    actions = IncidentAction.query.filter_by(incident_id=incident_id).order_by(IncidentAction.created_at.asc()).all()
    return jsonify({
        'incident': serialize_incident(incident),
        'actions': [{
            'id': action.id,
            'incident_id': action.incident_id,
            'user_id': action.user_id,
            'from_status': action.from_status,
            'to_status': action.to_status,
            'created_at': action.created_at.isoformat(),
        } for action in actions]
    })

@app.route('/api/incidents/sos', methods=['POST'])
@rate_limit(limit=60, window_seconds=60)
def create_sos():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    
    incident = Incident(
        type='sos_alert',
        description=data.get('description', 'SOS Alert'),
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        reported_by=user.id,
        status='new'
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
@rate_limit(limit=120, window_seconds=60)
def get_notifications():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    notifications = Notification.query.filter_by(user_id=user.id).order_by(
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

@app.route('/api/images/<int:incident_id>', methods=['GET'])
def get_incident_image(incident_id):
    """Serve saved detection image for a weapon incident."""
    incident = db.session.get(Incident, incident_id)
    if not incident or not incident.image_path:
        return jsonify({'error': 'Image not found'}), 404

    image_path = Path(incident.image_path)
    if not image_path.is_absolute():
        image_path = (BASE_DIR / image_path).resolve()

    try:
        image_path.relative_to(BASE_DIR.resolve())
    except ValueError:
        return jsonify({'error': 'Invalid image path'}), 400

    if not image_path.exists() or not image_path.is_file():
        return jsonify({'error': 'Image not found'}), 404

    return send_file(str(image_path))

@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
@rate_limit(limit=120, window_seconds=60)
def mark_notification_read(notif_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    notification = db.session.get(Notification, notif_id)
    if notification and notification.user_id == user.id:
        notification.is_read = True
        db.session.commit()
        return jsonify({'message': 'Notification marked as read'})
    
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/health', methods=['GET'])
def health():
    """Server health check endpoint (for scripts and tests)."""
    key_len = len(app.config['SECRET_KEY'])
    return jsonify({
        'status': 'ok',
        'message': 'School Safety API is running',
        'env': APP_ENV,
        'security': {
            'secret_key_configured': app.config['SECRET_KEY'] != 'dev-insecure-key-change-me',
            'secret_key_length': key_len,
            'secret_key_strong': key_len >= 32,
        }
    })


@app.route('/api/metrics/summary', methods=['GET'])
@rate_limit(limit=120, window_seconds=60)
def metrics_summary():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    total_incidents = Incident.query.count()
    open_incidents = Incident.query.filter(Incident.status.in_(['active', 'new', 'acknowledged'])).count()
    resolved_incidents = Incident.query.filter_by(status='resolved').count()
    weapon_incidents = Incident.query.filter_by(type='weapon_detected').count()
    sos_incidents = Incident.query.filter_by(type='sos_alert').count()

    user_notifications_total = Notification.query.filter_by(user_id=user.id).count()
    user_notifications_unread = Notification.query.filter_by(user_id=user.id, is_read=False).count()

    ack_actions = IncidentAction.query.filter_by(to_status='acknowledged').all()
    ack_latencies = []
    for action in ack_actions:
        incident = db.session.get(Incident, action.incident_id)
        if incident and incident.created_at and action.created_at:
            ack_latencies.append((action.created_at - incident.created_at).total_seconds())

    ack_avg_seconds = round(sum(ack_latencies) / len(ack_latencies), 2) if ack_latencies else None
    ack_p95_seconds = None
    if ack_latencies:
        sorted_latencies = sorted(ack_latencies)
        p95_index = max(0, int(len(sorted_latencies) * 0.95) - 1)
        ack_p95_seconds = round(sorted_latencies[p95_index], 2)

    false_positives = Incident.query.filter_by(is_false_positive=True).count()
    false_positive_rate = round((false_positives / total_incidents) * 100, 2) if total_incidents else 0.0

    return jsonify({
        'incidents': {
            'total': total_incidents,
            'open': open_incidents,
            'resolved': resolved_incidents,
            'weapon_detected': weapon_incidents,
            'sos_alert': sos_incidents,
            'false_positives': false_positives,
            'false_positive_rate_pct': false_positive_rate,
        },
        'notifications': {
            'total': user_notifications_total,
            'unread': user_notifications_unread,
        },
        'response': {
            'ack_count': len(ack_latencies),
            'ack_avg_seconds': ack_avg_seconds,
            'ack_p95_seconds': ack_p95_seconds,
        }
    })


@app.route('/api/metrics/trends', methods=['GET'])
@rate_limit(limit=120, window_seconds=60)
def metrics_trends():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    days = min(max(int(request.args.get('days', 7)), 1), 30)
    now = datetime.utcnow()

    series = []
    for d in range(days - 1, -1, -1):
        day_start = datetime(now.year, now.month, now.day) - timedelta(days=d)
        day_end = day_start + timedelta(days=1)
        incidents = Incident.query.filter(Incident.created_at >= day_start, Incident.created_at < day_end).all()
        total = len(incidents)
        false_pos = len([i for i in incidents if i.is_false_positive])
        series.append({
            'date': day_start.date().isoformat(),
            'total_detections': total,
            'false_positives': false_pos,
            'false_positive_rate_pct': round((false_pos / total) * 100, 2) if total else 0.0,
        })

    return jsonify({'days': days, 'series': series})

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
    supplied_key = request.headers.get('X-API-Key') or request.args.get('apiKey')
    if supplied_key != WS_API_KEY:
        return False
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
    """Test endpoint to simulate weapon detection."""
    data = request.get_json() or {}
    
    # Create a test incident
    incident = Incident(
        type='weapon_detected',
        description=data.get('description', 'Test: Knife detected'),
        location=data.get('location', 'Test Camera - Main Hall'),
        confidence=data.get('confidence', 0.95),
        status='new'
    )
    
    db.session.add(incident)
    db.session.commit()
    
    # Send a WebSocket alert to all connected clients
    socketio.emit('weapon_alert', {
        'id': incident.id,
        'type': incident.type,
        'description': incident.description,
        'location': incident.location,
        'confidence': incident.confidence,
        'time': incident.created_at.isoformat()
    }, namespace='/')
    
    # Create notifications for all guards
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

    # Lightweight SQLite migration for demo compatibility.
    cols = {c[1] for c in db.session.execute(db.text("PRAGMA table_info('incident')")).fetchall()}
    if 'is_false_positive' not in cols:
        db.session.execute(db.text("ALTER TABLE incident ADD COLUMN is_false_positive BOOLEAN DEFAULT 0"))
        db.session.commit()

    seed_demo_data()
    
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
