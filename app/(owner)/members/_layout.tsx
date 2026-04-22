import { Stack } from 'expo-router';

export default function MembersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add"     options={{ presentation: 'modal' }} />
      <Stack.Screen name="pending" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/edit-subscription" />
      <Stack.Screen name="[id]/edit-profile" />
      <Stack.Screen name="[id]/health-profile" />
      <Stack.Screen name="[id]/generate-plan" />
      <Stack.Screen name="[id]/plan-result" />
    </Stack>
  );
}
