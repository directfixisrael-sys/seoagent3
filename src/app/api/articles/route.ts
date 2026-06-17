export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, secondary_keywords = '', scheduled_date, notes = '' } = body;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'חסרה מילת מפתח' }, { status: 400 });
    }

    const database = db();
    const result = database.prepare(`
      INSERT INTO articles (keyword, secondary_keywords, status, scheduled_date)
      VALUES (?, ?, 'planned', ?)
    `).run(keyword.trim(), secondary_keywords.trim(), scheduled_date || null);

    const articleId = result.lastInsertRowid as number;

    // הרץ pipeline ברקע
    runFullPipeline(articleId).catch(console.error);

    return NextResponse.json({
      success: true,
      articleId,
      message: `מאמר על "${keyword}" נוצר ויפורסם אוטומטית`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const database = db();
  const articles = database.prepare(`
    SELECT * FROM articles
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json(articles);
}
