'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, Bot, ChevronDown,
  Loader2, CheckCircle, XCircle, Clock, MessageSquare, Wifi, WifiOff, User
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Agent {
  id: string;
  agent_id?: string; // alias, may not be present
  agent_name: string;
  agent_welcome_message?: string;
}

interface CallState {
  status: 'idle' | 'calling' | 'connected' | 'ended' | 'failed';
  executionId?: string;
  duration?: number;
  transcript?: string;
  cost?: number;
  callStatus?: string;
}

type AudioBar = { height: number; speed: number };

function Waveform({ active }: { active: boolean }) {
  const bars = 28;
  const [heights, setHeights] = useState<AudioBar[]>(
    Array.from({ length: bars }, () => ({ height: 8, speed: 0.5 + Math.random() * 1.5 }))
  );

  useEffect(() => {
    if (!active) {
      setHeights(h => h.map(b => ({ ...b, height: 8 })));
      return;
    }
    const interval = setInterval(() => {
      setHeights(h => h.map(b => ({
        ...b,
        height: 8 + Math.random() * 52,
      })));
    }, 120);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 64 }}>
      {heights.map((b, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: b.height,
            borderRadius: 2,
            background: active
              ? `hsl(${210 + i * 2}, 80%, ${50 + b.height / 2}%)`
              : 'var(--border)',
            transition: active ? `height ${b.speed * 0.12}s ease` : 'height 0.4s ease',
          }}
        />
      ))}
    </div>
  );
}

function Timer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return <span style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 2 }}>{m}:{s}</span>;
}

