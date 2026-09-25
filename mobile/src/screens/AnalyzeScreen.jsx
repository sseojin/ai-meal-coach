import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createReport } from '../api';
import LoadingState from '../components/LoadingState';
import MealPhotoPicker from '../components/MealPhotoPicker';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function AnalyzeScreen({ onCreated }) {
  const [mealType, setMealType] = useState('lunch');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function analyze() {
    if (submitting.current) return;
    if (!image) { setError('Choose a meal photo before analyzing.'); return; }
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      onCreated(await createReport(image, mealType));
    } catch (cause) {
      setError(cause.message || 'We could not analyze the meal right now. Please try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Understand your meal.</Text>
    <Text style={styles.intro}>Take a photo of your meal to see how balanced it is and what is worth adding.</Text>
    <Text style={styles.label}>MEAL TYPE</Text>
    <View style={styles.meals}>{MEAL_TYPES.map(type => (
      <TouchableOpacity key={type} onPress={() => setMealType(type)} disabled={loading} accessibilityRole="radio" accessibilityState={{ checked: mealType === type }} style={[styles.meal, mealType === type && styles.mealSelected]}>
        <Text style={[styles.mealText, mealType === type && styles.mealTextSelected]}>{type[0].toUpperCase() + type.slice(1)}</Text>
      </TouchableOpacity>
    ))}</View>
    <MealPhotoPicker image={image} onChange={setImage} onError={setError} disabled={loading} />
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    {loading ? <LoadingState /> : <TouchableOpacity style={[styles.submit, !image && styles.submitDisabled]} onPress={analyze} disabled={!image} accessibilityRole="button" accessibilityState={{ disabled: !image }}>
      <Text style={styles.submitText}>Analyze</Text>
    </TouchableOpacity>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1F2924' },
  intro: { fontSize: 15, lineHeight: 22, color: '#647069', marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#647069', marginTop: 26 },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  meal: { borderWidth: 1, borderColor: '#DDE3DE', paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 22 },
  mealSelected: { backgroundColor: '#245C46', borderColor: '#245C46' },
  mealText: { color: '#1F2924', fontSize: 14 },
  mealTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  error: { color: '#B23A3A', fontSize: 14, marginTop: 16 },
  submit: { backgroundColor: '#245C46', minHeight: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
