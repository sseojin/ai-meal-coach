import { StyleSheet, Text, View } from 'react-native';

const NUTRIENTS = [
  ['carbohydrates', 'Carbohydrates'],
  ['protein', 'Protein'],
  ['fat', 'Fat'],
  ['fiber', 'Fiber'],
];
const COLORS = { high: '#B56A22', moderate: '#397A58', low: '#477AA1' };

export default function NutritionBalance({ balance }) {
  return <View style={styles.grid}>{NUTRIENTS.map(([key, label]) => (
    <View key={key} style={[styles.card, { borderLeftColor: COLORS[balance?.[key]] || '#DDE3DE' }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{balance?.[key] ? balance[key][0].toUpperCase() + balance[key].slice(1) : 'Unknown'}</Text>
    </View>
  ))}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  card: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 10, borderLeftWidth: 4, padding: 13, minHeight: 76 },
  label: { color: '#647069', fontSize: 13 },
  value: { color: '#1F2924', fontSize: 17, fontWeight: '700', marginTop: 5 },
});