function AgentSelector({ agents, selected, onSelect, loading }: {
  agents: Agent[]; selected: Agent | null; onSelect: (a: Agent) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '12px 16px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--text-primary)', fontSize: 14,
          transition: 'border-color 0.2s',
          borderColor: open ? '#3b82f6' : 'var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: selected ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} color={selected ? '#3b82f6' : 'var(--text-muted)'} />
          </div>
          {loading ? (
            <span style={{ color: 'var(--text-muted)' }}>Loading agents...</span>
          ) : selected ? (
            <div>
              <div style={{ fontWeight: 600 }}>{selected.agent_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Support Agent</div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Select an agent...</span>
          )}
        </div>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && agents.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, marginTop: 4, zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {agents.map(a => (
            <button
              key={a.id || a.agent_id}
              onClick={() => { onSelect(a); setOpen(false); }}
              style={{
                width: '100%', padding: '12px 16px',
                background: (selected?.id || selected?.agent_id) === (a.id || a.agent_id) ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                color: 'var(--text-primary)', fontSize: 14,
                textAlign: 'left', transition: 'background 0.15s',
                borderBottom: '1px solid rgba(30,45,74,0.5)',
              }}
              onMouseEnter={e => { if ((selected?.id || selected?.agent_id) !== (a.id || a.agent_id)) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if ((selected?.id || selected?.agent_id) !== (a.id || a.agent_id)) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Bot size={14} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{a.agent_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Support Agent</div>
              </div>
              {(selected?.id || selected?.agent_id) === (a.id || a.agent_id) && (
                <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptLine({ line }: { line: { role: 'agent' | 'user'; text: string } }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      flexDirection: line.role === 'user' ? 'row-reverse' : 'row',
      marginBottom: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: line.role === 'agent' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
        border: `1px solid ${line.role === 'agent' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {line.role === 'agent' ? <Bot size={13} color="#3b82f6" /> : <User size={13} color="#8b5cf6" />}
      </div>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
        background: line.role === 'agent' ? 'rgba(59,130,246,0.08)' : 'rgba(139,92,246,0.08)',
        border: `1px solid ${line.role === 'agent' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)'}`,
        fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6,
        borderBottomLeftRadius: line.role === 'agent' ? 4 : 12,
        borderBottomRightRadius: line.role === 'user' ? 4 : 12,
      }}>
        {line.text}
      </div>
    </div>
  );
}

export default function TalkPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [phone, setPhone] = useState('');
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [muted, setMuted] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<{ role: 'agent' | 'user'; text: string }[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load agents
  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        const list: Agent[] = Array.isArray(d) ? d : (d.agents || d.data || []);
        setAgents(list);
        // Auto-select default agent
        const defaultId = process.env.NEXT_PUBLIC_DEFAULT_AGENT_ID || 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269';
        const def = list.find(a => (a.id || a.agent_id) === defaultId) || list[0];
        if (def) setSelectedAgent(def);
      })
      .catch(() => {})
      .finally(() => setAgentsLoading(false));
  }, []);

  const parseTranscript = (raw: string) => {
    if (!raw) return [];
    const lines: { role: 'agent' | 'user'; text: string }[] = [];
    const parts = raw.split(/\n+/).filter(Boolean);
    for (const part of parts) {
      if (part.toLowerCase().startsWith('agent:')) {
        lines.push({ role: 'agent', text: part.replace(/^agent:/i, '').trim() });
      } else if (part.toLowerCase().startsWith('user:') || part.toLowerCase().startsWith('human:')) {
        lines.push({ role: 'user', text: part.replace(/^(user|human):/i, '').trim() });
      } else if (lines.length) {
        lines[lines.length - 1].text += ' ' + part.trim();
      }
    }
    return lines;
  };

  const pollExecution = useCallback(async (executionId: string) => {
    try {
      const data = await fetch(`/api/executions/${executionId}`).then(r => r.json());
      const status = data.status?.toLowerCase() || '';

      if (data.transcript) {
        setTranscriptLines(parseTranscript(data.transcript));
        if (transcriptRef.current) {
          transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
      }

      if (['success', 'completed'].includes(status)) {
        setCallState(prev => ({
          ...prev, status: 'ended', callStatus: status,
          duration: data.conversation_time, transcript: data.transcript,
          cost: data.total_cost,
        }));
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (['failed', 'no-answer', 'busy', 'cancelled'].includes(status)) {
        setCallState(prev => ({ ...prev, status: 'failed', callStatus: status }));
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (['in-progress', 'in_progress', 'connected', 'answered'].includes(status)) {
        setCallState(prev => ({ ...prev, status: 'connected', callStatus: status }));
      }
    } catch { /* keep polling */ }
  }, []);

  const startCall = async () => {
    if (!selectedAgent || !phone.trim()) return;
    setCallState({ status: 'calling' });
    setTranscriptLines([]);

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent.id || selectedAgent.agent_id,
          recipient_phone_number: phone.trim(),
          user_data: {},
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const execId = data.execution_id || data.id || data.call_id;
      setCallState({ status: 'calling', executionId: execId });

      // Start polling for status
      pollRef.current = setInterval(() => pollExecution(execId), 3000);
      // Initial poll after 5s
      setTimeout(() => pollExecution(execId), 5000);
    } catch (e: unknown) {
      setCallState({ status: 'failed', callStatus: e instanceof Error ? e.message : 'Failed to initiate call' });
    }
  };

  const endCall = async () => {
    if (callState.executionId) {
      try {
        await fetch(`/api/calls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stop: true, execution_id: callState.executionId }),
        });
      } catch { /* noop */ }
    }
    if (pollRef.current) clearInterval(pollRef.current);
    setCallState(prev => ({ ...prev, status: 'ended' }));
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setCallState({ status: 'idle' });
    setTranscriptLines([]);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const isActive = callState.status === 'calling' || callState.status === 'connected';
  const isConnected = callState.status === 'connected';

  return (
    <div className="page" style={{ maxWidth: 980, margin: '0 auto' }}>
      <PageHeader
        title="Talk to Agent"
        subtitle="Select a Bolna AI agent, enter your phone number, and get called live"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Setup + Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Agent selector */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              1. Choose Agent
            </div>
            <AgentSelector agents={agents} selected={selectedAgent} onSelect={setSelectedAgent} loading={agentsLoading} />
            {selectedAgent?.agent_welcome_message && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.12)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                &ldquo;{selectedAgent.agent_welcome_message}&rdquo;
              </div>
            )}
          </div>

          {/* Phone number */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              2. Your Phone Number
            </div>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={isActive}
              />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Include country code. The AI agent will call this number.
            </div>
          </div>

          {/* Call button / status */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            {callState.status === 'idle' && (
              <button
                onClick={startCall}
                disabled={!selectedAgent || !phone.trim()}
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  color: 'white', fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: (!selectedAgent || !phone.trim()) ? 0.5 : 1,
                  transition: 'opacity 0.2s, transform 0.1s',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                }}
                onMouseEnter={e => { if (selectedAgent && phone.trim()) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
              >
                <Phone size={20} />
                Call Me Now
              </button>
            )}

            {callState.status === 'calling' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                  <Loader2 size={22} color="#f59e0b" style={{ animation: 'spin-slow 1s linear infinite' }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>Connecting call...</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  The AI agent is calling <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
                </div>
                <button onClick={endCall} className="btn-danger" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                  <PhoneOff size={16} /> Cancel
                </button>
              </div>
            )}

            {callState.status === 'connected' && (
              <div>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Wifi size={14} /> Live — Agent is talking
                </div>
                <Timer running={true} />
                <div style={{ margin: '16px 0' }}>
                  <Waveform active={true} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => setMuted(p => !p)}
                    style={{
                      padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)',
                      background: muted ? 'rgba(239,68,68,0.15)' : 'var(--bg-secondary)',
                      color: muted ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
                    }}
                  >
                    {muted ? <MicOff size={16} /> : <Mic size={16} />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={endCall} style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: '#ef4444', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600,
                  }}>
                    <PhoneOff size={16} /> End Call
                  </button>
                </div>
              </div>
            )}

            {callState.status === 'ended' && (
              <div>
                <CheckCircle size={40} color="#10b981" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>Call Completed</div>
                {callState.duration && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {Math.floor(callState.duration / 60)}m {callState.duration % 60}s
                  </div>
                )}
                {callState.cost !== undefined && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Cost: ${callState.cost.toFixed(4)}</div>
                )}
                <button onClick={reset} className="btn-primary" style={{ margin: '0 auto' }}>
                  <Phone size={15} /> New Call
                </button>
              </div>
            )}

            {callState.status === 'failed' && (
              <div>
                <XCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Call Failed</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{callState.callStatus}</div>
                <button onClick={reset} className="btn-secondary" style={{ margin: '0 auto' }}>Try Again</button>
              </div>
            )}
          </div>

          {/* Call info */}
          {callState.executionId && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Call Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Execution ID</span>
                  <code style={{ color: '#3b82f6', fontSize: 12 }}>{callState.executionId.substring(0, 16)}...</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span style={{ color: isConnected ? '#10b981' : isActive ? '#f59e0b' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {isConnected ? 'Live' : callState.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Agent</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedAgent?.agent_name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Transcript */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.03))',
          }}>
            <MessageSquare size={16} color="#3b82f6" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Live Transcript</span>
            {isActive && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Live</span>
              </div>
            )}
          </div>

          <div
            ref={transcriptRef}
            style={{ flex: 1, overflowY: 'auto', padding: 20 }}
          >
            {transcriptLines.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {callState.status === 'idle' ? (
                  <>
                    <Volume2 size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Transcript will appear here</div>
                    <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>Start a call to see the live conversation between you and the AI agent.</div>
                  </>
                ) : isActive ? (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Waveform active={false} />
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Waiting for conversation to begin...</div>
                  </>
                ) : (
                  <>
                    <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 14 }}>No transcript available</div>
                  </>
                )}
              </div>
            ) : (
              transcriptLines.map((line, i) => <TranscriptLine key={i} line={line} />)
            )}
          </div>

          {/* Bottom status bar */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            background: 'var(--bg-secondary)',
          }}>
            {isActive ? (
              <>
                <Wifi size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Connected to {selectedAgent?.agent_name}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Updates every 3s</span>
              </>
            ) : callState.status === 'ended' ? (
              <>
                <WifiOff size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Call ended — {transcriptLines.length} lines transcribed</span>
              </>
            ) : (
              <>
                <Volume2 size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Ready to call</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
