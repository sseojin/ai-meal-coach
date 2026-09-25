import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const serverDir = fileURLToPath(new URL('..', import.meta.url));
const dataDir = path.join(serverDir, 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'meal-coach.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS meal_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    image_filename TEXT NOT NULL UNIQUE,
    image_original_name TEXT NOT NULL,
    detected_foods TEXT NOT NULL,
    carbohydrates TEXT NOT NULL CHECK (carbohydrates IN ('high','moderate','low')),
    protein TEXT NOT NULL CHECK (protein IN ('high','moderate','low')),
    fat TEXT NOT NULL CHECK (fat IN ('high','moderate','low')),
    fiber TEXT NOT NULL CHECK (fiber IN ('high','moderate','low')),
    nutrient_gaps TEXT NOT NULL,
    coach_note TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_meal_reports_updated_at ON meal_reports(updated_at DESC);
`);

export const reportById = db.prepare('SELECT * FROM meal_reports WHERE id = ?');
export const reportsByUpdated = db.prepare('SELECT * FROM meal_reports ORDER BY updated_at DESC, id DESC');
export const insertReport = db.prepare(`
  INSERT INTO meal_reports (meal_type, image_filename, image_original_name, detected_foods,
    carbohydrates, protein, fat, fiber, nutrient_gaps, coach_note)
  VALUES (@mealType, @imageFilename, @imageOriginalName, @detectedFoods,
    @carbohydrates, @protein, @fat, @fiber, @nutrientGaps, @coachNote)
`);
export const updateReport = db.prepare(`
  UPDATE meal_reports SET meal_type = @mealType, detected_foods = @detectedFoods,
    carbohydrates = @carbohydrates, protein = @protein, fat = @fat, fiber = @fiber,
    nutrient_gaps = @nutrientGaps, coach_note = @coachNote,
    updated_at = datetime('now') WHERE id = @id
`);
export const deleteReport = db.prepare('DELETE FROM meal_reports WHERE id = ?');

export function toApiReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    mealType: row.meal_type,
    imageUrl: `/uploads/${row.image_filename}`,
    detectedFoods: JSON.parse(row.detected_foods),
    balance: {
      carbohydrates: row.carbohydrates,
      protein: row.protein,
      fat: row.fat,
      fiber: row.fiber,
    },
    nutrientGaps: JSON.parse(row.nutrient_gaps),
    coachNote: JSON.parse(row.coach_note),
    createdAt: `${row.created_at.replace(' ', 'T')}Z`,
    updatedAt: `${row.updated_at.replace(' ', 'T')}Z`,
  };
}

export function analysisParams(analysis) {
  return {
    detectedFoods: JSON.stringify(analysis.detected_foods),
    carbohydrates: analysis.balance.carbohydrates,
    protein: analysis.balance.protein,
    fat: analysis.balance.fat,
    fiber: analysis.balance.fiber,
    nutrientGaps: JSON.stringify(analysis.nutrient_gaps),
    coachNote: JSON.stringify(analysis.coach_note),
  };
}
