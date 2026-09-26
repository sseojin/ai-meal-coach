import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getReport, getReports } from '../api';
import { imageUrl } from '../config';

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function HistoryScreen({ onSelect, onAnalyze }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setReports(await getReports());
    } catch (cause) {
      setError(cause.message || 'We could not load your meal history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openReport(id) {
    if (openingId !== null) return;
    setOpeningId(id);
    setError('');
    try {
      onSelect(await getReport(id));
    } catch (cause) {
      setError(cause.message || 'We could not open this report. Please try again.');
    } finally {
      setOpeningId(null);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#245C46" /><Text style={styles.muted}>Loading your reports…</Text></View>;

  return <FlatList
    data={reports}
    keyExtractor={(item) => String(item.id)}
    contentContainerStyle={[styles.list, reports.length === 0 && styles.emptyList]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#245C46" />}
    ListHeaderComponent={<View style={styles.heading}>
      <Text style={styles.title}>Meal History</Text>
      <Text style={styles.subtitle}>Review your saved meal reports.</Text>
      {!!error && <View style={styles.errorBox}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={() => load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
      </View>}
    </View>}
    ListEmptyComponent={!error ? <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No meal reports yet.</Text>
      <Text style={styles.muted}>Your saved meal reports will appear here.</Text>
      <TouchableOpacity onPress={onAnalyze} style={styles.primary} accessibilityRole="button"><Text style={styles.primaryText}>Analyze Your First Meal</Text></TouchableOpacity>
    </View> : null}
    renderItem={({ item }) => {
      const foods = (item.detectedFoods || []).slice(0, 3).map((food) => food.name).filter(Boolean).join(', ');
      return <TouchableOpacity onPress={() => openReport(item.id)} disabled={openingId !== null} style={styles.card} accessibilityRole="button">
        <Image source={{ uri: imageUrl(item.imageUrl) }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.meal}>{MEAL_LABELS[item.mealType] || 'Meal'}</Text>
            <Text style={styles.date}>{formatDate(item.updatedAt || item.createdAt)}</Text>
          </View>
          <Text style={styles.foods} numberOfLines={2}>{foods || 'Meal report'}</Text>
          {openingId === item.id && <Text style={styles.opening}>Opening…</Text>}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>;
    }}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
  />;
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  heading: { marginBottom: 20 },
  title: { color: '#1F2924', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#647069', fontSize: 15, marginTop: 7 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE3DE', borderRadius: 12, padding: 10 },
  thumbnail: { width: 76, height: 76, borderRadius: 9, backgroundColor: '#DDEBDD' },
  cardBody: { flex: 1, minWidth: 0, paddingHorizontal: 12 },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  meal: { color: '#1F2924', fontSize: 15, fontWeight: '700' },
  date: { color: '#647069', fontSize: 12 },
  foods: { color: '#647069', fontSize: 14, marginTop: 8 },
  opening: { color: '#245C46', fontSize: 12, marginTop: 5 },
  chevron: { color: '#647069', fontSize: 25, paddingHorizontal: 4 },
  separator: { height: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { color: '#1F2924', fontSize: 18, fontWeight: '700' },
  muted: { color: '#647069', fontSize: 14, marginTop: 10, textAlign: 'center' },
  primary: { minHeight: 48, backgroundColor: '#245C46', borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorBox: { backgroundColor: '#FBEDEC', borderRadius: 10, padding: 12, marginTop: 16 },
  error: { color: '#B23A3A', fontSize: 14, lineHeight: 20 },
  retry: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 10 },
  retryText: { color: '#245C46', fontWeight: '700', fontSize: 14 },
});
