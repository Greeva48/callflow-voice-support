'use client';
import { useState, useEffect } from 'react';
import { Plus, Megaphone, Upload, Play, Square, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { getCampaigns, saveCampaign, generateId } from '@/lib/store';
import { Campaign } from '@/lib/types';

function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [form, setForm] = useState({ name: '', agentId: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('bolna_agent_id') || '';
    setForm(f => ({ ...f, agentId: id }));
  }, []);

  const sampleCsv = `contact_number,name,company\n+919876543210,John Smith,Acme Corp\n+919876543211,Jane Doe,Beta Ltd\n+919876543212,Bob Johnson,Gamma Inc`;

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
  };

  const submit = async () => {
    if (!form.name) { setError('Campaign name is required.'); return; }
    if (!form.agentId) { setError('No agent configured. Go to Agent Config first.'); return; }
    if (!file) { setError('Please upload a CSV file.'); return; }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agent_id', form.agentId);
      formData.append('campaign_name', form.name);

      const res = await fetch('/api/batches', { method: 'POST', body: formData });
      const data = await res.json();

      const campaign: Campaign = {
        id: generateId(),
        name: form.name,
        agentId: form.agentId,
        status: 'running',
        totalContacts: 0,
        completed: 0,
        qualified: 0,
        createdAt: new Date().toISOString(),
        batchId: data.batch_id || data.id,
      };
      saveCampaign(campaign);
      onCreated(campaign);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>New Campaign</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted)' }}>Upload a CSV of leads and the AI agent will call them all.</p>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#ef4444' }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Name *</label>
            <input className="input" placeholder="Q1 Sales Outreach" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent ID</label>
            <input className="input" placeholder="Configure in Agent Config" value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CSV File * (must have contact_number column)</label>
              <button onClick={downloadSample} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Download sample</button>
            </div>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 28, borderRadius: 10, border: '2px dashed var(--border)', cursor: 'pointer',
              background: file ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
              borderColor: file ? 'rgba(16,185,129,0.4)' : 'var(--border)',
              transition: 'all 0.2s',
            }}>
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
              <Upload size={22} color={file ? '#10b981' : 'var(--text-muted)'} />
              <div style={{ marginTop: 8, fontSize: 14, color: file ? '#10b981' : 'var(--text-secondary)', fontWeight: 500 }}>
                {file ? file.name : 'Click to upload CSV'}
              </div>
              {file && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>}
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><div className="spinner" /> Launching...</> : <><Play size={14} /> Launch Campaign</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onUpdate }: { campaign: Campaign; onUpdate: (c: Campaign) => void }) {
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!campaign.batchId) return;
    setLoading(true);
    try {
      const data = await fetch(`/api/batches/${campaign.batchId}`).then(r => r.json());
      const updated = { ...campaign, status: data.status || campaign.status };
      saveCampaign(updated);
      onUpdate(updated);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const stop = async () => {
    if (!campaign.batchId) return;
    setLoading(true);
    try {
      await fetch(`/api/batches/${campaign.batchId}`, { method: 'POST' });
      const updated = { ...campaign, status: 'stopped' as const };
      saveCampaign(updated);
      onUpdate(updated);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const progress = campaign.totalContacts > 0 ? (campaign.completed / campaign.totalContacts) * 100 : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{campaign.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Created {new Date(campaign.createdAt).toLocaleDateString()}
            {campaign.batchId && <span> • Batch: {campaign.batchId.substring(0, 8)}...</span>}
          </div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>{campaign.completed} / {campaign.totalContacts || '?'} called</span>
          <span>{campaign.qualified} qualified</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-secondary" onClick={refresh} disabled={loading} style={{ fontSize: 12, padding: '5px 12px' }}>
          <RefreshCw size={13} /> Refresh
        </button>
        {campaign.status === 'running' && (
          <button className="btn-danger" onClick={stop} disabled={loading} style={{ fontSize: 12, padding: '5px 12px' }}>
            <Square size={13} /> Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { setCampaigns(getCampaigns()); }, []);

  const update = (c: Campaign) => setCampaigns(cs => cs.map(x => x.id === c.id ? c : x));

  return (
    <div className="page">
      {showNew && <NewCampaignModal onClose={() => setShowNew(false)} onCreated={c => setCampaigns(cs => [c, ...cs])} />}

      <PageHeader
        title="Campaigns"
        subtitle="Run bulk AI calling campaigns with CSV uploads"
        action={<button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15} /> New Campaign</button>}
      />

      {/* How it works */}
      <div className="card" style={{
        padding: '16px 20px', marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))',
        borderColor: 'rgba(139,92,246,0.2)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>How Campaigns Work</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { n: '1', label: 'Upload CSV', desc: 'CSV with contact_number column' },
            { n: '2', label: 'AI Calls', desc: 'Bolna agent calls each lead' },
            { n: '3', label: 'Qualifies', desc: 'Agent scores and qualifies leads' },
            { n: '4', label: 'Results', desc: 'View outcomes in Call History' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#8b5cf6', flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <Megaphone size={40} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No campaigns yet</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Launch your first AI calling campaign to reach hundreds of leads automatically.</div>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15} /> Create First Campaign</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c} onUpdate={update} />)}
        </div>
      )}

      {/* Stats summary */}
      {campaigns.length > 0 && (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Campaigns', value: campaigns.length },
            { label: 'Running', value: campaigns.filter(c => c.status === 'running').length },
            { label: 'Completed', value: campaigns.filter(c => c.status === 'completed').length },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
