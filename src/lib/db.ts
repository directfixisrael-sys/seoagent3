import 'server-only';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return createClient(url, key);
}

export async function initDB() {
  const sb = getSupabase();
  await sb.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS articles (
        id BIGSERIAL PRIMARY KEY,
        title TEXT,
        slug TEXT,
        keyword TEXT NOT NULL,
        secondary_keywords TEXT DEFAULT '',
        status TEXT DEFAULT 'planned',
        seo_score INTEGER,
        word_count INTEGER,
        wp_post_id INTEGER,
        wp_url TEXT,
        image_url TEXT,
        image_prompt TEXT,
        scheduled_date DATE,
        published_at TIMESTAMPTZ,
        gsc_clicks INTEGER,
        gsc_impressions INTEGER,
        gsc_position REAL,
        gsc_ctr REAL,
        error_message TEXT,
        content_preview TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS schedule (
        id BIGSERIAL PRIMARY KEY,
        keyword TEXT NOT NULL,
        secondary_keywords TEXT DEFAULT '',
        target_date DATE NOT NULL,
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });
}

export async function getArticles(limit = 50) {
  const { data } = await getSupabase()
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function createArticle(keyword: string, secondaryKeywords = '', scheduledDate?: string) {
  const { data } = await getSupabase()
    .from('articles')
    .insert({ keyword, secondary_keywords: secondaryKeywords, scheduled_date: scheduledDate || null, status: 'planned' })
    .select()
    .single();
  return data;
}

export async function updateArticle(id: number, updates: Record<string, unknown>) {
  await getSupabase()
    .from('articles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function getStats() {
  const sb = getSupabase();
  const { data } = await sb.from('articles').select('status, seo_score, gsc_clicks, gsc_impressions, gsc_position');
  const rows = data || [];
  return {
    total: rows.length,
    published: rows.filter(r => r.status === 'published').length,
    planned: rows.filter(r => ['planned','generating','publishing'].includes(r.status)).length,
    failed: rows.filter(r => r.status === 'failed').length,
    avg_seo_score: Math.round(rows.filter(r => r.seo_score).reduce((s, r) => s + r.seo_score, 0) / (rows.filter(r => r.seo_score).length || 1)),
    total_clicks: rows.reduce((s, r) => s + (r.gsc_clicks || 0), 0),
    total_impressions: rows.reduce((s, r) => s + (r.gsc_impressions || 0), 0),
    avg_position: Math.round(rows.filter(r => r.gsc_position).reduce((s, r) => s + r.gsc_position, 0) / (rows.filter(r => r.gsc_position).length || 1) * 10) / 10,
  };
}

export async function getSchedule() {
  const { data } = await getSupabase()
    .from('schedule')
    .select('*')
    .order('target_date', { ascending: true });
  return data || [];
}

export async function addScheduleItem(item: { keyword: string; secondary_keywords: string; target_date: string; priority: string; notes: string }) {
  const { data } = await getSupabase().from('schedule').insert(item).select().single();
  return data;
}

export async function deleteScheduleItem(id: number) {
  await getSupabase().from('schedule').delete().eq('id', id);
}

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await getSupabase().from('settings').select('value').eq('key', key).single();
  return data?.value || null;
}

export async function setSettings(updates: Record<string, string>) {
  const sb = getSupabase();
  for (const [key, value] of Object.entries(updates)) {
    await sb.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data } = await getSupabase().from('settings').select('key, value');
  const out: Record<string, string> = {};
  (data || []).forEach(r => { out[r.key] = r.value; });
  return out;
}
