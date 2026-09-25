import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import express from 'express';
import multer from 'multer';
import {
  apiError, createReport, getReport, getReports, removeReport, reviseReport,
  uploadDir, validReportId,
} from './services/reportService.js';

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
  console.error('Set GEMINI_API_KEY in server/.env before starting the server.');
  process.exit(1);
}

fs.mkdirSync(uploadDir, { recursive: true });
const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_request, file, callback) => callback(null, randomUUID() + extensionByMime[file.mimetype]),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!Object.hasOwn(extensionByMime, file.mimetype)) {
      callback(apiError(400, 'UNSUPPORTED_IMAGE_TYPE', 'Use a JPEG, PNG or WEBP image.'));
      return;
    }
    callback(null, true);
  },
});

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/uploads', express.static(uploadDir));
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.post('/api/reports', upload.single('image'), async (request, response) => {
  const report = await createReport({ file: request.file, mealType: request.body?.mealType });
  response.status(201).json(report);
});
app.get('/api/reports', (_request, response) => response.json(getReports()));
app.get('/api/reports/:id', (request, response) => response.json(getReport(validReportId(request.params.id))));
app.put('/api/reports/:id', async (request, response) => {
  response.json(await reviseReport(validReportId(request.params.id), request.body));
});
app.delete('/api/reports/:id', async (request, response) => {
  await removeReport(validReportId(request.params.id));
  response.status(204).end();
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    error = error.code === 'LIMIT_FILE_SIZE'
      ? apiError(413, 'IMAGE_TOO_LARGE', 'The image must be 8 MB or smaller.')
      : apiError(400, 'INVALID_IMAGE_UPLOAD', 'Upload one meal photo.');
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    error = apiError(400, 'INVALID_JSON', 'Send a valid JSON request.');
  }
  if (!error.status) console.error(error);
  response.status(error.status || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.status ? error.message : 'Something went wrong. Please try again.',
    },
  });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', (error) => {
  if (error) throw error;
  console.log(`AI Meal Coach server listening on port ${port}`);
});
