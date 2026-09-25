import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeMeal } from './geminiService.js';
import {
  analysisParams, deleteReport, insertReport, reportById, reportsByUpdated,
  toApiReport, updateReport,
} from '../db.js';

export const uploadDir = fileURLToPath(new URL('../../uploads/', import.meta.url));
const mealTypes = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
const mimeByExtension = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export function apiError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

export function validMealType(value) {
  if (!mealTypes.has(value)) {
    throw apiError(400, 'INVALID_MEAL_TYPE', 'Choose a valid meal type.');
  }
  return value;
}

export function validReportId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw apiError(400, 'INVALID_REPORT_ID', 'Choose a valid report.');
  }
  return Number(value);
}

export function validFoods(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw apiError(400, 'INVALID_FOOD_LIST', 'Add at least one valid food name.');
  }
  const foods = value.map((food) => typeof food === 'string'
    ? food.replace(/\s+/g, ' ').trim() : '');
  if (foods.some((food) => food.length < 2 || food.length > 60)
    || new Set(foods.map((food) => food.toLocaleLowerCase('en'))).size !== foods.length) {
    throw apiError(400, 'INVALID_FOOD_LIST', 'Add at least one valid food name.');
  }
  return foods;
}

export function getReport(id) {
  const row = reportById.get(id);
  if (!row) throw apiError(404, 'REPORT_NOT_FOUND', 'Report not found.');
  return toApiReport(row);
}

export function getReports() {
  return { reports: reportsByUpdated.all().map(toApiReport) };
}

export async function createReport({ file, mealType }) {
  if (!file) throw apiError(400, 'IMAGE_REQUIRED', 'Choose a meal photo before analyzing.');
  try {
    validMealType(mealType);
    const analysis = await analyzeMeal({ imagePath: file.path, mimeType: file.mimetype, mealType });
    const row = {
      mealType,
      imageFilename: file.filename,
      imageOriginalName: file.originalname,
      ...analysisParams(analysis),
    };
    const result = insertReport.run(row);
    return getReport(result.lastInsertRowid);
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    if (error.status) throw error;
    throw apiError(500, 'REPORT_CREATE_FAILED', 'We could not save this report. Please try again.');
  }
}

export async function reviseReport(id, body) {
  const row = reportById.get(id);
  if (!row) throw apiError(404, 'REPORT_NOT_FOUND', 'Report not found.');
  const mealType = validMealType(body?.mealType);
  const foods = validFoods(body?.foods);
  const imagePath = path.join(uploadDir, row.image_filename);
  try {
    await fs.access(imagePath);
  } catch {
    throw apiError(500, 'SOURCE_IMAGE_MISSING', 'The original meal photo is missing.');
  }
  const analysis = await analyzeMeal({
    imagePath,
    mimeType: mimeByExtension[path.extname(row.image_filename)],
    mealType,
    foods,
  });
  updateReport.run({ id, mealType, ...analysisParams(analysis) });
  return getReport(id);
}

export async function removeReport(id) {
  const row = reportById.get(id);
  if (!row) throw apiError(404, 'REPORT_NOT_FOUND', 'Report not found.');
  deleteReport.run(id);
  await fs.unlink(path.join(uploadDir, row.image_filename)).catch((error) => {
    if (error.code !== 'ENOENT') console.warn('Could not remove report image:', error);
  });
}
