import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThreatProvider, useThreat } from './context/ThreatContext';
import { socketService } from './services/socket';
import { BottomNav } from './components/BottomNav';
import { SplashPage } from './pages/SplashPage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { SosPage } from './pages/SosPage';
import { MapPage } from './pages/MapPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SchoolSafetyPage } from './pages/SchoolSafetyPage';
import { FirstAidPage } from './pages/FirstAidPage';
import { LessonsPage } from './pages/LessonsPage';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();
  const { setThreat } = useThreat();

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      return;
    }
    const unsubWeapon = socketService.onWeaponAlert((data) => {
      setThreat(data);
      alert(`Weapon detected: ${data.class_name || 'Threat'} at ${data.location || 'Unknown'}`);
    });
    const unsubSos = socketService.onSosAlert((data) => {
      alert(`SOS alert: Emergency reported at ${data.location || 'Unknown location'}`);
    });
    return () => { unsubWeapon(); unsubSos(); };
  }, [user, setThreat]);

  if (!user) {
    return (
      <div className="app-shell">
        <div className="page-area">
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-area">
        <Routes>
          <Route path="/safety" element={<SchoolSafetyPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/sos" element={<SosPage />} />
          <Route path="/first-aid" element={<FirstAidPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="*" element={<Navigate to="/safety" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThreatProvider>
          <AppRoutes />
        </ThreatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
