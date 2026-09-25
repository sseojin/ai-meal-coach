import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export async function normalizeImage(asset) {
  if (!asset?.uri) throw new Error('Choose a meal photo before analyzing.');
  if (asset.mimeType && !['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(asset.mimeType)) {
    throw new Error('Use a JPEG, PNG or WEBP image.');
  }
  const context = ImageManipulator.manipulate(asset.uri);
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  if (new File(saved.uri).size > MAX_IMAGE_SIZE) throw new Error('The image must be 8 MB or smaller.');
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
