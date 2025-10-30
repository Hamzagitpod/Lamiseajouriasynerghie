
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { z } from 'zod';

import { toPlainText } from './lib/sanitize.js';
import { buildSystemPrompt, enforceGuineaScope } from './lib/guards.js';
import { addTurn, getContext } from './lib/memory.js';
import { askGemini } from './lib/gemini.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigin === '*' || origin === allowedOrigin) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health endpoints
app.get('/healthz', (_, res) => res.status(200).send('ok'));
app.get('/readyz', (_, res) => res.status(200).send('ready'));
app.get('/api/version', (_, res) => res.json({ version: '1.0.0', model: process.env.MODEL_NAME || 'gemini-1.5-pro' }));

const AskSchema = z.object({
  query: z.string().min(3, 'query trop courte'),
  profile: z.string().optional(),
  sessionId: z.string().optional()
});

app.post('/api/ask', async (req, res) => {
  try {
    const parsed = AskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Requête invalide', details: parsed.error.flatten() });
    }
    const { query, profile, sessionId } = parsed.data;

    // Guinea guard
    const scope = enforceGuineaScope(query);
    if (!scope.allowed) {
      const msg = scope.message || "Je ne peux répondre qu'au sujet du droit du travail en Guinée.";
      if (sessionId) addTurn(sessionId, 'assistant', msg);
      return res.status(200).json({ answer: msg });
    }

    // Memory
    const context = getContext(sessionId);
    if (sessionId) addTurn(sessionId, 'user', query);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API_KEY manquante (config Cloud Run/Secret Manager)" });
    }

    const raw = await askGemini({
      apiKey,
      modelName: process.env.MODEL_NAME || 'gemini-1.5-pro',
      systemPrompt: buildSystemPrompt(),
      context,
      query,
      profile
    });

    const answer = toPlainText(raw);
    if (sessionId) addTurn(sessionId, 'assistant', answer);

    return res.status(200).json({ answer });
  } catch (err: any) {
    req.log.error({ err }, 'ask_failed');
    const msg = typeof err?.message === 'string' ? err.message : 'Erreur interne';
    return res.status(500).json({ error: msg });
  }
});

const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, () => {
  logger.info(`Server listening on ${PORT}`);
});
