'use client';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mesh-bg"><div className="mesh-orb3" /></div>
      <div className="grid-pattern" />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', background: 'transparent', position: 'relative' }}>
          {children}
        </main>
      </div>
    </>
  );
}
