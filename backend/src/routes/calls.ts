import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { initiateCall, stopCall, getExecution } from '../lib/bolna';
import { insertCall, updateCall, listCalls, getCallByExecution } from '../lib/supabase';

const router = Router();

const AGENT_ID = process.env.BOLNA_AGENT_ID || 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269';

// ─── POST /call-agent — start a new call ──────────────────────────────────
router.post('/call-agent', async (req: Request, res: Response) => {
  const { phone_number, order_id, user_name } = req.body as {
    phone_number?: string;
    order_id?: string;
    user_name?: string;
  };

  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  // Format: ensure country code
  const phone = phone_number.startsWith('+') ? phone_number : `+${phone_number}`;

  try {
    const bolnaRes = await initiateCall({
      agent_id: AGENT_ID,
      recipient_phone_number: phone,
      user_data: {
        order_id: order_id || '',
        user_name: user_name || '',
        call_source: 'web_app',
      },
    });

    const executionId: string = bolnaRes.execution_id || bolnaRes.id || uuidv4();

    const record = await insertCall({
      execution_id: executionId,
      agent_id: AGENT_ID,
      phone_number: phone,
      status: 'initiated',
      duration: null,
      transcript: null,
      order_id: order_id || null,
      order_status: null,
      cost: null,
    });

    return res.json({
      success: true,
      call_id: record.id,
      execution_id: executionId,
      message: `Call initiated to ${phone}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[call-agent] Bolna error:', msg);

    // Surface trial-account and known Bolna errors as 400 (not 500)
    const isBolnaUserError = /trial|verified|phone|agent|not found/i.test(msg);
    return res.status(isBolnaUserError ? 400 : 500).json({ error: msg });
  }
});

// ─── POST /call-agent/:executionId/stop — stop a call ────────────────────
router.post('/call-agent/:executionId/stop', async (req: Request, res: Response) => {
  const { executionId } = req.params;
  try {
    await stopCall(executionId);
    await updateCall(executionId, { status: 'cancelled' });
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

// ─── GET /calls — list all call logs ─────────────────────────────────────
router.get('/calls', async (_req: Request, res: Response) => {
  try {
    const calls = await listCalls();
    return res.json({ success: true, calls });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

// ─── GET /calls/:executionId — poll call status ───────────────────────────
router.get('/calls/:executionId', async (req: Request, res: Response) => {
  const { executionId } = req.params;

  try {
    // Poll Bolna for latest status
    const bolnaData = await getExecution(executionId).catch(() => null);
    const existing = await getCallByExecution(executionId);

    if (bolnaData) {
      const status = (bolnaData.status || '').toLowerCase();
      const patch: Record<string, unknown> = { status };
      if (bolnaData.transcript) patch.transcript = bolnaData.transcript;
      if (bolnaData.conversation_time) patch.duration = bolnaData.conversation_time;
      if (bolnaData.total_cost) patch.cost = bolnaData.total_cost;

      if (existing) await updateCall(existing.id, patch);
    }

    const updated = await getCallByExecution(executionId);
    return res.json({ success: true, call: updated || bolnaData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

// ─── GET /stats — analytics data ─────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const calls = await listCalls();
    const total = calls.length;
    const completed = calls.filter(c => c.status === 'completed').length;
    const failed = calls.filter(c => ['failed', 'no-answer', 'cancelled'].includes(c.status)).length;
    const avgDuration = calls
      .filter(c => c.duration)
      .reduce((sum, c) => sum + (c.duration || 0), 0) / (completed || 1);
    const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);

    return res.json({
      total_calls: total,
      completed_calls: completed,
      failed_calls: failed,
      answer_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avg_duration_seconds: Math.round(avgDuration),
      total_cost: totalCost.toFixed(4),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

export default router;
