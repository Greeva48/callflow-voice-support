'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bot, Save, RefreshCw, CheckCircle, AlertCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Agent {
  agent_id: string;
  agent_name: string;
  agent_welcome_message: string;
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

function AgentCard({ agent, isActive, onSelect }: { agent: Agent; isActive: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding: 18,
        borderColor: isActive ? 'rgba(59,130,246,0.4)' : 'var(--border)',
        background: isActive ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(p => !p)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isActive ? '#3b82f6' : 'var(--text-muted)',
            border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{agent.agent_name}</div>
<<<<<<< HEAD
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{agent.agent_id}</div>
=======
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Agent</div>
>>>>>>> 574b1d9171c8309919553197563cafc53c0bdabf
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isActive ? (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
              Active
            </span>
          ) : (
            <button
              className="btn-secondary"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={e => { e.stopPropagation(); onSelect(); }}
            >
              Use This
            </button>
          )}
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Welcome Message</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{agent.agent_welcome_message || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Webhook URL</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{agent.webhook_url || '—'}</div>
            </div>
          </div>
          {agent.created_at && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Created {new Date(agent.created_at).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    welcomeMessage: 'Hello! I\'m an AI assistant calling from LeadIQ. I\'d like to ask you a few quick questions to better understand your needs. Is this a good time to chat?',
    webhookUrl: '',
    prompt: 'You are a professional sales qualification AI agent. Your goal is to qualify leads by understanding their budget, timeline, authority, and needs (BANT). Ask questions naturally and conversationally. Be polite and professional. At the end of the call, summarize whether the lead is qualified or not.',
  });
  const [createLoading, setCreateLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetch('/api/agents').then(r => r.json());
      const list = Array.isArray(data) ? data : (data.agents || data.data || []);
      setAgents(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const defaultId = process.env.NEXT_PUBLIC_DEFAULT_AGENT_ID || 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269';
    const id = localStorage.getItem('bolna_agent_id') || defaultId;
    if (!localStorage.getItem('bolna_agent_id')) {
      localStorage.setItem('bolna_agent_id', defaultId);
    }
    setActiveAgentId(id);
    loadAgents();
  }, [loadAgents]);

  const selectAgent = (id: string) => {
    localStorage.setItem('bolna_agent_id', id);
    setActiveAgentId(id);
    setSuccess(`Agent ${id} set as active.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const createAgent = async () => {
    if (!createForm.name) { setError('Agent name is required.'); return; }
    setCreateLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_config: {
            agent_name: createForm.name,
            agent_welcome_message: createForm.welcomeMessage,
            webhook_url: createForm.webhookUrl || undefined,
            tasks: [
              {
                task_type: 'conversation',
                tools_config: {
                  llm_agent: {
                    model: 'gpt-4o-mini',
                    max_tokens: 200,
                    agent_flow_type: 'streaming',
                  },
                },
              },
            ],
          },
          agent_prompts: {
            task_1: {
              system_prompt: createForm.prompt,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(`Agent created! ID: ${data.agent_id || data.id}`);
      setShowCreate(false);
      loadAgents();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create agent');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Agent Configuration"
        subtitle="Manage your Bolna AI voice agents"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={loadAgents} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} /> Refresh
            </button>
            <button className="btn-primary" onClick={() => setShowCreate(p => !p)}>
              <Plus size={15} /> New Agent
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#10b981', display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Active agent info */}
      {activeAgentId && (
        <div className="card" style={{
          padding: '14px 18px', marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.05))',
          borderColor: 'rgba(59,130,246,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Agent ID:</span>
            <code style={{ fontSize: 13, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 4 }}>{activeAgentId}</code>
          </div>
        </div>
      )}

      {/* Create agent form */}
      {showCreate && (
        <div className="card" style={{ padding: 24, marginBottom: 24, borderColor: 'rgba(59,130,246,0.2)' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Agent</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Name *</label>
              <input className="input" placeholder="LeadIQ Sales Agent" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Webhook URL</label>
              <input className="input" placeholder="https://your-domain.com/webhook" value={createForm.webhookUrl} onChange={e => setCreateForm(f => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Welcome Message</label>
            <textarea className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} value={createForm.welcomeMessage} onChange={e => setCreateForm(f => ({ ...f, welcomeMessage: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Prompt</label>
            <textarea className="input" rows={5} style={{ resize: 'vertical', fontFamily: 'inherit' }} value={createForm.prompt} onChange={e => setCreateForm(f => ({ ...f, prompt: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={createAgent} disabled={createLoading}>
              {createLoading ? <><div className="spinner" /> Creating...</> : <><Bot size={15} /> Create Agent</>}
            </button>
          </div>
        </div>
      )}

      {/* Agents list */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Your Agents {agents.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({agents.length})</span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 24, color: 'var(--text-muted)' }}>
            <div className="spinner" /> Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Bot size={36} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No agents found</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Create your first Bolna AI voice agent or enter an existing agent ID.</div>
            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Or set agent ID manually:</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Enter Bolna agent ID" value={activeAgentId} onChange={e => setActiveAgentId(e.target.value)} />
                <button className="btn-primary" onClick={() => selectAgent(activeAgentId)} style={{ whiteSpace: 'nowrap' }}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agents.map(a => (
              <AgentCard key={a.agent_id} agent={a} isActive={activeAgentId === a.agent_id} onSelect={() => selectAgent(a.agent_id)} />
            ))}
          </div>
        )}

        {/* Manual ID entry */}
        {agents.length > 0 && (
          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Set Agent ID Manually</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Paste Bolna agent ID"
                value={activeAgentId}
                onChange={e => setActiveAgentId(e.target.value)}
              />
              <button className="btn-primary" onClick={() => selectAgent(activeAgentId)}>
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="card" style={{ padding: 20, marginTop: 24, borderColor: 'rgba(139,92,246,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>API Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Base URL</div>
            <code style={{ fontSize: 13, color: '#8b5cf6' }}>https://api.bolna.ai</code>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Auth</div>
            <code style={{ fontSize: 13, color: '#8b5cf6' }}>Bearer bn-59e2...d46d</code>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Calls Endpoint</div>
            <code style={{ fontSize: 13, color: '#3b82f6' }}>POST /call</code>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Executions</div>
            <code style={{ fontSize: 13, color: '#3b82f6' }}>GET /executions/:id</code>
          </div>
        </div>
      </div>
    </div>
  );
}
