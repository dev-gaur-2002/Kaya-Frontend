import { View } from 'react-native'

/**
 * Hand-drawn to match the icons already in the tab bar: bordered Views at a
 * 2px stroke, no icon font. Each takes the colour of the text it sits beside.
 */

// Two borders of a square, rotated — the arrowhead everything else is built on.
function Head({ color, up }: { color: string; up?: boolean }) {
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderColor: color,
        borderTopWidth: 2,
        borderRightWidth: 2,
        transform: [{ rotate: up ? '-45deg' : '45deg' }],
      }}
    />
  )
}

export function SignOutIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18 }}>
      {/* the frame someone steps out of: open on the side the arrow leaves by */}
      <View
        style={{
          position: 'absolute',
          width: 9,
          height: 18,
          borderWidth: 2,
          borderRightWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 3,
          borderBottomLeftRadius: 3,
        }}
      />
      <View style={{ position: 'absolute', left: 7, top: 8, width: 8, height: 2, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 10, top: 5.5 }}>
        <Head color={color} />
      </View>
    </View>
  )
}

export function UploadIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', left: 5.5, top: 0.5 }}>
        <Head color={color} up />
      </View>
      <View style={{ position: 'absolute', left: 8, top: 2, width: 2, height: 9, backgroundColor: color }} />
      {/* the tray it lands in */}
      <View
        style={{
          position: 'absolute',
          left: 1,
          top: 11,
          width: 16,
          height: 7,
          borderWidth: 2,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  )
}

export function CameraIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 18 }}>
      {/* the viewfinder hump, drawn first so the body's top edge closes it */}
      <View
        style={{
          position: 'absolute',
          left: 6.5,
          top: 0,
          width: 7,
          height: 4,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          width: 20,
          height: 15,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 4,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 6,
          top: 6.5,
          width: 8,
          height: 8,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  )
}
