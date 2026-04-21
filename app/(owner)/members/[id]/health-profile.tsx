import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors } from '../../../../constants/colors';
import { Layout } from '../../../../constants/spacing';
import { ScreenHeader, Input, Button, Card, LoadingOverlay } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores/auth.store';
import { useUIStore } from '../../../../stores/ui.store';

export default function EditHealthProfileScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const router = useRouter();
  const { gymId } = useAuthStore();
  const { setLoading, showToast } = useUIStore();

  const detail = useQuery(api.members.getDetail, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');
  const upsertProfile = useMutation(api.healthProfiles.upsert);

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('general_fitness');
  const [diet, setDiet] = useState('non_veg');
  const [medical, setMedical] = useState('');

  // Pre-fill form if profile exists
  useEffect(() => {
    if (detail?.healthProfile) {
      setAge((detail.healthProfile.age ?? 0).toString());
      setWeight((detail.healthProfile.weightKg ?? 0).toString());
      setHeight((detail.healthProfile.heightCm ?? 0).toString());
      setGoal(detail.healthProfile.physiqueGoal ?? 'general_fitness');
      setDiet(detail.healthProfile.dietaryPreference ?? 'non_veg');
      setMedical(detail.healthProfile.medicalConditions ?? '');
    }
  }, [detail]);

  if (detail === undefined) {
    return <LoadingOverlay message="Loading profile..." />;
  }
  if (!detail || !detail.membership) {
    return null; // Handle error appropriately
  }

  const handleSave = async () => {
    if (!age || !weight || !height) {
      return showToast('warning', 'Please fill out age, weight, and height');
    }

    try {
      setLoading(true);
      await upsertProfile({
        gymId: gymId as Id<'gyms'>,
        memberId: id as Id<'users'>,
        membershipId: detail.membership._id,
        age: parseInt(age, 10),
        weightKg: parseFloat(weight),
        heightCm: parseInt(height, 10),
        goal,
        dietaryPref: diet,
        medicalCondition: medical.trim() || undefined,
      });

      showToast('success', 'Health profile updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save health profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Physical Profile" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padding style={styles.card}>
          <Input 
            placeholder="Age (years)" 
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input 
                placeholder="Weight (kg)" 
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input 
                placeholder="Height (cm)" 
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        <Card padding style={styles.card}>
          <Button 
            title="Weight Loss" 
            variant={goal === 'weight_loss' ? 'primary' : 'secondary'}
            onPress={() => setGoal('weight_loss')}
            style={{ marginBottom: 8 }}
          />
          <Button 
            title="Muscle Gain" 
            variant={goal === 'muscle_gain' ? 'primary' : 'secondary'}
            onPress={() => setGoal('muscle_gain')}
            style={{ marginBottom: 8 }}
          />
          <Button 
            title="General Fitness" 
            variant={goal === 'general_fitness' ? 'primary' : 'secondary'}
            onPress={() => setGoal('general_fitness')}
          />
        </Card>

        <Card padding style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button 
              title="Veg" 
              variant={diet === 'veg' ? 'primary' : 'secondary'}
              onPress={() => setDiet('veg')}
              style={{ flex: 1 }}
            />
            <Button 
              title="Non-Veg" 
              variant={diet === 'non_veg' ? 'primary' : 'secondary'}
              onPress={() => setDiet('non_veg')}
              style={{ flex: 1 }}
            />
            <Button 
              title="Vegan" 
              variant={diet === 'vegan' ? 'primary' : 'secondary'}
              onPress={() => setDiet('vegan')}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <Card padding style={styles.card}>
          <Input 
            placeholder="Medical Notes / Injuries (Optional)" 
            value={medical}
            onChangeText={setMedical}
            multiline
            style={{ height: 80, textAlignVertical: 'top' }}
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Save Profile" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Layout.screenPadding,
    gap: 16,
  },
  card: {
    gap: 12,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
