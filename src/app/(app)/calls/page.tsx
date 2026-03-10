'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Clock, Phone, DollarSign } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

interface Execution {
  id: string;
  status: string;
  conversation_time?: number;
  total_cost?: number;
  transcript?: string;
  recipient_phone_number?: string;
  created_at?: string;
  retry_count?: number;
}

function TranscriptModal({ execution, onClose }: { execution: Execution; onClose: () => void }) {
  const [log, setLog] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/executions/${execution.id}?log=true`)
      .then(r => r.json())
      .then(d => setLog(typeof d === 'string' ? d : JSON.stringify(d, null, 2)))
      .catch(() => setLog('Failed to load log'))
      .finally(() => setLoading(false));
  }, [execution.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Call Details</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>ID: {execution.id}</div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '6px 12px' }}>Close</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Status', value: <StatusBadge status={execution.status} /> },
            { label: 'Duration', value: execution.conversation_time ? `${Math.floor(execution.conversation_time / 60)}m ${execution.conversation_time % 60}s` : '—' },
            { label: 'Cost', value: execution.total_cost ? `$${execution.total_cost.toFixed(4)}` : '—' },
          ].map(s => (
            <div key={s.label} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Transcript */}
        {execution.transcript && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transcript</div>
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 8, padding: 14,
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
              maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)',
            }}>
              {execution.transcript}
            </div>
          </div>
        )}

        {/* Raw log */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Raw Log</div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: 16 }}>
              <div className="spinner" /> Loading...
            </div>
          ) : (
            <pre style={{
              background: 'var(--bg-secondary)', borderRadius: 8, padding: 14,
              fontSize: 12, color: '#94a3b8', overflow: 'auto', flex: 1,
              border: '1px solid var(--border)', margin: 0, fontFamily: 'monospace',
              maxHeight: 250,
            }}>
              {log}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutionRow({ exec }: { exec: Execution }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<Execution | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (detail) return;
    try {
      const d = await fetch(`/api/executions/${exec.id}`).then(r => r.json());
      setDetail(d);
    } catch { /* noop */ }
  }, [exec.id, detail]);

  const toggle = () => {
    setExpanded(p => !p);
    fetchDetail();
  };

  const e = detail || exec;

  return (
    <>
      {showModal && detail && <TranscriptModal execution={detail} onClose={() => setShowModal(false)} />}
      <tr style={{ cursor: 'pointer' }} onClick={toggle}>
        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{e.id.substring(0, 12)}...</td>
        <td>{e.recipient_phone_number || '—'}</td>
        <td><StatusBadge status={e.status} /></td>
        <td style={{ color: 'var(--text-secondary)' }}>
          {e.conversation_time ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} />
              {Math.floor(e.conversation_time / 60)}m {e.conversation_time % 60}s
            </div>
          ) : '—'}
        </td>
        <td style={{ color: 'var(--text-secondary)' }}>
          {e.total_cost !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <DollarSign size={13} />
              ${e.total_cost.toFixed(4)}
            </div>
          ) : '—'}
        </td>
        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={ev => { ev.stopPropagation(); fetchDetail().then(() => setShowModal(true)); }}
              style={{ fontSize: 12, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
            >
              Details
            </button>
            {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
          </div>
        </td>
      </tr>
      {expanded && e.transcript && (
        <tr>
          <td colSpan={7} style={{ background: 'rgba(59,130,246,0.03)', paddingTop: 0, paddingBottom: 0 }}>
            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, borderLeft: '3px solid rgba(59,130,246,0.3)', marginLeft: 16, marginBottom: 12 }}>
              <strong style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Transcript Preview</strong>
              {e.transcript.substring(0, 400)}{e.transcript.length > 400 ? '...' : ''}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CallsPage() {
  const [agentId, setAgentId] = useState('');
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = localStorage.getItem('bolna_agent_id') || '';
    setAgentId(id);
    if (id) loadExecutions(id, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExecutions = async (id: string, p: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetch(`/api/agents/${id}/executions?page=${p}&page_size=20`).then(r => r.json());
      const list = Array.isArray(data) ? data : (data.executions || data.data || []);
      setExecutions(list);
      setPage(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Call History"
        subtitle="All AI voice calls made through your Bolna agent"
        action={
          <button className="btn-secondary" onClick={() => agentId && loadExecutions(agentId, page)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} /> Refresh
          </button>
        }
      />

      {!agentId ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Phone size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No Agent Configured</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Configure your Bolna agent to see call history.</div>
          <a href="/agent" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Go to Agent Config</a>
        </div>
      ) : error ? (
        <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
          {error}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {executions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Calls', value: executions.length, color: '#3b82f6' },
                { label: 'Successful', value: executions.filter(e => e.status === 'success').length, color: '#10b981' },
                { label: 'No Answer', value: executions.filter(e => e.status === 'no-answer' || e.status === 'failed').length, color: '#ef4444' },
                { label: 'Avg Duration', value: (() => {
                  const withTime = executions.filter(e => e.conversation_time);
                  if (!withTime.length) return '—';
                  const avg = Math.round(withTime.reduce((s, e) => s + (e.conversation_time || 0), 0) / withTime.length);
                  return `${Math.floor(avg / 60)}m ${avg % 60}s`;
                })(), color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: 16, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 32, color: 'var(--text-muted)' }}>
                <div className="spinner" /> Loading call history...
              </div>
            ) : executions.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Phone size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
<<<<<<< HEAD
                <div>No calls yet. Go to <a href="/leads" style={{ color: '#3b82f6' }}>Leads</a> to initiate your first call.</div>
=======
                <div>No calls recorded yet. Start your first AI support call to see real-time transcripts and analytics. <a href="/call" style={{ color: '#3b82f6' }}>Start a call →</a></div>
>>>>>>> 574b1d9171c8309919553197563cafc53c0bdabf
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map(e => <ExecutionRow key={e.id} exec={e} />)}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {executions.length >= 20 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" disabled={page <= 1} onClick={() => loadExecutions(agentId, page - 1)}>Previous</button>
              <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>Page {page}</span>
              <button className="btn-secondary" onClick={() => loadExecutions(agentId, page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
