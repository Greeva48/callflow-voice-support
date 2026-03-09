import { NextResponse } from 'next/server';
import { getExecution, getExecutionLog } from '@/lib/bolna';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const log = url.searchParams.get('log') === 'true';
  try {
    const data = log ? await getExecutionLog(params.id) : await getExecution(params.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
