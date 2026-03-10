import { NextResponse } from 'next/server';
import { initiateCall } from '@/lib/bolna';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await initiateCall(body);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
