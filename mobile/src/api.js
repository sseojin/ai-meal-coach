import { API_BASE_URL } from './config';
import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

async function request(path, options) {
  if (!API_BASE_URL) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL to your laptop Wi-Fi address, then restart Expo.');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, options);
  } catch {
    throw new Error('Cannot reach the server. Check that it is running and you are on the same Wi-Fi.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const code = body?.error?.code;
    const message = {
      NO_MEAL_DETECTED: 'We could not identify a meal in this image. Please upload a clear food photo.',
      IMAGE_TOO_LARGE: 'The image must be 8 MB or smaller.',
      UNSUPPORTED_IMAGE_TYPE: 'Use a JPEG, PNG or WEBP image.',
      GEMINI_REQUEST_FAILED: 'We could not analyze the meal right now. Please try again.',
      INVALID_AI_RESPONSE: 'We could not analyze the meal right now. Please try again.',
    }[code] || body?.error?.message || 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return response.status === 204 ? undefined : response.json();
}

export function createReport(image, mealType) {
  const form = new FormData();
  form.append('mealType', mealType);
  form.append('image', new File(image.uri));
  return request('/reports', { method: 'POST', body: form });
}

export async function getReports() {
  return (await request('/reports')).reports;
}

export function getReport(id) {
  return request(`/reports/${id}`);
}

export function updateReport(id, mealType, foods) {
  return request(`/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealType, foods }),
  });
}

export function deleteReport(id) {
  return request(`/reports/${id}`, { method: 'DELETE' });
}
