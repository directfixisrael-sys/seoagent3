import 'server-only';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'seo-agent.db');

function getDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      scheduled_date TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      gsc_clicks INTEGER,
      gsc_impressions INTEGER,
      gsc_position REAL,
      gsc_ctr REAL,
      error_message TEXT,
      content_preview TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      secondary_keywords TEXT DEFAULT '',
      target_date TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS articles_updated
      AFTER UPDATE ON articles
      BEGIN
        UPDATE articles SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
  `);
}

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (!_db) _db = getDb();
  return _db;
}
