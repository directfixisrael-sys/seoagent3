export type ArticleStatus =
  | 'planned'
  | 'generating'
  | 'publishing'
  | 'published'
  | 'failed';

export interface Article {
  id: number;
  title: string;
  slug: string;
  keyword: string;
  secondary_keywords: string;
  status: ArticleStatus;
  seo_score: number | null;
  word_count: number | null;
  wp_post_id: number | null;
  wp_url: string | null;
  image_url: string | null;
  image_prompt: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  gsc_clicks: number | null;
  gsc_impressions: number | null;
  gsc_position: number | null;
  gsc_ctr: number | null;
  error_message: string | null;
  content_preview: string | null;
}

export interface ScheduledArticle {
  id: number;
  keyword: string;
  secondary_keywords: string;
  target_date: string;
  priority: 'high' | 'medium' | 'low';
  notes: string | null;
  status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
}

export interface DashboardStats {
  total: number;
  published: number;
  planned: number;
  failed: number;
  avg_seo_score: number;
  total_clicks: number;
  total_impressions: number;
  avg_position: number;
}

export interface GenerateRequest {
  keyword: string;
  secondary_keywords?: string;
  scheduled_date?: string;
  notes?: string;
}

export interface WordPressConfig {
  url: string;
  username: string;
  app_password: string;
}

export interface GSCData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
