import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/auth';

function TabIcon({ name, focused, primary }: { name: string; focused: boolean; primary?: boolean }) {
  const icons: Record<string, string> = {
    index: focused ? '⌂' : '⌂',
    explore: '◎',
    list: '+',
    messages: '💬',
    me: '👤',
  };
  if (primary) {
    return (
      <View style={styles.plusWrap}>
        <Text style={styles.plusIcon}>+</Text>
      </View>
    );
  }
  return (
    <Text style={{ fontSize: 20, color: focused ? Colors.pink600 : Colors.ink400 }}>
      {icons[name] ?? '·'}
    </Text>
  );
}

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: Colors.pink600,
        tabBarInactiveTintColor: Colors.ink400,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '探索',
          tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: '出租',
          tabBarIcon: () => <TabIcon name="list" focused={false} primary />,
          tabBarLabel: () => <Text style={[styles.label, { color: Colors.pink600 }]}>出租</Text>,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (!user) {
              router.push('/login');
            } else {
              router.push('/products/new-mobile');
            }
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '訊息',
          tabBarIcon: ({ focused }) => <TabIcon name="messages" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => <TabIcon name="me" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopColor: Colors.ink200,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  plusWrap: {
    width: 44,
    height: 32,
    borderRadius: 14,
    backgroundColor: Colors.pink500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.pink500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  plusIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
});
