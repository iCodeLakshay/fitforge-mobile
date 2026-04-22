import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  HomeIcon as HomeOutline,
  DocumentTextIcon as PlanOutline,
  CalendarDaysIcon as CalendarOutline,
  UserCircleIcon as ProfileOutline,
} from 'react-native-heroicons/outline';
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as PlanSolid,
  CalendarDaysIcon as CalendarSolid,
  UserCircleIcon as ProfileSolid,
} from 'react-native-heroicons/solid';
import { Colors } from '../../constants/colors';

function TabIcon({
  focused,
  color,
  OutlineIcon,
  SolidIcon,
}: {
  focused: boolean;
  color: string;
  OutlineIcon: any;
  SolidIcon: any;
}) {
  const Icon = focused ? SolidIcon : OutlineIcon;

  return (
    <View style={styles.iconWrap}>
      <Icon size={22} color={color} />
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
            <TabIcon focused={focused} color={color} OutlineIcon={HomeOutline} SolidIcon={HomeSolid} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={PlanOutline} SolidIcon={PlanSolid} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={CalendarOutline} SolidIcon={CalendarSolid} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={ProfileOutline} SolidIcon={ProfileSolid} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
