import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingState({ message = 'Analyzing your meal...' }) {
  return <View style={styles.row}><ActivityIndicator color="#245C46" /><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 52 },
  text: { color: '#245C46', fontSize: 15, fontWeight: '600' },
});
