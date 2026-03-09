const BASE_URL = process.env.BOLNA_BASE_URL || 'https://api.bolna.ai';
const API_KEY  = process.env.BOLNA_API_KEY  || '';

async function bolnaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    // Extract human-readable message from Bolna's JSON error body
    try {
      const json = JSON.parse(text);
      const msg = json.message || json.detail || json.error || text;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text);
      throw e;
    }
  }

  try { return JSON.parse(text); } catch { return text; }
}

export interface InitiateCallParams {
  agent_id: string;
  recipient_phone_number: string;
  from_phone_number?: string;
  user_data?: Record<string, string | number | boolean>;
}

export function initiateCall(params: InitiateCallParams) {
  return bolnaFetch('/call', { method: 'POST', body: JSON.stringify(params) });
}

export function stopCall(executionId: string) {
  return bolnaFetch(`/call/${executionId}/stop`, { method: 'POST' });
}

export function getExecution(executionId: string) {
  return bolnaFetch(`/executions/${executionId}`);
}

export function listAgents() {
  return bolnaFetch('/v2/agent/all');
}
