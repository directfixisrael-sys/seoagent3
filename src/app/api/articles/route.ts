export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getArticles, createArticle } from '@/lib/db';
import { runPipeline } from '@/lib/pipeline';

export async function GET() {
  const articles = await getArticles();
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  try {
    const { keyword, secondary_keywords = '', scheduled_date } = await req.json();
    if (!keyword?.trim()) return NextResponse.json({ error: 'חסרה מילת מפתח' }, { status: 400 });

    const article = await createArticle(keyword.trim(), secondary_keywords.trim(), scheduled_date);
    if (!article) return NextResponse.json({ error: 'שגיאה ביצירת מאמר' }, { status: 500 });

    runPipeline(article.id, keyword.trim(), secondary_keywords.trim()).catch(console.error);

    return NextResponse.json({ success: true, articleId: article.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
