'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const BACKEND = 'http://localhost:3001';

interface CallRecord {
  id: string;
  execution_id: string | null;
  phone_number: string;
  status: string;
  duration: number | null;
  transcript: string | null;
  order_id: string | null;
  order_status: string | null;
  cost: number | null;
  created_at: string;
}

interface Stats {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  answer_rate: number;
  avg_duration_seconds: number;
  total_cost: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  completed:        { color: '#00b894', bg: 'rgba(0,184,148,0.12)',   label: 'Completed' },
  'no-answer':      { color: '#636e72', bg: 'rgba(99,110,114,0.12)',  label: 'No Answer' },
  failed:           { color: '#e17055', bg: 'rgba(225,112,85,0.12)',  label: 'Failed' },
  cancelled:        { color: '#636e72', bg: 'rgba(99,110,114,0.12)',  label: 'Cancelled' },
  initiated:        { color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', label: 'Initiated' },
  connected:        { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)',   label: 'Live' },
  'in-progress':    { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)',   label: 'Live' },
};

function statusOf(s: string) { return STATUS[s] || { color: '#636e72', bg: 'rgba(99,110,114,0.1)', label: s }; }

function fmtDuration(sec: number | null) {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const ago = (Date.now() - d.getTime()) / 1000;
  if (ago < 60)  return `${Math.round(ago)}s ago`;
  if (ago < 3600) return `${Math.round(ago / 60)}m ago`;
  if (ago < 86400) return `${Math.round(ago / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Dark tooltip ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(11,15,25,0.98)', border: '1px solid rgba(108,92,231,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, backdropFilter: 'blur(20px)' }}>
      {label && <div style={{ color: 'rgba(148,163,184,0.6)', marginBottom: 6 }}>{label}</div>}
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon, from, to, loading }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; from: string; to: string; loading: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: '22px 22px 18px', borderRadius: 18, position: 'relative', overflow: 'hidden',
      background: hov ? 'rgba(20,26,42,0.95)' : 'rgba(20,26,42,0.6)',
      border: `1px solid ${hov ? from + '44' : 'rgba(255,255,255,0.06)'}`,
      backdropFilter: 'blur(20px)', transition: 'all 0.2s',
      transform: hov ? 'translateY(-2px)' : 'none',
      boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.4), 0 0 32px ${from}22` : '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
          {loading ? (
            <div style={{ width: 80, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1.5px', background: `linear-gradient(135deg, #f8fafc, ${from})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
          )}
          <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', marginTop: 4 }}>{sub}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, ${from}20, ${to}10)`, border: `1px solid ${from}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: from, boxShadow: hov ? `0 0 16px ${from}44` : 'none', transition: 'box-shadow 0.2s', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Order lookup widget ────────────────────────────────────────────────────
function OrderLookup() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ order?: { id: string; product: string; status: string; estimated_delivery: string }; message?: string; error?: string } | null>(null);

  const lookup = async () => {
    if (!q.trim()) return;
    setLoading(true); setResult(null);
    try {
      const d = await fetch(`${BACKEND}/order-status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: q.trim() }),
      }).then(r => r.json());
      setResult(d);
    } catch { setResult({ error: 'Failed to reach backend' }); }
    finally { setLoading(false); }
  };

  const statusColor = result?.order ? ({ out_for_delivery: '#00b894', shipped: '#6C5CE7', confirmed: '#00D4FF', processing: '#fdcb6e', delivered: '#00b894', cancelled: '#e17055' } as Record<string, string>)[result.order.status] || '#636e72' : '#636e72';

  return (
    <div style={{ padding: 22, borderRadius: 18, background: 'rgba(20,26,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00D4FF, #6C5CE7)' }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#00D4FF' }}>&#9633;</span> Order Lookup
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="ORD-001" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 13, outline: 'none' }} />
        <button onClick={lookup} disabled={loading} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span> : '⌕'}
        </button>
      </div>
      {result?.error && <div style={{ fontSize: 13, color: '#e17055', padding: '10px 12px', background: 'rgba(225,112,85,0.08)', borderRadius: 8, border: '1px solid rgba(225,112,85,0.2)' }}>{result.error}</div>}
      {result?.order && (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: `${statusColor}08`, border: `1px solid ${statusColor}25` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{result.order.id}</span>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: statusColor, background: `${statusColor}15`, padding: '3px 8px', borderRadius: 5, border: `1px solid ${statusColor}30` }}>{result.order.status.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginBottom: 8 }}>{result.order.product}</div>
          <div style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{result.message}</div>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(148,163,184,0.3)' }}>Available: ORD-001 through ORD-005</div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [callsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND}/calls`).then(r => r.json()),
        fetch(`${BACKEND}/stats`).then(r => r.json()),
      ]);
      setCalls(callsRes.calls || []);
      setStats(statsRes);
    } catch { /* backend offline */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build weekly chart data from calls
  const weeklyData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0).map((_, i) => ({ day: days[i], calls: 0, completed: 0 }));
    calls.forEach(c => {
      const d = new Date(c.created_at).getDay();
      counts[d].calls++;
      if (c.status === 'completed') counts[d].completed++;
    });
    // Rotate to start from 7 days ago
    const today = new Date().getDay();
    return [...counts.slice(today + 1), ...counts.slice(0, today + 1)];
  })();

  const statusDist = [
    { name: 'Completed', value: calls.filter(c => c.status === 'completed').length, color: '#00b894' },
    { name: 'No Answer', value: calls.filter(c => c.status === 'no-answer').length, color: '#636e72' },
    { name: 'Failed',    value: calls.filter(c => c.status === 'failed').length,    color: '#e17055' },
    { name: 'Other',     value: calls.filter(c => !['completed', 'no-answer', 'failed'].includes(c.status)).length, color: '#6C5CE7' },
  ].filter(d => d.value > 0);

  const filtered = calls.filter(c =>
    !search || c.phone_number.includes(search) || (c.order_id || '').toUpperCase().includes(search.toUpperCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>
      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.1) 0%, transparent 70%)', top: '-200px', right: '-100px', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.02, backgroundImage: 'linear-gradient(rgba(108,92,231,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(148,163,184,0.5)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              ← Home
            </Link>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white' }}>
                ◈
              </div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Analytics Dashboard</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => fetchData(true)} disabled={refreshing} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span> Refresh
            </button>
            <Link href="/call" style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              ☎ New Call
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <KPI label="Total Calls" value={stats?.total_calls ?? '—'} sub="All time" icon={<span style={{ fontSize: 18 }}>☎</span>} from="#6C5CE7" to="#a29bfe" loading={loading} />
          <KPI label="Answer Rate" value={stats ? `${stats.answer_rate}%` : '—'} sub="Completed calls" icon={<span style={{ fontSize: 18 }}>↗</span>} from="#00b894" to="#00D4FF" loading={loading} />
          <KPI label="Avg Duration" value={stats ? fmtDuration(stats.avg_duration_seconds) : '—'} sub="Per completed call" icon={<span style={{ fontSize: 18 }}>◷</span>} from="#fdcb6e" to="#e17055" loading={loading} />
          <KPI label="Total Cost" value={stats ? `$${stats.total_cost}` : '—'} sub="Bolna API usage" icon={<span style={{ fontSize: 18 }}>$</span>} from="#00D4FF" to="#6C5CE7" loading={loading} />
        </div>

        {/* Charts + Order lookup */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 20, marginBottom: 28 }}>

          {/* Area chart */}
          <div style={{ padding: 22, borderRadius: 18, background: 'rgba(20,26,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6C5CE7, #00D4FF)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Call Volume</div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', marginBottom: 18 }}>Weekly calls & completions</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b894" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00b894" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,92,231,0.07)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Area type="monotone" dataKey="calls" name="Calls" stroke="#6C5CE7" fill="url(#g1)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#00b894" fill="url(#g2)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div style={{ padding: 22, borderRadius: 18, background: 'rgba(20,26,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00b894, #fdcb6e, #e17055)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Outcome Distribution</div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', marginBottom: 18 }}>Call result breakdown</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusDist} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,92,231,0.07)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="value" name="Calls" radius={[5, 5, 0, 0]}>
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order lookup */}
          <OrderLookup />
        </div>

        {/* Call log table */}
        <div style={{ borderRadius: 18, background: 'rgba(20,26,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6C5CE7, #00D4FF, #00b894)' }} />

          {/* Table header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#6C5CE7', fontSize: 15 }}>▦</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Call Log</span>
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                {filtered.length} records
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.4)', fontSize: 13, pointerEvents: 'none' }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search phone or order..." style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {['Phone', 'Order ID', 'Status', 'Duration', 'Cost', 'Time'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(148,163,184,0.4)' }}>
              <div style={{ fontSize: 28, display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 8 }}>↻</div>
              <div style={{ fontSize: 14 }}>Loading call records...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(148,163,184,0.3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>☎</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No calls recorded yet.</div>
              <div style={{ fontSize: 13, maxWidth: 320, margin: '6px auto 12px', lineHeight: 1.6 }}>Start your first AI support call to see real-time transcripts and analytics.</div>
              <Link href="/call" style={{ color: '#6C5CE7', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Start a call →</Link>
            </div>
          ) : (
            filtered.map((call, i) => {
              const s = statusOf(call.status);
              const isExp = expanded === call.id;
              return (
                <div key={call.id}>
                  <div
                    onClick={() => setExpanded(isExp ? null : call.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                      padding: '13px 24px', cursor: 'pointer', transition: 'background 0.15s',
                      background: isExp ? 'rgba(108,92,231,0.06)' : 'transparent',
                      borderBottom: i < filtered.length - 1 || isExp ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isExp) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isExp) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ fontSize: 13, color: '#f8fafc', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: s.color, fontSize: 11 }}>☎</span>
                      {call.phone_number}
                    </div>
                    <div style={{ fontSize: 12, color: call.order_id ? '#a29bfe' : 'rgba(148,163,184,0.3)', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                      {call.order_id || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 5, background: s.bg, color: s.color, border: `1px solid ${s.color}28` }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ◷ {fmtDuration(call.duration)}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center' }}>
                      {call.cost ? `$${call.cost.toFixed(4)}` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', display: 'flex', alignItems: 'center' }}>
                      {fmtTime(call.created_at)}
                    </div>
                  </div>

                  {isExp && call.transcript && (
                    <div style={{ padding: '16px 24px 20px', background: 'rgba(108,92,231,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(148,163,184,0.4)', marginBottom: 12 }}>Transcript</div>
                      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(11,15,25,0.6)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, lineHeight: 1.8, color: 'rgba(148,163,184,0.75)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto' }}>
                        {call.transcript}
                      </div>
                      {call.order_status && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#6C5CE7', fontSize: 13 }}>⊟</span>
                          <span style={{ fontSize: 12, color: '#a29bfe' }}>Order status: <strong>{call.order_status.replace(/_/g, ' ')}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Success / fail summary */}
        {!loading && calls.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            {[
              { icon: '✓', label: 'Successful Calls', value: stats?.completed_calls ?? 0, color: '#00b894', from: 'rgba(0,184,148,0.15)', border: 'rgba(0,184,148,0.2)' },
              { icon: '✗', label: 'Unsuccessful',    value: stats?.failed_calls ?? 0,    color: '#e17055', from: 'rgba(225,112,85,0.15)', border: 'rgba(225,112,85,0.2)' },
            ].map(item => (
              <div key={item.label} style={{ padding: '16px 20px', borderRadius: 14, background: item.from, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ color: item.color, fontSize: 18, fontWeight: 700 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: item.color, letterSpacing: '-1px' }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 1 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
    </div>
  );
}
