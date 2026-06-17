export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSettings } from '@/lib/db';
import { testConnection } from '@/lib/wordpress';

export async function GET() {
  const settings = await getAllSettings();
  if (settings['wp_app_password']) settings['wp_app_password'] = '••••••••';
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v !== '••••••••' && String(v).trim()) filtered[k] = String(v);
  }
  await setSettings(filtered);
  return NextResponse.json({ success: true });
}

export async function PUT() {
  const ok = await testConnection();
  return NextResponse.json({ connected: ok });
}
