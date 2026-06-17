'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, FileText, Calendar, TrendingUp, Settings,
  Plus, ExternalLink, RefreshCw, AlertCircle,
  CheckCircle, Clock, Loader, ChevronDown, X, Search,
} from 'lucide-react';

type Tab = 'dashboard' | 'articles' | 'schedule' | 'analytics' | 'settings';
type Priority = 'high' | 'medium' | 'low';

interface Article {
  id: number;
  title: string;
  keyword: string;
  status: string;
  seo_score: number | null;
  word_count: number | null;
  wp_url: string | null;
  published_at: string | null;
  created_at: string;
  gsc_clicks: number | null;
  gsc_impressions: number | null;
  gsc_position: number | null;
  error_message: string | null;
  content_preview: string | null;
}

interface ScheduleItem {
  id: number;
  keyword: string;
  secondary_keywords: string;
  target_date: string;
  priority: Priority;
  notes: string | null;
  status: string;
}

interface DashboardData {
  stats: {
    total: number;
    published: number;
    planned: number;
    failed: number;
    avg_seo_score: number;
    total_clicks: number;
    total_impressions: number;
    avg_position: number;
  };
  recentArticles: Article[];
  upcomingSchedule: ScheduleItem[];
  statusBreakdown: { status: string; count: number }[];
  gscTimeline: { date: string; clicks: number; impressions: number }[] | null;
  topKeywords: { keyword: string; clicks: number; impressions: number; position: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planned:    { label: 'מתוכנן',   color: '#6366f1', icon: <Clock size={12} /> },
  generating: { label: 'כותב...',  color: '#f59e0b', icon: <Loader size={12} className="animate-spin" /> },
  publishing: { label: 'מפרסם...', color: '#3b82f6', icon: <Loader size={12} className="animate-spin" /> },
  published:  { label: 'פורסם',    color: '#10b981', icon: <CheckCircle size={12} /> },
  failed:     { label: 'נכשל',     color: '#ef4444', icon: <AlertCircle size={12} /> },
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'גבוה', medium: 'בינוני', low: 'נמוך',
};

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [genForm, setGenForm] = useState({ keyword: '', secondary: '', date: '' });
  const [schedForm, setSchedForm] = useState({
    keyword: '', secondary: '', date: '', priority: 'medium' as Priority, notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [dash, arts, sched, setts] = await Promise.all([
        fetch('/api/analytics').then((r) => r.json()),
        fetch('/api/articles').then((r) => r.json()),
        fetch('/api/articles/schedule').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);
      setData(dash);
      setArticles(arts);
      setSchedule(sched);
      setSettings(setts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!genForm.keyword.trim()) return;
    setGenerating(true);
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: genForm.keyword,
          secondary_keywords: genForm.secondary,
          scheduled_date: genForm.date || undefined,
        }),
      });
      setGenForm({ keyword: '', secondary: '', date: '' });
      setShowGenerate(false);
      setTimeout(fetchData, 1000);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!schedForm.keyword || !schedForm.date) return;
    await fetch('/api/articles/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: schedForm.keyword,
        secondary_keywords: schedForm.secondary,
        target_date: schedForm.date,
        priority: schedForm.priority,
        notes: schedForm.notes,
      }),
    });
    setSchedForm({ keyword: '', secondary: '', date: '', priority: 'medium', notes: '' });
    setShowSchedule(false);
    fetchData();
  };

  const handleDeleteSchedule = async (id: number) => {
    await fetch(`/api/articles/schedule?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const saveSettings = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Zap size={48} className="text-violet-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 text-sm">טוען מערכת SEO Agent...</p>
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans" dir="rtl">
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-56 bg-gray-900 border-l border-gray-800 z-10 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">SEO Agent</p>
              <p className="text-xs text-gray-500">מערכת אוטומטית</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {([
            ['dashboard', 'דשבורד', TrendingUp],
            ['articles', 'מאמרים', FileText],
            ['schedule', 'לוח תוכן', Calendar],
            ['analytics', 'אנליטיקס', BarChart],
            ['settings', 'הגדרות', Settings],
          ] as [Tab, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === id
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={fetchData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={12} />
            רענן נתונים
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="mr-56 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {tab === 'dashboard' && 'דשבורד ראשי'}
              {tab === 'articles' && 'כל המאמרים'}
              {tab === 'schedule' && 'לוח תוכן'}
              {tab === 'analytics' && 'אנליטיקס GSC'}
              {tab === 'settings' && 'הגדרות מערכת'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              עודכן {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {(tab === 'dashboard' || tab === 'articles') && (
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors font-medium"
            >
              <Plus size={15} />
              צור מאמר חדש
            </button>
          )}
          {tab === 'schedule' && (
            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors font-medium"
            >
              <Plus size={15} />
              הוסף לתזמון
            </button>
          )}
        </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'סה"כ מאמרים', value: s?.total || 0, sub: 'במערכת', color: 'text-violet-400' },
                { label: 'פורסמו', value: s?.published || 0, sub: 'בוורדפרס', color: 'text-emerald-400' },
                { label: 'ציון SEO ממוצע', value: `${s?.avg_seo_score || 0}%`, sub: 'מהמאמרים שלך', color: 'text-amber-400' },
                { label: 'קליקים GSC', value: (s?.total_clicks || 0).toLocaleString(), sub: '28 ימים אחרונים', color: 'text-blue-400' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent articles */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-medium text-white">מאמרים אחרונים</h2>
                <button
                  onClick={() => setTab('articles')}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  הצג הכל
                </button>
              </div>
              <div className="divide-y divide-gray-800">
                {(data?.recentArticles || []).slice(0, 6).map((a) => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.planned;
                  return (
                    <div key={a.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {a.title || a.keyword}
                        </p>
                        {a.content_preview && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{a.content_preview}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mr-4 shrink-0">
                        {a.seo_score && (
                          <div className="text-xs text-center">
                            <p className="font-medium text-amber-400">{a.seo_score}%</p>
                            <p className="text-gray-600">SEO</p>
                          </div>
                        )}
                        {a.gsc_clicks !== null && (
                          <div className="text-xs text-center">
                            <p className="font-medium text-blue-400">{a.gsc_clicks}</p>
                            <p className="text-gray-600">קליקים</p>
                          </div>
                        )}
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </div>
                        {a.wp_url && (
                          <a
                            href={a.wp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-300"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!(data?.recentArticles?.length) && (
                  <div className="p-8 text-center text-gray-600">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">אין מאמרים עדיין — צור את הראשון!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming schedule */}
            {(data?.upcomingSchedule?.length ?? 0) > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h2 className="text-sm font-medium text-white">תזמון קרוב</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {data?.upcomingSchedule.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{item.keyword}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmt(item.target_date)}</p>
                      </div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.priority === 'high'
                            ? 'bg-red-900/40 text-red-400'
                            : item.priority === 'medium'
                            ? 'bg-amber-900/40 text-amber-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {PRIORITY_LABELS[item.priority as Priority]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARTICLES TAB */}
        {tab === 'articles' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = articles.filter((a) => a.status === key).length;
                return (
                  <span
                    key={key}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                  >
                    {cfg.label} ({count})
                  </span>
                );
              })}
            </div>
            <div className="divide-y divide-gray-800">
              {articles.map((a) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.planned;
                return (
                  <div key={a.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </div>
                          <span className="text-xs text-gray-600">{fmt(a.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{a.title || a.keyword}</p>
                        {a.error_message && (
                          <p className="text-xs text-red-400 mt-1">{a.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-6 shrink-0 text-center">
                        {a.word_count && (
                          <div>
                            <p className="text-sm font-medium text-white">{a.word_count.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">מילים</p>
                          </div>
                        )}
                        {a.seo_score && (
                          <div>
                            <p className="text-sm font-medium text-amber-400">{a.seo_score}%</p>
                            <p className="text-xs text-gray-600">SEO</p>
                          </div>
                        )}
                        {a.gsc_clicks !== null && (
                          <div>
                            <p className="text-sm font-medium text-blue-400">{a.gsc_clicks}</p>
                            <p className="text-xs text-gray-600">קליקים</p>
                          </div>
                        )}
                        {a.gsc_position !== null && (
                          <div>
                            <p className="text-sm font-medium text-emerald-400">#{Math.round(a.gsc_position)}</p>
                            <p className="text-xs text-gray-600">מיקום</p>
                          </div>
                        )}
                        {a.wp_url && (
                          <a
                            href={a.wp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                          >
                            <ExternalLink size={12} />
                            צפה
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!articles.length && (
                <div className="p-12 text-center text-gray-600">
                  <Search size={40} className="mx-auto mb-3 opacity-20" />
                  <p>אין מאמרים עדיין</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {tab === 'schedule' && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="divide-y divide-gray-800">
                {schedule.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-medium text-white">{item.keyword}</p>
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.status === 'done'
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : item.status === 'failed'
                              ? 'bg-red-900/40 text-red-400'
                              : item.status === 'processing'
                              ? 'bg-amber-900/40 text-amber-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {item.status === 'pending' ? 'ממתין'
                            : item.status === 'processing' ? 'מעבד'
                            : item.status === 'done' ? 'הושלם'
                            : 'נכשל'}
                        </div>
                      </div>
                      {item.secondary_keywords && (
                        <p className="text-xs text-gray-500">+ {item.secondary_keywords}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-600 mt-0.5">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-white">{fmt(item.target_date)}</p>
                        <p
                          className={`text-xs ${
                            item.priority === 'high'
                              ? 'text-red-400'
                              : item.priority === 'medium'
                              ? 'text-amber-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {PRIORITY_LABELS[item.priority as Priority]}
                        </p>
                      </div>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!schedule.length && (
                  <div className="p-12 text-center text-gray-600">
                    <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                    <p>לוח התוכן ריק — הוסף מאמרים לתזמון</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {data?.gscTimeline ? (
              <>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h2 className="text-sm font-medium text-white mb-4">קליקים ו-Impressions — 14 ימים אחרונים</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.gscTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        labelStyle={{ color: '#e5e7eb' }}
                      />
                      <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="קליקים" />
                      <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} dot={false} name="הצגות" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {data.topKeywords.length > 0 && (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                    <h2 className="text-sm font-medium text-white mb-4">מילות מפתח מובילות</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.topKeywords.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="keyword" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        />
                        <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="קליקים" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                <TrendingUp size={40} className="mx-auto mb-3 text-gray-700" />
                <p className="text-gray-400 text-sm mb-1">חיבור ל-Google Search Console לא הוגדר</p>
                <p className="text-gray-600 text-xs">הגדר את כתובת האתר ב-GSC בהגדרות</p>
                <button
                  onClick={() => setTab('settings')}
                  className="mt-4 text-xs text-violet-400 hover:text-violet-300"
                >
                  עבור להגדרות ←
                </button>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-4 max-w-xl">
            {[
              {
                title: 'וורדפרס',
                fields: [
                  { key: 'wp_url', label: 'כתובת האתר', placeholder: 'https://mysite.com' },
                  { key: 'wp_username', label: 'שם משתמש', placeholder: 'admin' },
                  { key: 'wp_app_password', label: 'Application Password', placeholder: '••••••••', type: 'password' },
                ],
              },
              {
                title: 'Google Search Console',
                fields: [
                  { key: 'gsc_site_url', label: 'כתובת האתר ב-GSC', placeholder: 'https://mysite.com' },
                ],
              },
              {
                title: 'הגדרות תוכן',
                fields: [
                  { key: 'site_context', label: 'הקשר האתר (לשיפור תוכן)', placeholder: 'אתר בתחום הנדל"ן המתמקד ב...' },
                ],
              },
            ].map((section) => (
              <div key={section.title} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-white mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={settings[field.key] || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={saveSettings}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                settingsSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-violet-600 hover:bg-violet-500 text-white'
              }`}
            >
              {settingsSaved ? '✓ נשמר!' : 'שמור הגדרות'}
            </button>
          </div>
        )}
      </div>

      {/* Modal: Generate Article */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">יצירת מאמר חדש</h2>
              <button onClick={() => setShowGenerate(false)} className="text-gray-600 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">מילת מפתח ראשית *</label>
                <input
                  type="text"
                  value={genForm.keyword}
                  onChange={(e) => setGenForm((p) => ({ ...p, keyword: e.target.value }))}
                  placeholder='למשל: "קניית דירה בתל אביב"'
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">מילות מפתח משניות (אופציונלי)</label>
                <input
                  type="text"
                  value={genForm.secondary}
                  onChange={(e) => setGenForm((p) => ({ ...p, secondary: e.target.value }))}
                  placeholder="מופרדות בפסיק"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerate(false)}
                className="flex-1 py-2 rounded-lg text-sm text-gray-400 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleGenerate}
                disabled={!genForm.keyword || generating}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    מפעיל...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    צור ופרסם
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add to Schedule */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">הוסף לוח תוכן</h2>
              <button onClick={() => setShowSchedule(false)} className="text-gray-600 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'keyword', label: 'מילת מפתח *', placeholder: 'הכנס מילת מפתח' },
                { key: 'secondary', label: 'מילות מפתח משניות', placeholder: 'מופרדות בפסיק' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={schedForm[f.key as 'keyword' | 'secondary']}
                    onChange={(e) => setSchedForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">תאריך יעד *</label>
                  <input
                    type="date"
                    value={schedForm.date}
                    onChange={(e) => setSchedForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">עדיפות</label>
                  <div className="relative">
                    <select
                      value={schedForm.priority}
                      onChange={(e) => setSchedForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                      className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="high">גבוה</option>
                      <option value="medium">בינוני</option>
                      <option value="low">נמוך</option>
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">הערות</label>
                <textarea
                  value={schedForm.notes}
                  onChange={(e) => setSchedForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="הערות נוספות..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSchedule(false)}
                className="flex-1 py-2 rounded-lg text-sm text-gray-400 border border-gray-700 hover:border-gray-600"
              >
                ביטול
              </button>
              <button
                onClick={handleAddSchedule}
                disabled={!schedForm.keyword || !schedForm.date}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              >
                הוסף לתזמון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
