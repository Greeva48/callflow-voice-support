import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallFlow — AI Voice Support Platform',
  description: 'AI-powered voice customer support platform built on Bolna AI',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
};

// The root layout is intentionally minimal — full-page routes (/call, /dashboard)
// override with their own layout.tsx. Internal app pages (leads, calls, etc.)
// are wrapped by the (app) group layout below.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#0B0F19' }}>
      <body style={{ background: '#0B0F19', color: '#f8fafc', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

