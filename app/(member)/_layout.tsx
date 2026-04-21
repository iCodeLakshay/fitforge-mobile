import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius } from '../../constants/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name, label, focused, color,
}: { name: IconName; label: string; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={focused ? {
        backgroundColor: `${Colors.accent}18`,
        width: 48, height: 28,
        borderRadius: Radius.full,
        alignItems: 'center', justifyContent: 'center',
      } : { width: 48, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={name} size={22} color={color} />
      </View>
      <Text style={{ ...Typography.labelSm, color, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle: {
          backgroundColor:  Colors.surface01,
          borderTopWidth:   1,
          borderTopColor:   Colors.border,
          height:           72,
          paddingBottom:    12,
          paddingTop:       8,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarShowLabel:         false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'barbell' : 'barbell-outline'} label="Plans" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'calendar' : 'calendar-outline'} label="Calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} label="Profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
