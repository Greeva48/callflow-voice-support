export interface Agent {
  agent_id: string;
  agent_name: string;
  agent_welcome_message: string;
  created_at?: string;
  updated_at?: string;
  webhook_url?: string;
}

export interface Execution {
  id: string;
  agent_id?: string;
  status: 'success' | 'failed' | 'no-answer' | 'busy' | 'queued' | 'in-progress' | string;
  conversation_time?: number;
  transcript?: string;
  total_cost?: number;
  retry_count?: number;
  recipient_phone_number?: string;
  created_at?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  company: string;
  email?: string;
  status: 'new' | 'called' | 'qualified' | 'disqualified' | 'callback';
  score?: number;
  notes?: string;
  executionId?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  agentId: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  totalContacts: number;
  completed: number;
  qualified: number;
  createdAt: string;
  batchId?: string;
}

export interface CallStats {
  totalCalls: number;
  qualifiedLeads: number;
  avgDuration: number;
  successRate: number;
  totalCost: number;
  weeklyCallData: { day: string; calls: number; qualified: number }[];
}
