import 'server-only';
import { db } from './db';
import { generateArticle, generateImage, calculateSeoScore } from './generator';
import { publishToWordPress, uploadImageToWordPress } from './wordpress';
import { getKeywordPerformance } from './gsc';

export async function runFullPipeline(articleId: number): Promise<void> {
  const database = db();

  const article = database
    .prepare('SELECT * FROM articles WHERE id = ?')
    .get(articleId) as { keyword: string; secondary_keywords: string } | undefined;

  if (!article) throw new Error(`Article ${articleId} not found`);

  const updateStatus = (status: string, extra: Record<string, unknown> = {}) => {
    const sets = ['status = ?', ...Object.keys(extra).map((k) => `${k} = ?`)];
    const vals = [status, ...Object.values(extra), articleId];
    database.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  };

  try {
    // שלב 1: יצירת תוכן
    updateStatus('generating');

    const siteContext = database
      .prepare("SELECT value FROM settings WHERE key = 'site_context'")
      .get() as { value: string } | undefined;

    const generated = await generateArticle(
      article.keyword,
      article.secondary_keywords,
      siteContext?.value || ''
    );

    const seoScore = calculateSeoScore(generated, article.keyword);

    database.prepare(`
      UPDATE articles SET
        title = ?, slug = ?, content_preview = ?,
        seo_score = ?, word_count = ?, image_prompt = ?
      WHERE id = ?
    `).run(
      generated.title,
      generated.slug,
      generated.preview,
      seoScore,
      generated.wordCount,
      generated.imagePrompt,
      articleId
    );

    // שלב 2: יצירת תמונה
    let featuredMediaId: number | undefined;
    try {
      const imageUrl = await generateImage(generated.imagePrompt);
      database.prepare('UPDATE articles SET image_url = ? WHERE id = ?').run(imageUrl, articleId);

      featuredMediaId = await uploadImageToWordPress(imageUrl, generated.title);
    } catch (imgErr) {
      console.warn('Image generation failed, continuing without image:', imgErr);
    }

    // שלב 3: פרסום לוורדפרס
    updateStatus('publishing');

    const wpPost = await publishToWordPress({
      title: generated.title,
      content: generated.content,
      slug: generated.slug,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      featuredMediaId,
    });

    // שלב 4: עדכון DB
    updateStatus('published', {
      wp_post_id: wpPost.id,
      wp_url: wpPost.link,
      published_at: new Date().toISOString(),
    });

    // שלב 5: GSC data (אופציונלי)
    const gscSite = database
      .prepare("SELECT value FROM settings WHERE key = 'gsc_site_url'")
      .get() as { value: string } | undefined;

    if (gscSite?.value) {
      setTimeout(async () => {
        try {
          const gscData = await getKeywordPerformance(article.keyword, gscSite.value);
          if (gscData) {
            database.prepare(`
              UPDATE articles SET
                gsc_clicks = ?, gsc_impressions = ?, gsc_position = ?, gsc_ctr = ?
              WHERE id = ?
            `).run(gscData.clicks, gscData.impressions, gscData.position, gscData.ctr, articleId);
          }
        } catch { /* GSC errors don't fail the pipeline */ }
      }, 5000);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateStatus('failed', { error_message: msg });
    throw err;
  }
}

export async function processScheduledArticles(): Promise<void> {
  const database = db();
  const today = new Date().toISOString().split('T')[0];

  const due = database.prepare(`
    SELECT * FROM schedule
    WHERE status = 'pending' AND target_date <= ?
    ORDER BY target_date ASC, priority DESC
    LIMIT 3
  `).all(today) as Array<{ id: number; keyword: string; secondary_keywords: string; notes: string }>;

  for (const item of due) {
    database
      .prepare("UPDATE schedule SET status = 'processing' WHERE id = ?")
      .run(item.id);

    try {
      const result = database.prepare(`
        INSERT INTO articles (keyword, secondary_keywords, status, scheduled_date)
        VALUES (?, ?, 'planned', ?)
      `).run(item.keyword, item.secondary_keywords, today);

      const articleId = result.lastInsertRowid as number;
      await runFullPipeline(articleId);

      database
        .prepare("UPDATE schedule SET status = 'done' WHERE id = ?")
        .run(item.id);
    } catch {
      database
        .prepare("UPDATE schedule SET status = 'failed' WHERE id = ?")
        .run(item.id);
    }
  }
}
