'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setVal(Math.round(p * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed:     { color: '#00D4FF', bg: 'rgba(0,212,255,0.1)',   label: 'Completed' },
  'no-answer':   { color: '#636e72', bg: 'rgba(99,110,114,0.1)',  label: 'No Answer' },
  failed:        { color: '#e17055', bg: 'rgba(225,112,85,0.1)',  label: 'Failed' },
  initiated:     { color: '#fdcb6e', bg: 'rgba(253,203,110,0.1)', label: 'Initiated' },
};

interface RecentCall {
  id: string; phone_number: string; status: string;
  order_id: string | null; created_at: string;
}

function FeatureCard({ emoji, title, description, accent }: {
  emoji: string; title: string; description: string; accent: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '28px 26px', borderRadius: 18, cursor: 'default',
        background: hov ? 'rgba(20,26,42,0.95)' : 'rgba(20,26,42,0.6)',
        border: `1px solid ${hov ? accent + '44' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(20px)', transition: 'all 0.25s',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 24px 60px rgba(0,0,0,0.4), 0 0 40px ${accent}18` : '0 4px 20px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: hov ? 1 : 0.4, transition: 'opacity 0.25s' }} />
      <div style={{ fontSize: 28, marginBottom: 18, lineHeight: 1 }}>{emoji}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.3px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.65)', margin: 0, lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/calls')
      .then(r => r.json()).then(d => setRecentCalls((d.calls || []).slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', position: 'relative', overflowX: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.13) 0%, transparent 70%)', top: '-250px', left: '-250px', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', bottom: '-150px', right: '-150px', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(108,92,231,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', background: 'rgba(11,15,25,0.85)', position: 'sticky', top: 0, zIndex: 100 }}>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #f8fafc, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CallFlow
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/dashboard" style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.75)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>Dashboard</Link>
            <Link href="/call" style={{ padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', color: 'white', textDecoration: 'none', boxShadow: '0 0 22px rgba(108,92,231,0.4)' }}>Talk to AI</Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: '110px 48px 80px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 100, background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.28)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a29bfe', marginBottom: 36 }}>
            Powered by Bolna AI Voice Technology
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 6.5vw, 76px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1.03, margin: '0 0 28px', background: 'linear-gradient(150deg, #f8fafc 30%, rgba(148,163,184,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Customer Support Calls<br />
            <span style={{ background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Resolve Order Issues Instantly</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(148,163,184,0.65)', maxWidth: 540, margin: '0 auto 52px', lineHeight: 1.85 }}>
            Instant AI-powered voice calls to check order status, resolve issues, and get real-time support — 24/7, no hold music, no frustration.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/call"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 14, fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', color: 'white', textDecoration: 'none', boxShadow: '0 0 40px rgba(108,92,231,0.5), 0 8px 32px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 60px rgba(108,92,231,0.65), 0 14px 40px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px rgba(108,92,231,0.5), 0 8px 32px rgba(0,0,0,0.3)'; }}
            >
              Start AI Call &rarr;
            </Link>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 28px', borderRadius: 14, fontSize: 16, fontWeight: 600, color: 'rgba(148,163,184,0.85)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,26,42,0.5)', backdropFilter: 'blur(20px)' }}>
              View Dashboard
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            {['No hold time', 'Available 24/7', 'Instant response', 'Order tracking', 'Secure & private'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 100, fontSize: 12, fontWeight: 500, color: 'rgba(148,163,184,0.55)', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ color: '#00b894', fontSize: 10 }}>&#10003;</span> {t}
              </span>
            ))}
          </div>
        </section>

        {/* Stats bar */}
        <section style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(20,26,42,0.35)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
            {[
              { label: 'Calls Processed', value: <><CountUp end={142} /></> },
              { label: 'Avg Response Time', value: '1.8s' },
              { label: 'Resolution Rate', value: <><CountUp end={91} suffix="%" /></> },
              { label: 'Satisfaction Score', value: <><CountUp end={487} suffix="/500" /></> },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(20,26,42,0.8)', border: '1px solid rgba(108,92,231,0.15)', backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.55)' }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '88px 48px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C5CE7', marginBottom: 16 }}>CAPABILITIES</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, background: 'linear-gradient(135deg, #f8fafc 30%, rgba(148,163,184,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Enterprise-grade voice AI<br />for customer support
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
            <FeatureCard emoji="📞" accent="#6C5CE7" title="Real Voice Calls" description="AI agent calls your customer's phone number directly. No apps, no browsers — just a natural phone conversation powered by Bolna AI." />
            <FeatureCard emoji="📦" accent="#00D4FF" title="Live Order Tracking" description="The agent collects an order ID and instantly queries your database, delivering accurate status updates in real time during the call." />
            <FeatureCard emoji="🧠" accent="#a29bfe" title="Intelligent NLU" description="Natural language understanding handles diverse customer phrasings, accents, and queries without scripted responses or decision trees." />
            <FeatureCard emoji="🔒" accent="#00b894" title="Secure & Compliant" description="All calls are encrypted in transit. No customer data is stored without consent. GDPR and SOC 2 compliant infrastructure." />
            <FeatureCard emoji="📊" accent="#fdcb6e" title="Analytics Dashboard" description="Track call volumes, resolution rates, average handle time, and customer satisfaction scores across all interactions." />
            <FeatureCard emoji="🌍" accent="#e17055" title="24/7 Availability" description="No shift limits, no lunch breaks, no sick days. Your AI support agent is available around the clock across time zones." />
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: '88px 48px', background: 'rgba(20,26,42,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00D4FF', marginBottom: 16 }}>HOW IT WORKS</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, background: 'linear-gradient(135deg, #f8fafc 30%, rgba(148,163,184,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                From click to call in 3 steps
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              {[
                { step: '01', title: 'Enter your phone', desc: 'Provide your number on the call page. No account required.', color: '#6C5CE7' },
                { step: '02', title: 'AI calls you', desc: 'Bolna AI initiates a real voice call to your number within seconds.', color: '#00D4FF' },
                { step: '03', title: 'Get your answer', desc: 'The agent queries your order status and responds conversationally.', color: '#00b894' },
              ].map(({ step, title, desc, color }) => (
                <div key={step} style={{ padding: '32px 28px', borderRadius: 18, background: 'rgba(20,26,42,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color, background: `${color}14`, padding: '4px 10px', borderRadius: 6, border: `1px solid ${color}28`, display: 'inline-block', marginBottom: 18 }}>STEP {step}</div>
                  <h3 style={{ fontSize: 21, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-0.5px' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.6)', margin: 0, lineHeight: 1.75 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent interactions */}
        {recentCalls.length > 0 && (
          <section style={{ padding: '88px 48px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C5CE7', marginBottom: 10 }}>LIVE ACTIVITY</div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', margin: 0, background: 'linear-gradient(135deg, #f8fafc 30%, rgba(148,163,184,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Recent Interactions</h2>
              </div>
              <Link href="/dashboard" style={{ fontSize: 13, color: '#6C5CE7', textDecoration: 'none', fontWeight: 600 }}>View all &rarr;</Link>
            </div>
            <div style={{ background: 'rgba(20,26,42,0.6)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Phone', 'Order ID', 'Status', 'Time'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                ))}
              </div>
              {recentCalls.map((call, i) => {
                const s = STATUS_CONFIG[call.status] || STATUS_CONFIG['initiated'];
                const ago = Math.round((Date.now() - new Date(call.created_at).getTime()) / 60000);
                return (
                  <div key={call.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: i < recentCalls.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 500, fontFamily: 'monospace' }}>{call.phone_number.replace(/(\+\d{2})(\d+)(\d{4})/, '$1****$3')}</div>
                    <div style={{ fontSize: 13, color: call.order_id ? '#a29bfe' : 'rgba(148,163,184,0.3)', fontFamily: 'monospace' }}>{call.order_id || '—'}</div>
                    <div><span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: s.bg, color: s.color, border: `1px solid ${s.color}28`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span></div>
                    <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>{ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ padding: '88px 48px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'linear-gradient(180deg, transparent, rgba(108,92,231,0.04))' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-2px', margin: '0 0 20px', background: 'linear-gradient(135deg, #f8fafc 30%, rgba(148,163,184,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ready to experience<br />
            <span style={{ background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI voice support?</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(148,163,184,0.55)', margin: '0 auto 44px', maxWidth: 460, lineHeight: 1.7 }}>Start a live call right now. No signup, no credit card.</p>
          <Link href="/call"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 44px', borderRadius: 14, fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg, #6C5CE7, #00D4FF)', color: 'white', textDecoration: 'none', boxShadow: '0 0 60px rgba(108,92,231,0.5), 0 12px 48px rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
          >
            Start AI Call &rarr;
          </Link>
        </section>

        {/* Footer */}
        <footer style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(148,163,184,0.35)' }}>
          <span>CallFlow — Powered by <span style={{ color: '#6C5CE7' }}>Bolna AI</span></span>
          <span>Next.js + Express + Supabase</span>
        </footer>

      </div>
      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  );
}
