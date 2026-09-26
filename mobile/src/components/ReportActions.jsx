import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteReport } from '../api';

export default function ReportActions({ reportId, onEdit, onDeleted, onError }) {
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert('Delete this report?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (deleting) return;
          setDeleting(true);
          onError?.('');
          try {
            await deleteReport(reportId);
            onDeleted();
          } catch (error) {
            onError?.(error.message || 'We could not delete this report. Please try again.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return <View>
    <View style={styles.row}>
      <TouchableOpacity onPress={onEdit} disabled={deleting} style={styles.edit} accessibilityRole="button">
        <Text style={styles.editText}>Edit foods</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={confirmDelete} disabled={deleting} style={styles.delete} accessibilityRole="button" accessibilityState={{ disabled: deleting }}>
        <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
      </TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginTop: 22 },
  edit: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#245C46', borderRadius: 10, paddingHorizontal: 12 },
  editText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  delete: { minWidth: 90, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B23A3A', borderRadius: 10, paddingHorizontal: 14 },
  deleteText: { color: '#B23A3A', fontSize: 15, fontWeight: '600' },
});
