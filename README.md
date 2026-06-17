# SEO Pro — Phone Fix Agent

## הגדרה מהירה

### 1. Supabase — הרץ את ה-SQL הזה ב-SQL Editor

```sql
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT, slug TEXT, keyword TEXT NOT NULL,
  secondary_keywords TEXT DEFAULT '',
  status TEXT DEFAULT 'planned',
  seo_score INTEGER, word_count INTEGER,
  wp_post_id INTEGER, wp_url TEXT,
  image_url TEXT, image_prompt TEXT,
  scheduled_date DATE, published_at TIMESTAMPTZ,
  gsc_clicks INTEGER, gsc_impressions INTEGER,
  gsc_position REAL, gsc_ctr REAL,
  error_message TEXT, content_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  secondary_keywords TEXT DEFAULT '',
  target_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium',
  notes TEXT, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. משתני סביבה ב-Railway

```
ANTHROPIC_API_KEY        = sk-ant-...
OPENAI_API_KEY           = sk-...         (אופציונלי - לתמונות)
SUPABASE_URL             = https://xxx.supabase.co
SUPABASE_SERVICE_KEY     = eyJ...
WP_URL                   = https://my-site.co.il
WP_USERNAME              = admin
WP_APP_PASSWORD          = xxxx xxxx xxxx xxxx
```

### 3. הרצה מקומית
```bash
npm install
cp .env.example .env.local
npm run dev
```
