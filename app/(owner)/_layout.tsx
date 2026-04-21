import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius } from '../../constants/spacing';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name:     IconName;
  label:    string;
  focused:  boolean;
  color:    string;
}

function TabIcon({ name, label, focused, color }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={focused ? {
        backgroundColor:  `${Colors.accent}18`,
        width:            48,
        height:           28,
        borderRadius:     Radius.full,
        alignItems:       'center',
        justifyContent:   'center',
      } : { width: 48, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={name} size={22} color={color} />
      </View>
      <Text style={{
        ...Typography.labelSm,
        color,
        fontSize: 10,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function OwnerLayout() {
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
        name="dashboard"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} label="Dashboard" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} label="Members" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'qr-code' : 'qr-code-outline'} label="Attendance" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'cash' : 'cash-outline'} label="Payments" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} label="Settings" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
