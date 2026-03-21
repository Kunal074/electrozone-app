import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import api from './src/lib/api';

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    Alert.alert('❌', 'Physical device chahiye!');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('❌', 'Notification permission nahi mili!');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '0dfad27a-f641-490c-a976-365c7ab170c0',
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name:       'default',
        importance: Notifications.AndroidImportance.MAX,
        sound:      true,
      });
    }

    Alert.alert('✅ Token Mila!', token.data);
    return token.data;

  } catch (err) {
    // Full error details
    Alert.alert('❌ Token Error', 
      `Message: ${err.message}\n\nCode: ${err.code}\n\nFull: ${JSON.stringify(err)}`
    );
    return null;
  }
}

export default function App() {
  const notificationListener = useRef();
  const responseListener     = useRef();

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        api.post('/notifications/register-token', { token })
           .then(() => Alert.alert('✅ Saved!', 'Token server pe save ho gaya!'))
           .catch(e => Alert.alert('❌ Server Error', e.message));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}