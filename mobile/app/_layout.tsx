import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="products/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout/[orderId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="my/order/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}
