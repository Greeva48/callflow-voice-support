'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, PhoneCall, Megaphone, Bot, Zap, Radio } from 'lucide-react';

const nav = [
  { href: '/',          label: 'Dashboard',     icon: LayoutDashboard, group: 'main', highlight: false },
  { href: '/talk',      label: 'Talk to Agent', icon: Radio,            group: 'main', highlight: true  },
  { href: '/leads',     label: 'Leads',         icon: Users,            group: 'main', highlight: false },
  { href: '/calls',     label: 'Call History',  icon: PhoneCall,        group: 'main', highlight: false },
  { href: '/campaigns', label: 'Campaigns',     icon: Megaphone,        group: 'main', highlight: false },
  { href: '/agent',     label: 'Agent Config',  icon: Bot,              group: 'settings', highlight: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 232,
      minWidth: 232,
      height: '100vh',
      background: 'rgba(5, 5, 18, 0.8)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(139,92,246,0.4), transparent)',
      }} />

      {/* Logo */}
      <div style={{ padding: '24px 20px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.15)',
            flexShrink: 0,
          }}>
            <Zap size={19} color="white" />
          </div>
          <div>
            <div style={{
              fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              LeadIQ
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 0, letterSpacing: '0.02em' }}>
              powered by Bolna AI
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '18px 12px', overflowY: 'auto' }}>
        <div className="section-label" style={{ padding: '0 8px 10px' }}>Platform</div>

        {nav.filter(n => n.group === 'main').map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 11px', borderRadius: 10,
                  color: active ? '#818cf8' : highlight ? '#34d399' : 'rgba(148,163,184,0.8)',
                  background: active
                    ? 'rgba(99,102,241,0.12)'
                    : highlight
                    ? 'rgba(16,185,129,0.07)'
                    : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14, transition: 'all 0.15s',
                  border: `1px solid ${active ? 'rgba(99,102,241,0.25)' : highlight ? 'rgba(16,185,129,0.12)' : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 20px rgba(99,102,241,0.08)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLDivElement).style.color = '#f8fafc';
                    (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.background = highlight ? 'rgba(16,185,129,0.07)' : 'transparent';
                    (e.currentTarget as HTMLDivElement).style.color = highlight ? '#34d399' : 'rgba(148,163,184,0.8)';
                    (e.currentTarget as HTMLDivElement).style.border = `1px solid ${highlight ? 'rgba(16,185,129,0.12)' : 'transparent'}`;
                  }
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                {highlight && !active && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                    background: 'rgba(16,185,129,0.15)', color: '#34d399',
                    padding: '2px 7px', borderRadius: 10,
                    border: '1px solid rgba(16,185,129,0.25)',
                    textTransform: 'uppercase',
                  }}>LIVE</span>
                )}
                {active && (
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#818cf8',
                    boxShadow: '0 0 6px rgba(129,140,248,0.8)',
                  }} />
                )}
              </div>
            </Link>
          );
        })}

        <div className="section-label" style={{ padding: '16px 8px 10px' }}>Settings</div>

        {nav.filter(n => n.group === 'settings').map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 11px', borderRadius: 10,
                  color: active ? '#818cf8' : 'rgba(148,163,184,0.8)',
                  background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                  fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s',
                  border: `1px solid ${active ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.color = '#f8fafc'; (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(148,163,184,0.8)'; (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent'; } }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px rgba(129,140,248,0.8)' }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="animate-pulse-dot" style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px rgba(16,185,129,0.7)',
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>API Connected</div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Bolna AI • My New Agent
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
