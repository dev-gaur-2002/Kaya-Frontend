import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Animated, Easing, Text, View } from 'react-native'
import { Tabs } from 'expo-router'

// The tab bar is styled through navigation props rather than classes, so the
// palette from tailwind.config.js is restated here.
const BAR = '#FAF7F2' // surface
const SELECTED = '#F3ECE3' // the bar, one step toward primary: the chosen segment
const LINE = '#E2DBD0'
const ACTIVE = '#6E4A33' // primary — 7.3:1 on the bar
// Stone, not the palette's muted #8A8179: at 12px that measured 3.6:1 on this
// bar, under the 4.5:1 floor. This is 4.5:1 and still clearly the quieter state.
const INACTIVE = '#78706A'

// The one moment: the chosen tab's icon rises as it fills. Core Animated keeps
// it on the native driver with no babel plugin in the way.
function Lift({ focused, children }: { focused: boolean; children: ReactNode }) {
  const t = useRef(new Animated.Value(focused ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(t, {
      toValue: focused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start()
  }, [focused, t])

  return (
    <Animated.View
      style={{
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
      }}
    >
      {children}
    </Animated.View>
  )
}

// Two icons is not worth an icon font. Both are drawn at a 2px stroke and both
// have a solid twin: outline is the resting state, filled is the chosen one —
// the same two-state pairing the platform's own icon sets use. Geometry is
// identical across states, so nothing shifts on a tap.
function BubbleIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE : INACTIVE
  return (
    <Lift focused={focused}>
      <View
        style={{
          width: 22,
          height: 18,
          borderRadius: 7,
          borderBottomLeftRadius: 2, // the same tail the chat bubbles carry
          borderWidth: focused ? 0 : 2,
          borderColor: color,
          backgroundColor: focused ? color : 'transparent',
        }}
      />
    </Lift>
  )
}

function PersonIcon({ focused }: { focused: boolean }) {
  const color = focused ? ACTIVE : INACTIVE
  const fill = { backgroundColor: color }
  const outline = { borderWidth: 2, borderColor: color }
  return (
    <Lift focused={focused}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, ...(focused ? fill : outline) }} />
        <View
          style={{
            width: 18,
            height: 9,
            borderTopLeftRadius: 9,
            borderTopRightRadius: 9,
            ...(focused ? fill : { ...outline, borderBottomWidth: 0 }),
          }}
        />
      </View>
    </Lift>
  )
}

// Weight carries the state as much as colour does: both labels were semibold
// before, which left the resting tab as loud as the chosen one.
function Label({ focused, children }: { focused: boolean; children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: focused ? '700' : '500',
        color: focused ? ACTIVE : INACTIVE,
      }}
    >
      {children}
    </Text>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: BAR, borderTopColor: LINE, borderTopWidth: 1 },
        // The chosen tab holds a warmer ground, so the pair reads as two
        // segments with one picked rather than two labels of equal weight.
        tabBarActiveBackgroundColor: SELECTED,
        tabBarInactiveBackgroundColor: BAR,
        sceneStyle: { backgroundColor: '#EFEAE2' },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: ({ focused }) => <Label focused={focused}>Chat</Label>,
          tabBarIcon: ({ focused }) => <BubbleIcon focused={focused} />,
          // The divider lives on the left tab only, so there is one line between
          // the two rather than one down the right edge of the bar as well.
          tabBarItemStyle: { borderRightWidth: 1, borderRightColor: LINE },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ focused }) => <Label focused={focused}>Profile</Label>,
          tabBarIcon: ({ focused }) => <PersonIcon focused={focused} />,
        }}
      />
    </Tabs>
  )
}
