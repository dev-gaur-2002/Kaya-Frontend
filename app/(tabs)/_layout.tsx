import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6E4A33',
        tabBarInactiveTintColor: '#8A8179',
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopColor: '#E2DBD0',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: '#EFEAE2' },
      }}
    >
      <Tabs.Screen name="chat" options={{ title: 'Kaya' }} />
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  )
}
