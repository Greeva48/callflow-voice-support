import { NextResponse } from 'next/server';

const BASE_URL = process.env.BOLNA_BASE_URL || 'https://api.bolna.ai';
const API_KEY = process.env.BOLNA_API_KEY || '';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BASE_URL}/batches`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
