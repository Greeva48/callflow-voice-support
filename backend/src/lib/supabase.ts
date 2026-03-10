import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null;
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

// ─── In-memory fallback ────────────────────────────────────────────────────
export interface CallRecord {
  id: string;
  execution_id: string | null;
  agent_id: string;
  phone_number: string;
  status: string;
  duration: number | null;
  transcript: string | null;
  order_id: string | null;
  order_status: string | null;
  cost: number | null;
  created_at: string;
}

const memoryStore: CallRecord[] = [
  {
    id: '1',
    execution_id: 'exec_demo_001',
    agent_id: 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269',
    phone_number: '+919876543210',
    status: 'completed',
    duration: 124,
    transcript: 'Agent: Hello! How can I help you with your order today?\nUser: I want to check order ORD-001\nAgent: Your order ORD-001 is out for delivery and will arrive today.',
    order_id: 'ORD-001',
    order_status: 'out_for_delivery',
    cost: 0.0042,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    execution_id: 'exec_demo_002',
    agent_id: 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269',
    phone_number: '+919876543211',
    status: 'completed',
    duration: 87,
    transcript: 'Agent: Hi there! I can help you check your order status.\nUser: Order ORD-002 please.\nAgent: Order ORD-002 has been shipped and is in transit.',
    order_id: 'ORD-002',
    order_status: 'shipped',
    cost: 0.0031,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    execution_id: 'exec_demo_003',
    agent_id: 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269',
    phone_number: '+919876543212',
    status: 'no-answer',
    duration: null,
    transcript: null,
    order_id: null,
    order_status: null,
    cost: 0.0008,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMemoryStore() { return memoryStore; }

// ─── DB helpers ────────────────────────────────────────────────────────────
export async function insertCall(record: Omit<CallRecord, 'id' | 'created_at'>): Promise<CallRecord> {
  const db = getSupabase();
  if (db) {
    const { data, error } = await db.from('calls').insert(record).select().single();
    if (error) throw error;
    return data;
  }
  // fallback
  const row: CallRecord = { ...record, id: String(Date.now()), created_at: new Date().toISOString() };
  memoryStore.unshift(row);
  return row;
}

export async function updateCall(id: string, patch: Partial<CallRecord>): Promise<void> {
  const db = getSupabase();
  if (db) {
    await db.from('calls').update(patch).eq('id', id);
    return;
  }
  const i = memoryStore.findIndex(r => r.id === id);
  if (i >= 0) Object.assign(memoryStore[i], patch);
}

export async function listCalls(): Promise<CallRecord[]> {
  const db = getSupabase();
  if (db) {
    const { data, error } = await db
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }
  return [...memoryStore].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getCallByExecution(executionId: string): Promise<CallRecord | null> {
  const db = getSupabase();
  if (db) {
    const { data } = await db.from('calls').select('*').eq('execution_id', executionId).single();
    return data || null;
  }
  return memoryStore.find(r => r.execution_id === executionId) || null;
}
