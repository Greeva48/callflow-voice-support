'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, Trash2, Search, RefreshCw, User, Building2, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { getLeads, saveLead, deleteLead, generateId } from '@/lib/store';
import { Lead } from '@/lib/types';

const STATUSES: Lead['status'][] = ['new', 'called', 'qualified', 'disqualified', 'callback'];

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', company: '', email: '' });
  const [error, setError] = useState('');

  const submit = () => {
    if (!form.name || !form.phone || !form.company) { setError('Name, phone, and company are required.'); return; }
    const lead: Lead = {
      id: generateId(),
      name: form.name,
      phone: form.phone,
      company: form.company,
      email: form.email,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    saveLead(lead);
    onAdd(lead);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add New Lead</h2>
        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'John Smith', icon: <User size={14} /> },
            { key: 'phone', label: 'Phone Number *', placeholder: '+91 98765 43210', icon: <Phone size={14} /> },
            { key: 'company', label: 'Company *', placeholder: 'Acme Corp', icon: <Building2 size={14} /> },
            { key: 'email', label: 'Email', placeholder: 'john@acme.com', icon: <Mail size={14} /> },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {f.label}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{f.icon}</span>
                <input
                  className="input"
                  style={{ paddingLeft: 32 }}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}><Plus size={15} /> Add Lead</button>
        </div>
      </div>
    </div>
  );
}

function CallModal({ lead, onClose, onCalled }: { lead: Lead; onClose: () => void; onCalled: (l: Lead) => void }) {
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setAgentId(localStorage.getItem('bolna_agent_id') || '');
  }, []);

  const call = async () => {
    if (!agentId) { setResult({ success: false, message: 'No agent configured. Go to Agent Config first.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          recipient_phone_number: lead.phone,
          user_data: { name: lead.name, company: lead.company, email: lead.email || '' },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const updated: Lead = { ...lead, status: 'called', executionId: data.execution_id || data.id };
      saveLead(updated);
      onCalled(updated);
      setResult({ success: true, message: `Call initiated! Execution ID: ${data.execution_id || data.id || 'N/A'}` });
    } catch (e: unknown) {
      setResult({ success: false, message: e instanceof Error ? e.message : 'Call failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Initiate AI Call</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted)' }}>The Bolna AI agent will call this lead now.</p>

        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{lead.company}</div>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6, fontWeight: 500 }}>{lead.phone}</div>
        </div>

        {!agentId && (
          <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#f59e0b' }}>
            No agent configured. <a href="/agent" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Configure one first.</a>
          </div>
        )}

        {result && (
          <div style={{
            padding: '12px 14px',
            background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 8, marginBottom: 16, fontSize: 13,
            color: result.success ? '#10b981' : '#ef4444',
          }}>
            {result.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {!result?.success && (
            <button className="btn-primary" onClick={call} disabled={loading || !agentId}>
              {loading ? <><div className="spinner" /> Calling...</> : <><Phone size={15} /> Call Now</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [callLead, setCallLead] = useState<Lead | null>(null);

  const load = useCallback(() => setLeads(getLeads()), []);
  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  const updateStatus = (lead: Lead, status: Lead['status']) => {
    const updated = { ...lead, status };
    saveLead(updated);
    setLeads(ls => ls.map(l => l.id === lead.id ? updated : l));
  };

  const remove = (id: string) => {
    deleteLead(id);
    setLeads(ls => ls.filter(l => l.id !== id));
  };

  const counts: Record<string, number> = {
    all: leads.length,
    ...Object.fromEntries(STATUSES.map(s => [s, leads.filter(l => l.status === s).length])),
  };

  return (
    <div className="page">
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={l => setLeads(ls => [l, ...ls])} />}
      {callLead && (
        <CallModal
          lead={callLead}
          onClose={() => setCallLead(null)}
          onCalled={updated => setLeads(ls => ls.map(l => l.id === updated.id ? updated : l))}
        />
      )}

      <PageHeader
        title="Leads"
        subtitle="Manage and call your sales leads with the AI voice agent"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={load}><RefreshCw size={14} /></button>
            <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Lead</button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'All'], ...STATUSES.map(s => [s, s.charAt(0).toUpperCase() + s.slice(1)])].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: filter === val ? 600 : 400,
              background: filter === val ? 'rgba(59,130,246,0.15)' : 'transparent',
              borderColor: filter === val ? 'rgba(59,130,246,0.4)' : 'var(--border)',
              color: filter === val ? '#3b82f6' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {label} <span style={{ opacity: 0.7, fontSize: 11 }}>({counts[val] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" style={{ paddingLeft: 36 }} placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Score</th>
              <th>Added</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  {leads.length === 0 ? 'No leads yet. Click "Add Lead" to get started.' : 'No leads match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.name}</div>
                    {lead.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.email}</div>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{lead.company}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{lead.phone}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead, e.target.value as Lead['status'])}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        outline: 'none',
                        color: 'inherit',
                      }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <StatusBadge status={lead.status} />
                  </td>
                  <td>
                    {lead.score !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${lead.score}%`, height: '100%', background: lead.score >= 70 ? '#10b981' : lead.score >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{lead.score}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setCallLead(lead)}
                        title="Call with AI agent"
                        style={{
                          padding: '5px 10px', borderRadius: 6,
                          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                          color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500,
                        }}
                      >
                        <Phone size={13} /> Call
                      </button>
                      <button
                        onClick={() => remove(lead.id)}
                        title="Delete lead"
                        style={{
                          padding: '5px 8px', borderRadius: 6,
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                          color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {filtered.length} of {leads.length} leads
        </div>
      )}
    </div>
  );
}
