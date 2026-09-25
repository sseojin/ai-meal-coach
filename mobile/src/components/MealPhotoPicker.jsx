import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { normalizeImage } from '../utils/normalizeImage';

export default function MealPhotoPicker({ image, onChange, onError, disabled }) {
  const [busy, setBusy] = useState(false);

  async function pick(source) {
    if (busy || disabled) return;
    setBusy(true);
    onError('');
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        onError(source === 'camera'
          ? 'Camera access is off. You can still choose a photo from your library. Enable access in Settings to use the camera.'
          : 'Photo library access is off. Enable access in Settings to choose a photo.');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!result.canceled && result.assets?.[0]) {
        onChange(await normalizeImage(result.assets[0]));
      }
    } catch (error) {
      onError(['The image must be 8 MB or smaller.', 'Use a JPEG, PNG or WEBP image.'].includes(error?.message)
        ? error.message : 'We could not open this photo. Try another image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <View style={styles.preview}>
        {image ? <Image source={{ uri: image.uri }} style={styles.photo} resizeMode="cover" />
          : <Text style={styles.placeholder}>Your meal photo will appear here.</Text>}
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => pick('camera')} disabled={busy || disabled} accessibilityRole="button">
          <Text style={styles.buttonText}>Take a Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => pick('library')} disabled={busy || disabled} accessibilityRole="button">
          <Text style={styles.buttonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
      {image && <TouchableOpacity onPress={() => pick('library')} disabled={busy || disabled} accessibilityRole="button" style={styles.change}>
        <Text style={styles.changeText}>Change Photo</Text>
      </TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: 220, borderRadius: 14, backgroundColor: '#DDEBDD', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  photo: { width: '100%', height: '100%' },
  placeholder: { color: '#647069', fontSize: 15, textAlign: 'center', padding: 16 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: { flex: 1, minHeight: 50, paddingHorizontal: 8, borderColor: '#245C46', borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#245C46', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  change: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 3 },
  changeText: { color: '#245C46', fontSize: 14, fontWeight: '600' },
});
