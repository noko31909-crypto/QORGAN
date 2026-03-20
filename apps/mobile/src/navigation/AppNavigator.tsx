import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useThreat } from '../context/ThreatContext';
import { socketService } from '../services/socket';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SosScreen } from '../screens/SosScreen';
import { MapScreen } from '../screens/MapScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SchoolSafetyScreen } from '../screens/SchoolSafetyScreen';
import { FirstAidScreen } from '../screens/FirstAidScreen';
import { LessonsScreen } from '../screens/LessonsScreen';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: '#4B4B55',
        tabBarStyle: { height: 62, backgroundColor: '#FFFFFF' },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11, marginBottom: 6 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Live: 'view-grid-outline',
            SOS: 'shield-alert-outline',
            Medic: 'medical-bag',
            Vehicle: 'car-outline',
            Home: 'home-outline',
          };
          return <MaterialCommunityIcons name={iconMap[route.name] || 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Live" component={HomeScreen} />
      <Tab.Screen name="SOS" component={SosScreen} />
      <Tab.Screen name="Medic" component={FirstAidScreen} />
      <Tab.Screen name="Vehicle" component={NotificationsScreen} />
      <Tab.Screen name="Home" component={MapScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user } = useAuth();
  const { setThreat } = useThreat();

  useEffect(() => {
    const unsubscribe = socketService.onWeaponAlert((data) => {
      setThreat(data);
      Alert.alert('Weapon detected', `${data.class_name || 'Threat'} at ${data.location || 'Unknown'}`);
    });
    return () => unsubscribe();
  }, [setThreat]);

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: Colors.primary }, headerTintColor: 'white', headerTitleStyle: { fontWeight: '700' } }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="SchoolSafety" component={SchoolSafetyScreen} />
          <Stack.Screen name="FirstAid" component={FirstAidScreen} />
          <Stack.Screen name="Lessons" component={LessonsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
