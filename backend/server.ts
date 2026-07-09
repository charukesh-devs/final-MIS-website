import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import crypto from 'crypto';
import { memoryDb, getSupabase } from './src/supabase.js';
import {
  analyzeReconciliation,
  analyzeFormulaIntegrity,
  detectManualOverrides,
  analyzeKpis
} from './src/analyzer.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ---------- Security middleware ----------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", FRONTEND_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  })
);
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));

// ---------- File upload handling ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB cap
  fileFilter: (_req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ok = allowed.some(ext => file.originalname.toLowerCase().endsWith(ext));
    cb(ok ? null : new Error('Only .xlsx, .xls, or .csv files are allowed'), ok);
  }
});

// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  const { isSandbox } = getSupabase();
  res.json({
    status: 'ok',
    mode: isSandbox ? 'sandbox' : 'supabase',
    timestamp: new Date().toISOString()
  });
});

// ---------- Auth (basic, sandbox-mode placeholder) ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  const namePart = email.split('@')[0];
  const displayName = namePart
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  res.json({
    token,
    user: {
      email,
      name: displayName,
      role: 'auditor'
    }
  });
});

// ---------- Reports (Timeliness Tracker) ----------
app.get('/api/reports', (_req, res) => {
  res.json(memoryDb.reports);
});

app.post('/api/reports', (req, res) => {
  const newReport = {
    id: `rep-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...req.body
  };
  memoryDb.reports.push(newReport);
  res.status(201).json({ report: newReport });
});

// ---------- Exceptions ----------
app.get('/api/exceptions', (_req, res) => {
  res.json(memoryDb.exceptions);
});

// ---------- KPI Dictionary ----------
app.get('/api/kpi-dictionary', (_req, res) => {
  res.json(memoryDb.kpiDictionary);
});

// ---------- Reconciliation ----------
app.post(
  '/api/reconcile',
  upload.fields([{ name: 'misFile' }, { name: 'glFile' }]),
  (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const misFile = files?.misFile?.[0];
      const glFile = files?.glFile?.[0];
      const threshold = parseFloat(req.body?.materiality) || 2.0;
      if (!misFile || !glFile) {
        return res.status(400).json({ error: 'Both misFile and glFile are required' });
      }

      const result = analyzeReconciliation(misFile.buffer, glFile.buffer, threshold);
res.json({ reconciliation: result });
    } catch (err) {
      console.error('Reconciliation error:', err);
      res.status(500).json({ error: 'Failed to process reconciliation' });
    }
  }
);

// ---------- Formula Integrity ----------
app.post('/api/formula-audit', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    const result = analyzeFormulaIntegrity(req.file.buffer);
    res.json(result);
  } catch (err) {
    console.error('Formula audit error:', err);
    res.status(500).json({ error: 'Failed to process formula audit' });
  }
});

// ---------- Manual Override Detection ----------
app.post(
  '/api/override-check',
  upload.fields([{ name: 'currentFile' }, { name: 'previousFile' }]),
  (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const currentFile = files?.currentFile?.[0];
      const previousFile = files?.previousFile?.[0];

      if (!currentFile) {
        return res.status(400).json({ error: 'currentFile is required' });
      }

      const result = detectManualOverrides(
        currentFile.buffer,
        previousFile ? previousFile.buffer : null
      );
      res.json(result);
    } catch (err) {
      console.error('Override check error:', err);
      res.status(500).json({ error: 'Failed to process override check' });
    }
  }
);

// ---------- KPI Consistency ----------
app.post('/api/kpi-check', upload.array('files'), (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const periods = JSON.parse(req.body?.periods || '[]');

    const buffers = files.map((f, idx) => ({
      buffer: f.buffer,
      period: periods[idx] || `Period ${idx + 1}`
    }));

    const result = analyzeKpis(buffers);
    res.json(result);
  } catch (err) {
    console.error('KPI check error:', err);
    res.status(500).json({ error: 'Failed to process KPI check' });
  }
});

// ---------- Error handler (no stack traces leaked) ----------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  const { isSandbox } = getSupabase();
  console.log(`🚀 MIS Audit backend running on port ${PORT}`);
  console.log(`📦 Database mode: ${isSandbox ? 'Local Sandbox (in-memory)' : 'Supabase (connected)'}`);
  console.log(`🌐 Allowed frontend origin: ${FRONTEND_URL}`);
});