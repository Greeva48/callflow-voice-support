'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Agent { id: string; agent_id?: string; agent_name: string; agent_welcome_message?: string; }
interface CallState { status: 'idle' | 'calling' | 'connected' | 'ended' | 'failed'; callId?: string; executionId?: string; duration?: number; cost?: number; errorMsg?: string; }
interface OrderResult { id: string; product: string; status: string; estimated_delivery: string; tracking_number: string | null; message: string; }

const ORDER_STATUS_COLORS: Record<string, string> = {
  out_for_delivery: '#00b894', shipped: '#6C5CE7', confirmed: '#00D4FF',
  processing: '#fdcb6e', delivered: '#00b894', cancelled: '#e17055',
};

function Waveform({ active }: { active: boolean }) {
  const [heights, setHeights] = useState<number[]>(Array.from({ length: 32 }, () => 6));
  useEffect(() => {
    if (!active) { setHeights(h => h.map(() => 6)); return; }
    const id = setInterval(() => setHeights(h => h.map(() => 6 + Math.random() * 50)), 100);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 64, justifyContent: 'center' }}>
      {heights.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: active ? '#6366f1' : 'rgba(255,255,255,0.08)', transition: active ? `height ${0.08 + (i % 5) * 0.01}s ease` : 'height 0.4s ease' }} />
      ))}
    </div>
  );
}

function Timer({ running }: { running: boolean }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) { setSec(0); return; }
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return <span style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 800, letterSpacing: 3, color: '#f8fafc' }}>{m}:{s}</span>;
}

function Bubble({ role, text }: { role: 'agent' | 'user'; text: string }) {
  const isAgent = role === 'agent';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isAgent ? 'row' : 'row-reverse', marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: isAgent ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.12)', border: `1px solid ${isAgent ? 'rgba(99,102,241,0.35)' : 'rgba(148,163,184,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isAgent ? '#6366f1' : '#94a3b8' }}>
        {isAgent ? 'AI' : 'Me'}
      </div>
      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.6, background: isAgent ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.06)', border: `1px solid ${isAgent ? 'rgba(99,102,241,0.18)' : 'rgba(148,163,184,0.12)'}`, color: '#f8fafc', borderBottomLeftRadius: isAgent ? 4 : 14, borderBottomRightRadius: isAgent ? 14 : 4 }}>
        {text}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderResult }) {
  const color = ORDER_STATUS_COLORS[order.status] || '#636e72';
  return (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: `${color}08`, border: `1px solid ${color}25`, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{order.id}</span>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color, background: `${color}14`, padding: '3px 8px', borderRadius: 5, border: `1px solid ${color}28` }}>{order.status.replace(/_/g, ' ')}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', marginBottom: 6 }}>{order.product}</div>
      <div style={{ fontSize: 12, color, fontWeight: 600 }}>{order.message}</div>
      {order.tracking_number && <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.35)', marginTop: 6, fontFamily: 'monospace' }}>Tracking: {order.tracking_number}</div>}
    </div>
  );
}

