import { Tabs } from 'expo-router';
import { Home, Shield, User, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ACTIVE = '#2563eb';
const TAB_INACTIVE = '#a3a3a3';
const ICON = 20;

export default function TabsGroupLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: {
          borderTopColor: '#E8E6EF',
          backgroundColor: '#ffffff',
          paddingTop: 8,
          paddingBottom: bottomPad,
          minHeight: 56 + bottomPad,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={ICON} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <Wallet color={color} size={ICON} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="coverage"
        options={{
          title: 'Cover',
          tabBarIcon: ({ color }) => <Shield color={color} size={ICON} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => <User color={color} size={ICON} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
