// This screen is intercepted by the tab listener in _layout.tsx
// (redirects to login or /products/new-mobile)
// This file is required for Expo Router to register the tab.
import { View, Text } from 'react-native';
export default function ListTab() {
  return <View />;
}
