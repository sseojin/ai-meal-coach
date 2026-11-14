import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { updateReport } from '../api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

function validateFoods(values) {
  const foods = values.map((food) => food.replace(/\s+/g, ' ').trim());
  if (foods.length < 1 || foods.length > 8) return { error: 'Add between 1 and 8 foods.' };
  if (foods.some((food) => food.length < 2 || food.length > 60)) return { error: 'Each food name must be 2–60 characters.' };
  if (new Set(foods.map((food) => food.toLocaleLowerCase('en'))).size !== foods.length) return { error: 'Remove duplicate food names before re-analyzing.' };
  return { foods };
}

export default function EditReportScreen({ report, onCancel, onUpdated }) {
  const [mealType, setMealType] = useState(report.mealType);
  const [foods, setFoods] = useState((report.detectedFoods || []).map((food) => food.name));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  function changeFood(index, value) {
    setFoods((current) => current.map((food, position) => position === index ? value : food));
    setError('');
  }

  function addFood() {
    if (foods.length >= 8) return;
    setFoods((current) => [...current, '']);
    setError('');
  }

  function removeFood(index) {
    setFoods((current) => current.filter((_, position) => position !== index));
    setError('');
  }

  async function reanalyze() {
    if (submitting.current) return;
    const validation = validateFoods(foods);
    if (validation.error) { setError(validation.error); return; }
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      onUpdated(await updateReport(report.id, mealType, validation.foods));
    } catch (cause) {
      setError(cause.message || 'We could not re-analyze this report. Please try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.back} accessibilityRole="button">
      <Text style={styles.backText}>← Cancel and return to report</Text>
    </TouchableOpacity>
    <Text style={styles.title}>Edit foods</Text>
    <Text style={styles.intro}>Correct the foods we identified. We’ll re-analyze the original photo using your list.</Text>

    <Text style={styles.label}>MEAL TYPE</Text>
    <View style={styles.meals}>{MEAL_TYPES.map((type) => (
      <TouchableOpacity key={type} onPress={() => setMealType(type)} disabled={loading} accessibilityRole="radio" accessibilityState={{ checked: mealType === type }} style={[styles.meal, mealType === type && styles.mealSelected]}>
        <Text style={[styles.mealText, mealType === type && styles.mealTextSelected]}>{LABELS[type]}</Text>
      </TouchableOpacity>
    ))}</View>

    <Text style={[styles.label, styles.foodLabel]}>DETECTED FOODS</Text>
    {foods.map((food, index) => <View key={`food-${index}`} style={styles.foodRow}>
      <TextInput
        value={food}
        onChangeText={(value) => changeFood(index, value)}
        editable={!loading}
        maxLength={60}
        accessibilityLabel={`Food ${index + 1}`}
        placeholder="Food name"
        placeholderTextColor="#647069"
        style={styles.input}
        returnKeyType="done"
      />
      <TouchableOpacity onPress={() => removeFood(index)} disabled={loading} style={styles.remove} accessibilityRole="button" accessibilityLabel={`Remove food ${index + 1}`}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>)}

    <TouchableOpacity onPress={addFood} disabled={loading || foods.length >= 8} style={styles.add} accessibilityRole="button" accessibilityState={{ disabled: loading || foods.length >= 8 }}>
      <Text style={[styles.addText, (loading || foods.length >= 8) && styles.disabledText]}>+ Add Food</Text>
    </TouchableOpacity>
    <Text style={styles.hint}>Use 1–8 unique food names, 2–60 characters each.</Text>

    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    <View style={styles.actions}>
      <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reanalyze} disabled={loading} style={[styles.submit, loading && styles.submitDisabled]} accessibilityRole="button" accessibilityState={{ disabled: loading }}>
        <Text style={styles.submitText}>{loading ? 'Re-analyzing…' : 'Re-analyze'}</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 44 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: '#245C46', fontSize: 14, fontWeight: '600' },
  title: { color: '#1F2924', fontSize: 26, fontWeight: '700', marginTop: 8 },
  intro: { color: '#647069', fontSize: 14, lineHeight: 21, marginTop: 8 },
  label: { color: '#647069', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: 24, marginBottom: 10 },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meal: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DDE3DE', borderRadius: 22, justifyContent: 'center' },
  mealSelected: { backgroundColor: '#245C46', borderColor: '#245C46' },
  mealText: { color: '#1F2924', fontSize: 13 },
  mealTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  foodLabel: { marginTop: 28 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  input: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: 1, borderColor: '#DDE3DE', borderRadius: 9, backgroundColor: '#FFFFFF', paddingHorizontal: 12, color: '#1F2924', fontSize: 16 },
  remove: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  removeText: { color: '#B23A3A', fontSize: 13, fontWeight: '600' },
  add: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 4 },
  addText: { color: '#245C46', fontSize: 14, fontWeight: '700' },
  disabledText: { opacity: 0.45 },
  hint: { color: '#647069', fontSize: 12, marginTop: 2 },
  error: { color: '#B23A3A', backgroundColor: '#FBEDEC', borderRadius: 9, padding: 12, marginTop: 16, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancel: { flex: 1, minHeight: 50, borderWidth: 1, borderColor: '#DDE3DE', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#1F2924', fontSize: 15, fontWeight: '600' },
  submit: { flex: 1.3, minHeight: 50, backgroundColor: '#245C46', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
