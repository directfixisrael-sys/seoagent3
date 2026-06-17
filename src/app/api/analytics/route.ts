export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSiteOverview, getTopKeywords } from '@/lib/gsc';

export async function GET() {
  const database = db();

  const stats = database.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'planned' OR status = 'generating' THEN 1 ELSE 0 END) as planned,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      AVG(CASE WHEN seo_score IS NOT NULL THEN seo_score END) as avg_seo_score,
      SUM(COALESCE(gsc_clicks, 0)) as total_clicks,
      SUM(COALESCE(gsc_impressions, 0)) as total_impressions,
      AVG(CASE WHEN gsc_position IS NOT NULL THEN gsc_position END) as avg_position
    FROM articles
  `).get() as Record<string, number>;

  const recentArticles = database.prepare(`
    SELECT id, title, keyword, status, seo_score, word_count, wp_url,
           published_at, created_at, gsc_clicks, gsc_impressions, gsc_position,
           error_message, content_preview
    FROM articles
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  const upcomingSchedule = database.prepare(`
    SELECT * FROM schedule
    WHERE status = 'pending'
    ORDER BY target_date ASC
    LIMIT 5
  `).all();

  const statusBreakdown = database.prepare(`
    SELECT status, COUNT(*) as count
    FROM articles
    GROUP BY status
  `).all();

  // GSC data
  const gscSite = database
    .prepare("SELECT value FROM settings WHERE key = 'gsc_site_url'")
    .get() as { value: string } | undefined;

  let gscTimeline = null;
  let topKeywords: {keyword:string;clicks:number;impressions:number;ctr:number;position:number}[] = [];

  if (gscSite?.value) {
    [gscTimeline, topKeywords] = await Promise.all([
      getSiteOverview(gscSite.value, 14).catch(() => null),
      getTopKeywords(gscSite.value, 10).catch(() => []),
    ]);
  }

  return NextResponse.json({
    stats: {
      ...stats,
      avg_seo_score: Math.round(stats.avg_seo_score || 0),
      avg_position: Math.round((stats.avg_position || 0) * 10) / 10,
    },
    recentArticles,
    upcomingSchedule,
    statusBreakdown,
    gscTimeline,
    topKeywords,
  });
}
