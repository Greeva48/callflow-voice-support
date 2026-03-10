import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import callsRouter from './routes/calls';
import ordersRouter from './routes/orders';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow all localhost origins (any port) + no-origin requests (curl, Postman)
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
<<<<<<< HEAD
    service: 'VoiceAI Support Backend',
=======
    service: 'CallFlow Support Backend',
>>>>>>> 574b1d9171c8309919553197563cafc53c0bdabf
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
    bolna: !!process.env.BOLNA_API_KEY,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/', callsRouter);
app.use('/', ordersRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error handler ─────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`\n🚀 VoiceAI Backend running on http://localhost:${PORT}`);
=======
  console.log(`\n🚀 CallFlow Backend running on http://localhost:${PORT}`);
>>>>>>> 574b1d9171c8309919553197563cafc53c0bdabf
  console.log(`   Bolna API key: ${process.env.BOLNA_API_KEY ? '✓ configured' : '✗ missing'}`);
  console.log(`   Supabase:      ${process.env.SUPABASE_URL ? '✓ configured' : '✗ using in-memory store'}\n`);
});

export default app;
