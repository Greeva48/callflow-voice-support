import { NextResponse } from 'next/server';
import { listAgentExecutions } from '@/lib/bolna';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const pageSize = Number(url.searchParams.get('page_size') || 20);
  try {
    const data = await listAgentExecutions(params.id, page, pageSize);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
