export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export function imageUrl(path) {
  return path ? `${API_BASE_URL}${path}` : undefined;
}
