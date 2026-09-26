import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import ReportScreen from './src/screens/ReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import EditReportScreen from './src/screens/EditReportScreen';

export default function App() {
  const [activeView, setActiveView] = useState('analyze');
  const [report, setReport] = useState(null);
  const [reportReturnTo, setReportReturnTo] = useState('analyze');

  function openReport(nextReport, returnTo = 'history') {
    setReport(nextReport);
    setReportReturnTo(returnTo);
    setActiveView('report');
  }

  function finishEdit(nextReport) {
    setReport(nextReport);
    setActiveView('report');
  }

  const activeTab = activeView === 'history' || ((activeView === 'report' || activeView === 'edit') && reportReturnTo === 'history')
    ? 'history' : 'analyze';

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>AI Meal Coach</Text>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveView('analyze')} accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'analyze' }} style={styles.tab}>
            <Text style={activeTab === 'analyze' ? styles.selected : styles.unselected}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveView('history')} accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'history' }} style={styles.tab}>
            <Text style={activeTab === 'history' ? styles.selected : styles.unselected}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
      {activeView === 'analyze' ? <AnalyzeScreen onCreated={(next) => openReport(next, 'analyze')} /> :
        activeView === 'history' ? <HistoryScreen onAnalyze={() => setActiveView('analyze')} onSelect={(next) => openReport(next, 'history')} /> :
          activeView === 'report' ? <ReportScreen
            report={report}
            backLabel={reportReturnTo === 'history' ? 'Back to History' : 'Analyze another meal'}
            onBack={() => setActiveView(reportReturnTo)}
            onEdit={() => setActiveView('edit')}
            onDeleted={() => { setReport(null); setActiveView('history'); }}
          /> :
            <EditReportScreen key={report?.id} report={report} onCancel={() => setActiveView('report')} onUpdated={finishEdit} />}
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
});