export default function CallPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [muted, setMuted] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<{ role: 'agent' | 'user'; text: string }[]>([]);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => {
      const list: Agent[] = Array.isArray(d) ? d : (d.agents || d.data || []);
      setAgents(list);
      const defId = process.env.NEXT_PUBLIC_DEFAULT_AGENT_ID || 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269';
      setSelectedAgent(list.find(a => (a.id || a.agent_id) === defId) || list[0] || null);
    }).catch(() => {}).finally(() => setAgentsLoading(false));
  }, []);

  const parseTranscript = (raw: string) => {
    if (!raw) return [];
    const lines: { role: 'agent' | 'user'; text: string }[] = [];
    for (const part of raw.split(/\n+/).filter(Boolean)) {
      if (/^agent:/i.test(part)) lines.push({ role: 'agent', text: part.replace(/^agent:/i, '').trim() });
      else if (/^(user|human):/i.test(part)) lines.push({ role: 'user', text: part.replace(/^(user|human):/i, '').trim() });
      else if (lines.length) lines[lines.length - 1].text += ' ' + part.trim();
    }
    return lines;
  };

  const pollStatus = useCallback(async (execId: string) => {
    try {
      const data = await fetch(`${BACKEND}/calls/${execId}`).then(r => r.json());
      const call = data.call || data;
      const status = (call.status || '').toLowerCase();
      if (call.transcript) {
        setTranscriptLines(parseTranscript(call.transcript));
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
      }
      if (['success', 'completed'].includes(status)) { setCallState(prev => ({ ...prev, status: 'ended', duration: call.duration, cost: call.cost })); clearInterval(pollRef.current!); }
      else if (['failed', 'no-answer', 'busy', 'cancelled'].includes(status)) { setCallState(prev => ({ ...prev, status: 'failed', errorMsg: status })); clearInterval(pollRef.current!); }
      else if (['in-progress', 'in_progress', 'connected', 'answered'].includes(status)) { setCallState(prev => ({ ...prev, status: 'connected' })); }
    } catch { /* keep polling */ }
  }, []);

  const startCall = async () => {
    if (!phone.trim()) return;
    setCallState({ status: 'calling' });
    setTranscriptLines([]);
    setOrderResult(null);
    if (orderId.trim()) {
      fetch(`${BACKEND}/order-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId.trim() }) })
        .then(r => r.json()).then(d => { if (d.order) setOrderResult({ ...d.order, message: d.message }); }).catch(() => {});
    }
    try {
      const res = await fetch(`${BACKEND}/call-agent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number: phone.trim(), order_id: orderId.trim() || undefined }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const execId: string = data.execution_id;
      setCallState({ status: 'calling', callId: data.call_id, executionId: execId });
      pollRef.current = setInterval(() => pollStatus(execId), 3000);
      setTimeout(() => pollStatus(execId), 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initiate call';
      const isNetworkError = /fetch|network/i.test(msg);
      setCallState({
        status: 'failed',
        errorMsg: isNetworkError
          ? "Couldn't reach the server. Start the backend with: cd backend && npm run dev (port 3001)."
          : msg,
      });
    }
  };

  const endCall = () => {
    if (callState.executionId) fetch(`${BACKEND}/call-agent/${callState.executionId}/stop`, { method: 'POST' }).catch(() => {});
    clearInterval(pollRef.current!);
    setCallState(prev => ({ ...prev, status: 'ended' }));
  };
  const reset = () => { clearInterval(pollRef.current!); setCallState({ status: 'idle' }); setTranscriptLines([]); setOrderResult(null); };
  useEffect(() => () => clearInterval(pollRef.current!), []);

  const isActive = callState.status === 'calling' || callState.status === 'connected';
  const isConnected = callState.status === 'connected';

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ padding: 22, borderRadius: 18, background: 'rgba(20,26,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', ...extra }}>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: '#0B0F19' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.5)', textDecoration: 'none' }}>&larr; Back</Link>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: '#f8fafc' }}>AI Voice Support</span>
        </div>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 8px', color: '#f8fafc' }}>Talk to AI Support</h1>
          <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.5)', margin: 0 }}>Enter your phone number — the AI agent will call you instantly</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Agent selector */}
            {card(<>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 12 }}>AI Agent</div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setAgentOpen(p => !p)} style={{ width: '100%', padding: '11px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: `1px solid ${agentOpen ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc', fontSize: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#6366f1' }}>AI</div>
                    {agentsLoading ? <span style={{ color: 'rgba(148,163,184,0.45)' }}>Loading agents...</span>
                      : selectedAgent ? <div><div style={{ fontWeight: 600 }}>{selectedAgent.agent_name}</div><div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 1 }}>Support Agent</div></div>
                      : <span style={{ color: 'rgba(148,163,184,0.45)' }}>Select agent</span>}
                  </div>
                  <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 12, transform: agentOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>&#9650;</span>
                </button>
                {agentOpen && agents.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, borderRadius: 12, background: 'rgba(11,15,25,0.98)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                    {agents.map(a => (
                      <button key={a.id || a.agent_id} onClick={() => { setSelectedAgent(a); setAgentOpen(false); }} style={{ width: '100%', padding: '11px 14px', background: (selectedAgent?.id || selectedAgent?.agent_id) === (a.id || a.agent_id) ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#f8fafc', textAlign: 'left', fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{a.agent_name}</span>
                        {(selectedAgent?.id || selectedAgent?.agent_id) === (a.id || a.agent_id) && <span style={{ marginLeft: 'auto', color: '#00b894', fontSize: 14 }}>&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedAgent?.agent_welcome_message && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.14)', fontSize: 12, color: 'rgba(148,163,184,0.6)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{selectedAgent.agent_welcome_message}&rdquo;
                </div>
              )}
            </>)}

            {/* Inputs */}
            {card(<>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 8 }}>Your Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} disabled={isActive} placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6366f1'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.38)', marginTop: 5 }}>The AI agent will call this number.</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.45)', marginBottom: 8 }}>Order ID <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(optional)</span></label>
                <input value={orderId} onChange={e => setOrderId(e.target.value)} disabled={isActive} placeholder="ORD-001"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6366f1'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.38)', marginTop: 5 }}>Try: ORD-001 through ORD-005</div>
              </div>
            </>)}

            {/* Order result */}
            {orderResult && <OrderCard order={orderResult} />}

            {/* Call control */}
            {card(<>
              {callState.status === 'idle' && (
                <button onClick={startCall} disabled={!phone.trim()} style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: phone.trim() ? 'pointer' : 'not-allowed', background: phone.trim() ? '#6366f1' : 'rgba(99,102,241,0.35)', color: 'white', fontSize: 16, fontWeight: 700, boxShadow: phone.trim() ? '0 4px 12px rgba(0,0,0,0.2)' : 'none', transition: 'all 0.2s' }}>
                  Call Me Now
                </button>
              )}

              {callState.status === 'calling' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fdcb6e', animation: 'pulse 1s ease-in-out infinite' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fdcb6e' }}>Connecting...</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', marginBottom: 16 }}>Calling <span style={{ color: '#f8fafc', fontWeight: 600 }}>{phone}</span></div>
                  <button onClick={endCall} style={{ width: '100%', padding: '11px', borderRadius: 11, border: '1px solid rgba(225,112,85,0.25)', cursor: 'pointer', background: 'rgba(225,112,85,0.1)', color: '#e17055', fontSize: 14, fontWeight: 600 }}>Cancel</button>
                </div>
              )}

              {callState.status === 'connected' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#00b894', marginBottom: 12, letterSpacing: '0.06em' }}>&#9679; LIVE — Agent is talking</div>
                  <Timer running={true} />
                  <div style={{ margin: '16px 0' }}><Waveform active={true} /></div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => setMuted(p => !p)} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${muted ? 'rgba(225,112,85,0.3)' : 'rgba(255,255,255,0.08)'}`, background: muted ? 'rgba(225,112,85,0.1)' : 'rgba(255,255,255,0.04)', color: muted ? '#e17055' : 'rgba(148,163,184,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {muted ? 'Unmute' : 'Mute'}
                    </button>
                    <button onClick={endCall} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#e17055', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>End Call</button>
                  </div>
                </div>
              )}

              {callState.status === 'ended' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,184,148,0.14)', border: '1px solid rgba(0,184,148,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: '#00b894' }}>&#10003;</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#00b894', marginBottom: 6 }}>Call Completed</div>
                  {callState.duration && <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', marginBottom: 4 }}>{Math.floor(callState.duration / 60)}m {callState.duration % 60}s</div>}
                  {callState.cost !== undefined && <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', marginBottom: 20 }}>Cost: ${callState.cost.toFixed(4)}</div>}
                  <button onClick={reset} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>New Call</button>
                </div>
              )}

              {callState.status === 'failed' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(225,112,85,0.14)', border: '1px solid rgba(225,112,85,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: '#e17055' }}>&#10007;</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#e17055', marginBottom: 8 }}>Call Failed</div>
                  <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginBottom: 12, lineHeight: 1.6 }}>{callState.errorMsg}</div>
                  {/trial|verified/i.test(callState.errorMsg || '') && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(253,203,110,0.07)', border: '1px solid rgba(253,203,110,0.18)', fontSize: 12, color: '#fdcb6e', marginBottom: 16, lineHeight: 1.7, textAlign: 'left' }}>
                      <strong>Bolna trial:</strong> Only verified numbers can receive calls.<br />
                      Go to <strong>bolna.ai &rarr; Settings &rarr; Phone Numbers</strong> to verify yours.
                    </div>
                  )}
                  <button onClick={reset} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.8)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Try Again</button>
                </div>
              )}
            </>)}

            {/* Call details */}
            {callState.executionId && (
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(20,26,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(148,163,184,0.35)', marginBottom: 10 }}>Call Details</div>
                {[['Agent', selectedAgent?.agent_name || '—'], ['Status', isConnected ? 'Live' : callState.status], ['ID', callState.executionId.substring(0, 20) + '...']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'rgba(148,163,184,0.4)' }}>{k}</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — transcript */}
          <div style={{ borderRadius: 18, background: 'rgba(20,26,42,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 560, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Live Transcript</span>
              {isActive && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b894', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, color: '#00b894', fontWeight: 700 }}>LIVE</span>
                </div>
              )}
            </div>
            <div ref={transcriptRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
              {transcriptLines.length === 0 ? (
                <div style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,0.3)', textAlign: 'center', gap: 10 }}>
                  {callState.status === 'idle' ? (
                    <>
                      <div style={{ fontSize: 36, opacity: 0.3 }}>&#128172;</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(148,163,184,0.45)' }}>Transcript will appear here</div>
                      <div style={{ fontSize: 13, maxWidth: 280, lineHeight: 1.7 }}>Start a call to see the real-time conversation with the AI agent.</div>
                    </>
                  ) : isActive ? (
                    <><Waveform active={false} /><div style={{ marginTop: 10, fontSize: 14 }}>Waiting for conversation...</div></>
                  ) : (
                    <><div style={{ fontSize: 28, opacity: 0.3 }}>&#128172;</div><div style={{ marginTop: 8, fontSize: 14 }}>No transcript available</div></>
                  )}
                </div>
              ) : (
                transcriptLines.map((line, i) => <Bubble key={i} role={line.role} text={line.text} />)
              )}
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: 'rgba(11,15,25,0.4)' }}>
              {isActive ? (
                <><span style={{ color: '#00b894' }}>&#9679;</span><span style={{ color: '#00b894' }}>Connected — {selectedAgent?.agent_name}</span></>
              ) : callState.status === 'ended' ? (
                <span style={{ color: 'rgba(148,163,184,0.4)' }}>Call ended — {transcriptLines.length} lines</span>
              ) : (
                <span style={{ color: 'rgba(148,163,184,0.3)' }}>Ready to call</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
