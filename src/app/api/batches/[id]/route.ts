import { NextResponse } from 'next/server';
import { getBatch, stopBatch, getBatchExecutions } from '@/lib/bolna';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const executions = url.searchParams.get('executions') === 'true';
  try {
    const data = executions ? await getBatchExecutions(params.id) : await getBatch(params.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await stopBatch(params.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
