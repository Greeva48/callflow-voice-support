const BASE_URL = process.env.BOLNA_BASE_URL || 'https://api.bolna.ai';
const API_KEY = process.env.BOLNA_API_KEY || '';

async function bolnaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bolna API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Agent API ────────────────────────────────────────────────────────────────

export function listAgents() {
  return bolnaFetch('/v2/agent/all');
}

export function getAgent(agentId: string) {
  return bolnaFetch(`/v2/agent/${agentId}`);
}

export function createAgent(body: Record<string, unknown>) {
  return bolnaFetch('/v2/agent', { method: 'POST', body: JSON.stringify(body) });
}

export function updateAgent(agentId: string, body: Record<string, unknown>) {
  return bolnaFetch(`/v2/agent/${agentId}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteAgent(agentId: string) {
  return bolnaFetch(`/v2/agent/${agentId}`, { method: 'DELETE' });
}

// ─── Call API ─────────────────────────────────────────────────────────────────

export function initiateCall(body: {
  agent_id: string;
  recipient_phone_number: string;
  from_phone_number?: string;
  user_data?: Record<string, string>;
}) {
  return bolnaFetch('/call', { method: 'POST', body: JSON.stringify(body) });
}

export function stopCall(executionId: string) {
  return bolnaFetch(`/call/${executionId}/stop`, { method: 'POST' });
}

// ─── Execution API ────────────────────────────────────────────────────────────

export function getExecution(executionId: string) {
  return bolnaFetch(`/executions/${executionId}`);
}

export function getExecutionLog(executionId: string) {
  return bolnaFetch(`/executions/${executionId}/log`);
}

export function listAgentExecutions(agentId: string, page = 1, pageSize = 20) {
  return bolnaFetch(`/v2/agent/${agentId}/executions?page_number=${page}&page_size=${pageSize}`);
}

// ─── Batch API ────────────────────────────────────────────────────────────────

export function getBatch(batchId: string) {
  return bolnaFetch(`/batches/${batchId}`);
}

export function stopBatch(batchId: string) {
  return bolnaFetch(`/batches/${batchId}/stop`, { method: 'POST' });
}

export function getBatchExecutions(batchId: string) {
  return bolnaFetch(`/batches/${batchId}/executions`);
}
