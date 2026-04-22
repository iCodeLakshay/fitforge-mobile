import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  Squares2X2Icon as Squares2X2Outline,
  UsersIcon as UsersOutline,
  QrCodeIcon as QrCodeOutline,
  CurrencyRupeeIcon as RupeeOutline,
  Cog6ToothIcon as CogOutline,
} from 'react-native-heroicons/outline';
import {
  Squares2X2Icon as Squares2X2Solid,
  UsersIcon as UsersSolid,
  QrCodeIcon as QrCodeSolid,
  CurrencyRupeeIcon as RupeeSolid,
  Cog6ToothIcon as CogSolid,
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

function AttendanceCenterIcon({ focused }: { focused: boolean }) {
  const Icon = focused ? QrCodeSolid : QrCodeOutline;

  return (
    <View style={styles.centerOuter}>
      <View style={[styles.centerBubble, focused && styles.centerBubbleActive]}>
        <Icon size={24} color={focused ? Colors.textOnAccent : Colors.textPrimary} />
      </View>
    </View>
  );
}

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle: {
          backgroundColor: Colors.surface01,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          overflow: 'visible',
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
            <TabIcon focused={focused} color={color} OutlineIcon={Squares2X2Outline} SolidIcon={Squares2X2Solid} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={UsersOutline} SolidIcon={UsersSolid} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarItemStyle: { marginTop: -22 },
          tabBarIcon: ({ focused }) => (
            <AttendanceCenterIcon focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={RupeeOutline} SolidIcon={RupeeSolid} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} OutlineIcon={CogOutline} SolidIcon={CogSolid} />
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
  centerOuter: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface02,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBubbleActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
});
