import { Tabs } from 'expo-router';
import { Home, Shield, User, Wallet } from 'lucide-react-native';

const TAB_ACTIVE = '#2563eb';
const TAB_INACTIVE = '#a3a3a3';
const ICON = 20;

export default function TabsGroupLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: {
          borderTopColor: '#e5e5e5',
          backgroundColor: '#ffffff',
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
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
