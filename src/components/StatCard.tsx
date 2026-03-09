import React from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: { value: number; label: string };
}

const colorMap = {
  blue: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: '#3b82f6' },
  green: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '#10b981' },
  purple: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: '#8b5cf6' },
  orange: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '#f59e0b' },
};

export default function StatCard({ label, value, sub, icon, color, trend }: Props) {
  const c = colorMap[color];
  return (
    <div className="card animate-fade-in" style={{ padding: 20, borderTop: `2px solid ${c.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
          {trend && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 12,
                color: trend.value >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 600,
              }}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trend.label}</span>
            </div>
          )}
        </div>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.icon,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
