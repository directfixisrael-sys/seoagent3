export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const database = db();
  const items = database.prepare(`
    SELECT * FROM schedule ORDER BY target_date ASC
  `).all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keyword,
      secondary_keywords = '',
      target_date,
      priority = 'medium',
      notes = '',
    } = body;

    if (!keyword || !target_date) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 });
    }

    const database = db();
    const result = database.prepare(`
      INSERT INTO schedule (keyword, secondary_keywords, target_date, priority, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(keyword, secondary_keywords, target_date, priority, notes);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'שגיאה' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 });

  db().prepare('DELETE FROM schedule WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
