import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import ReportScreen from './src/screens/ReportScreen';

export default function App() {
  const [activeView, setActiveView] = useState('analyze');
  const [report, setReport] = useState(null);

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>AI Meal Coach</Text>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveView('analyze')} accessibilityRole="tab" accessibilityState={{ selected: activeView === 'analyze' }} style={styles.tab}>
            <Text style={activeView === 'analyze' ? styles.selected : styles.unselected}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveView('history')} accessibilityRole="tab" accessibilityState={{ selected: activeView === 'history' }} style={styles.tab}>
            <Text style={activeView === 'history' ? styles.selected : styles.unselected}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeView === 'analyze' ? <AnalyzeScreen onCreated={(next) => { setReport(next); setActiveView('report'); }} /> :
        activeView === 'report' ? <ReportScreen report={report} onBack={() => setActiveView('analyze')} /> :
          <View style={styles.pending}><Text style={styles.unselected}>History is being added.</Text></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F8F3' },
  header: { paddingHorizontal: 20, paddingTop: 12, borderBottomWidth: 1, borderColor: '#DDE3DE' },
  brand: { fontSize: 19, fontWeight: '700', color: '#1F2924' },
  tabs: { flexDirection: 'row', gap: 26, marginTop: 14 },
  tab: { paddingBottom: 11, minHeight: 40, justifyContent: 'center' },
  selected: { color: '#245C46', fontWeight: '700', fontSize: 15 },
  unselected: { color: '#647069', fontSize: 15 },
  pending: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
