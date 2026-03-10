import { NextResponse } from 'next/server';
import { listAgents, createAgent } from '@/lib/bolna';

export async function GET() {
  try {
    const data = await listAgents();

    return NextResponse.json({
      agents: data
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await createAgent(body);

    return NextResponse.json(data);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
