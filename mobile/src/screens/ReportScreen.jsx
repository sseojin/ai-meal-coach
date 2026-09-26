import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NutritionBalance from '../components/NutritionBalance';
import CoachNote from '../components/CoachNote';
import ReportActions from '../components/ReportActions';
import { imageUrl } from '../config';

export default function ReportScreen({ report, onBack, backLabel, onEdit, onDeleted }) {
  const [actionError, setActionError] = useState('');
  if (!report) return null;
  const date = report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : '';
  return <ScrollView contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={onBack} accessibilityRole="button" style={styles.back}><Text style={styles.backText}>← {backLabel || 'Analyze another meal'}</Text></TouchableOpacity>
    <View style={styles.heading}><Text style={styles.title}>Meal Analysis Report</Text><Text style={styles.saved}>Saved</Text></View>
    <Text style={styles.meta}>{report.mealType?.[0]?.toUpperCase() + report.mealType?.slice(1)} · {date}</Text>
    <Image source={{ uri: imageUrl(report.imageUrl) }} style={styles.photo} resizeMode="cover" />

    <Text style={styles.section}>DETECTED FOODS</Text>
    <View style={styles.chips}>{report.detectedFoods?.map((food, index) => <Text key={`${food.name}-${index}`} style={styles.chip}>{food.name}</Text>)}</View>

    <Text style={styles.section}>NUTRITIONAL BALANCE</Text>
    <NutritionBalance balance={report.balance} />

    <Text style={styles.section}>COACH'S NOTE</Text>
    <CoachNote coachNote={report.coachNote} nutrientGaps={report.nutrientGaps || []} />
    <Text style={styles.disclaimer}>AI-generated estimates may be inaccurate and are not intended for medical or dietary diagnosis.</Text>
    {!!actionError && <Text style={styles.actionError} accessibilityRole="alert">{actionError}</Text>}
    <ReportActions reportId={report.id} onEdit={onEdit} onDeleted={onDeleted} onError={setActionError} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 44 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: '#245C46', fontSize: 15, fontWeight: '600' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1F2924' },
  saved: { color: '#245C46', backgroundColor: '#DDEBDD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, fontSize: 13, fontWeight: '700' },
  meta: { color: '#647069', fontSize: 14, marginTop: 7, marginBottom: 18 },
  photo: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#DDEBDD' },
  section: { color: '#647069', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 25, marginBottom: 12 },
  disclaimer: { color: '#647069', fontSize: 13, lineHeight: 19, marginTop: 22 },
  actionError: { color: '#B23A3A', backgroundColor: '#FBEDEC', borderRadius: 9, padding: 12, marginTop: 14, fontSize: 14, lineHeight: 20 },
});
