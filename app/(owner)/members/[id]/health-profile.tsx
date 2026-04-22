import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors } from '../../../../constants/colors';
import { Typography } from '../../../../constants/typography';
import { Layout, Radius } from '../../../../constants/spacing';
import { ScreenHeader, Input, Button, Card, LoadingOverlay } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores/auth.store';
import { showError, showSuccess } from '../../../../stores/ui.store';

// ─── Chip selector helper ─────────────────────────────────────────────────────
function ChipSelect({
  options, selected, onSelect, multi = false,
}: {
  options: { label: string; value: string }[];
  selected: string | string[];
  onSelect: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const isActive = multi
          ? (selected as string[]).includes(o.value)
          : selected === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[chipStyles.chip, isActive && chipStyles.active]}
            onPress={() => onSelect(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[chipStyles.text, isActive && chipStyles.activeText]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  active:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  text:       { ...Typography.labelMd, color: Colors.textSecondary },
  activeText: { color: Colors.background },
});

// ─── Options ──────────────────────────────────────────────────────────────────
const GOALS        = [
  { label: 'Weight Loss',    value: 'weight_loss' },
  { label: 'Muscle Gain',    value: 'muscle_gain' },
  { label: 'Maintain Tone',  value: 'maintain_tone' },
  { label: 'Athletic Perf',  value: 'athletic' },
  { label: 'Gen Fitness',    value: 'general_fitness' },
];
const ACTIVITY     = [
  { label: 'Sedentary',      value: 'sedentary' },
  { label: 'Lightly Active', value: 'lightly_active' },
  { label: 'Active',         value: 'active' },
  { label: 'Very Active',    value: 'very_active' },
];
const FITNESS_LVLS = [
  { label: 'Beginner',       value: 'beginner' },
  { label: 'Intermediate',   value: 'intermediate' },
  { label: 'Advanced',       value: 'advanced' },
];
const EQUIPMENT    = [
  { label: 'Dumbbells',      value: 'dumbbells' },
  { label: 'Barbell',        value: 'barbell' },
  { label: 'Machines',       value: 'machines' },
  { label: 'Bodyweight',     value: 'bodyweight' },
  { label: 'Kettlebells',    value: 'kettlebells' },
  { label: 'Resistance Band',value: 'resistance_band' },
];
const DIETARY      = [
  { label: 'Non-Veg',        value: 'non_veg' },
  { label: 'Vegetarian',     value: 'vegetarian' },
  { label: 'Vegan',          value: 'vegan' },
  { label: 'Eggetarian',     value: 'eggetarian' },
];
const APPETITE     = [
  { label: 'Small',          value: 'small' },
  { label: 'Medium',         value: 'medium' },
  { label: 'Large',          value: 'large' },
];
const GENDER_OPTS  = [
  { label: 'Male',           value: 'male' },
  { label: 'Female',         value: 'female' },
  { label: 'Other',          value: 'other' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EditHealthProfileScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const router  = useRouter();
  const { gymId } = useAuthStore();

  const detail        = useQuery(api.members.getDetail, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');
  const upsertProfile = useMutation(api.healthProfiles.upsert);

  // ── Physical
  const [age,    setAge]    = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  // ── Goals
  const [goal,          setGoal]          = useState('general_fitness');
  const [activityLevel, setActivityLevel] = useState('lightly_active');
  const [gymDays,       setGymDays]       = useState('3');
  const [fitnessLevel,  setFitnessLevel]  = useState('beginner');
  const [equipment,     setEquipment]     = useState<string[]>([]);
  // ── Diet
  const [dietary,        setDietary]        = useState('non_veg');
  const [allergies,      setAllergies]      = useState('');
  const [appetite,       setAppetite]       = useState('medium');
  const [mealFrequency,  setMealFrequency]  = useState('3');
  // ── Medical
  const [medical, setMedical] = useState('');
  const [injury,  setInjury]  = useState('');

  useEffect(() => {
    if (detail?.healthProfile) {
      const hp = detail.healthProfile;
      setAge(hp.age != null ? String(hp.age) : '');
      setWeight(hp.weightKg != null ? String(hp.weightKg) : '');
      setHeight(hp.heightCm != null ? String(hp.heightCm) : '');
      setGender(hp.gender ?? '');
      setGoal(hp.physiqueGoal ?? 'general_fitness');
      setActivityLevel(hp.activityLevel ?? 'lightly_active');
      setGymDays(hp.gymDaysPerWeek != null ? String(hp.gymDaysPerWeek) : '3');
      setFitnessLevel(hp.fitnessLevel ?? 'beginner');
      setEquipment(hp.equipmentAvailable ?? []);
      setDietary(hp.dietaryPreference ?? 'non_veg');
      setAllergies(hp.foodAllergies ?? '');
      setAppetite(hp.appetiteSize ?? 'medium');
      setMealFrequency(hp.mealFrequency != null ? String(hp.mealFrequency) : '3');
      setMedical(hp.medicalConditions ?? '');
      setInjury(hp.injuryNotes ?? '');
    }
  }, [detail]);

  const toggleEquipment = (v: string) => {
    setEquipment((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  };

  if (detail === undefined) return <LoadingOverlay message="Loading profile..." />;
  if (!detail?.membership) return null;

  const handleSave = async () => {
    try {
      await upsertProfile({
        gymId:              gymId as Id<'gyms'>,
        memberId:           id as Id<'users'>,
        membershipId:       detail.membership._id,
        age:                age    ? parseInt(age, 10)    : undefined,
        weightKg:           weight ? parseFloat(weight)   : undefined,
        heightCm:           height ? parseInt(height, 10) : undefined,
        gender:             gender || undefined,
        physiqueGoal:       goal,
        activityLevel,
        gymDaysPerWeek:     gymDays ? parseInt(gymDays, 10) : undefined,
        fitnessLevel,
        equipmentAvailable: equipment.length > 0 ? equipment : undefined,
        dietaryPreference:  dietary,
        foodAllergies:      allergies.trim() || undefined,
        appetiteSize:       appetite,
        mealFrequency:      mealFrequency ? parseInt(mealFrequency, 10) : undefined,
        medicalConditions:  medical.trim() || undefined,
        injuryNotes:        injury.trim() || undefined,
      });
      showSuccess('Health profile saved!');
      router.back();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to save profile');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Health Profile" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Section 1: Physical ── */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSICAL</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Age (yrs)" placeholder="e.g. 28" value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Weight (kg)" placeholder="e.g. 72" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Height (cm)" placeholder="e.g. 175" value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }} />
          </View>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipSelect options={GENDER_OPTS} selected={gender} onSelect={setGender} />
        </Card>

        {/* ── Section 2: Goals ── */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionTitle}>GOALS & FITNESS</Text>
          <Text style={styles.fieldLabel}>Physique Goal</Text>
          <ChipSelect options={GOALS} selected={goal} onSelect={setGoal} />

          <Text style={styles.fieldLabel}>Activity Level</Text>
          <ChipSelect options={ACTIVITY} selected={activityLevel} onSelect={setActivityLevel} />

          <Text style={styles.fieldLabel}>Fitness Level</Text>
          <ChipSelect options={FITNESS_LVLS} selected={fitnessLevel} onSelect={setFitnessLevel} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Gym Days/Week" placeholder="3" value={gymDays} onChangeText={setGymDays} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }} />
          </View>

          <Text style={styles.fieldLabel}>Available Equipment</Text>
          <ChipSelect options={EQUIPMENT} selected={equipment} onSelect={toggleEquipment} multi />
        </Card>

        {/* ── Section 3: Diet ── */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionTitle}>DIET</Text>
          <Text style={styles.fieldLabel}>Dietary Preference</Text>
          <ChipSelect options={DIETARY} selected={dietary} onSelect={setDietary} />

          <Text style={styles.fieldLabel}>Appetite Size</Text>
          <ChipSelect options={APPETITE} selected={appetite} onSelect={setAppetite} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Meals/Day" placeholder="e.g. 4" value={mealFrequency} onChangeText={setMealFrequency} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }} />
          </View>

          <Input
            label="Food Allergies (optional)"
            placeholder="e.g. Lactose, peanuts"
            value={allergies}
            onChangeText={setAllergies}
          />
        </Card>

        {/* ── Section 4: Medical ── */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionTitle}>MEDICAL</Text>
          <Input
            label="Medical Conditions (optional)"
            placeholder="e.g. Type 2 Diabetes, Hypertension"
            value={medical}
            onChangeText={setMedical}
            multiline
            style={{ height: 72, textAlignVertical: 'top' }}
          />
          <Input
            label="Injury Notes (optional)"
            placeholder="e.g. Lower back pain, avoid heavy squats"
            value={injury}
            onChangeText={setInjury}
            multiline
            style={{ height: 72, textAlignVertical: 'top' }}
          />
        </Card>

      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Profile" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: Layout.screenPadding, gap: 16, paddingBottom: 40 },
  section:      { gap: 14 },
  sectionTitle: { ...Typography.labelLg, color: Colors.textSecondary },
  fieldLabel:   { ...Typography.labelSm, color: Colors.textTertiary, marginTop: 4 },
  row:          { flexDirection: 'row', gap: 12 },
  footer: {
    padding:         Layout.screenPadding,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.surface01,
  },
});
