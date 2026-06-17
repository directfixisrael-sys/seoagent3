import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testWordPressConnection } from '@/lib/wordpress';

export async function GET() {
  const database = db();
  const rows = database.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach((r) => { settings[r.key] = r.value; });

  // מסתיר סיסמאות
  if (settings['wp_app_password']) settings['wp_app_password'] = '••••••••';

  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const database = db();

    const upsert = database.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    for (const [key, value] of Object.entries(body)) {
      if (value !== '••••••••') {
        upsert.run(key, String(value));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'שגיאה' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  // בדיקת חיבור WordPress
  const isConnected = await testWordPressConnection();
  return NextResponse.json({ connected: isConnected });
}
