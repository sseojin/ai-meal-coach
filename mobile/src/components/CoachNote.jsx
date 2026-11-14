import { StyleSheet, Text, View } from 'react-native';

export default function CoachNote({ coachNote, nutrientGaps = [] }) {
  return (
    <View style={styles.card}>
      {!!coachNote?.headline && <Text style={styles.headline}>{coachNote.headline}</Text>}
      {nutrientGaps.map((gap, index) => (
        <View key={`${gap.nutrient}-${index}`} style={styles.gap}>
          <Text style={styles.nutrient}>{gap.nutrient?.toUpperCase()}</Text>
          <Text style={styles.why}>{gap.why}</Text>
          {!!gap.foods?.length && <>
            <Text style={styles.addLabel}>FOODS THAT CAN HELP</Text>
            <View style={styles.foods}>
              {gap.foods.map((food, foodIndex) => (
                <View key={`${food}-${foodIndex}`} style={styles.foodChip}>
                  <Text style={styles.foodText}>{food}</Text>
                </View>
              ))}
            </View>
          </>}
        </View>
      ))}
      {!!coachNote?.closing && <Text style={styles.closing}>{coachNote.closing}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  headline: { color: '#1F2924', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  gap: { borderTopWidth: 1, borderTopColor: '#DDE3DE', marginTop: 16, paddingTop: 15 },
  nutrient: { color: '#245C46', fontSize: 12, fontWeight: '700', letterSpacing: 0.7, marginBottom: 6 },
  why: { color: '#1F2924', fontSize: 14, lineHeight: 21 },
  addLabel: { color: '#647069', fontSize: 11, fontWeight: '700', letterSpacing: 0.7, marginTop: 12, marginBottom: 8 },
  foods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodChip: { backgroundColor: '#DDEBDD', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  foodText: { color: '#245C46', fontSize: 13 },
  closing: { color: '#1F2924', fontSize: 15, lineHeight: 22, marginTop: 17 },
});
