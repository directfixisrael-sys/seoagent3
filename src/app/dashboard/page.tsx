'use client';
import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Zap, FileText, Calendar, TrendingUp, Settings, Plus, ExternalLink, RefreshCw, CheckCircle, Clock, Loader2, AlertCircle, X, ChevronDown, Smartphone, Wifi, Star, ArrowUpRight } from 'lucide-react';

type Tab = 'home' | 'articles' | 'schedule' | 'analytics' | 'settings';
type Status = 'planned' | 'generating' | 'publishing' | 'published' | 'failed';
type Priority = 'high' | 'medium' | 'low';

interface Article {
  id: number; title: string; keyword: string; status: Status;
  seo_score: number | null; word_count: number | null; wp_url: string | null;
  published_at: string | null; created_at: string; gsc_clicks: number | null;
  gsc_position: number | null; error_message: string | null; content_preview: string | null;
  image_url: string | null;
}
interface ScheduleItem { id: number; keyword: string; target_date: string; priority: Priority; status: string; notes: string | null; }
interface Stats { total: number; published: number; planned: number; failed: number; avg_seo_score: number; total_clicks: number; total_impressions: number; avg_position: number; }

const STATUS: Record<Status, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  planned:    { label: 'מתוכנן',   color: '#6366f1', bg: '#eef2ff', Icon: Clock },
  generating: { label: 'כותב...',  color: '#f59e0b', bg: '#fffbeb', Icon: Loader2 },
  publishing: { label: 'מפרסם...', color: '#3b82f6', bg: '#eff6ff', Icon: Loader2 },
  published:  { label: 'פורסם',    color: '#10b981', bg: '#ecfdf5', Icon: CheckCircle },
  failed:     { label: 'נכשל',     color: '#ef4444', bg: '#fef2f2', Icon: AlertCircle },
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

const MOCK_CHART = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  return { date: d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }), clicks: Math.floor(20 + Math.random() * 80), impressions: Math.floor(300 + Math.random() * 700) };
});

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('home');
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showSched, setShowSched] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wpStatus, setWpStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [genForm, setGenForm] = useState({ keyword: '', secondary: '' });
  const [schedForm, setSchedForm] = useState({ keyword: '', date: '', priority: 'medium' as Priority, notes: '' });

  const fetchAll = useCallback(async () => {
    try {
      const [dash, arts, setts] = await Promise.all([
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/articles').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);
      setStats(dash.stats); setArticles(arts); setSchedule(dash.schedule || []); setSettings(setts);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t); }, [fetchAll]);

  const createArticle = async () => {
    if (!genForm.keyword.trim()) return;
    setGenerating(true);
    try {
      await fetch('/api/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: genForm.keyword, secondary_keywords: genForm.secondary }) });
      setShowNew(false); setGenForm({ keyword: '', secondary: '' }); setTimeout(fetchAll, 1000);
    } finally { setGenerating(false); }
  };

  const addSchedule = async () => {
    if (!schedForm.keyword || !schedForm.date) return;
    await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedForm) });
    setShowSched(false); setSchedForm({ keyword: '', date: '', priority: 'medium', notes: '' }); fetchAll();
  };

  const delSchedule = async (id: number) => {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' }); fetchAll();
  };

  const saveSettings = async () => {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const testWP = async () => {
    setWpStatus('checking');
    const r = await fetch('/api/settings', { method: 'PUT' });
    const d = await r.json();
    setWpStatus(d.connected ? 'ok' : 'fail');
    setTimeout(() => setWpStatus('idle'), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Smartphone size={24} className="text-white" />
        </div>
        <p className="text-gray-500 text-sm">טוען SEO Agent...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-l border-gray-100 fixed right-0 top-0 h-full flex flex-col z-10">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Smartphone size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Phone Fix SEO</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-xs text-gray-400">פעיל</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {([
            ['home', 'בית', TrendingUp],
            ['articles', 'מאמרים', FileText],
            ['schedule', 'לוח תוכן', Calendar],
            ['analytics', 'אנליטיקס', Zap],
            ['settings', 'הגדרות', Settings],
          ] as [Tab, string, React.ElementType][]).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                tab === id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              <Icon size={16} />
              {label}
              {id === 'articles' && articles.filter(a => ['generating','publishing'].includes(a.status)).length > 0 && (
                <span className="mr-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-xs font-medium text-indigo-700 mb-0.5">תיקון טלפונים</p>
            <p className="text-xs text-indigo-500">עד הבית בכל הארץ</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="mr-56 flex-1 p-6 min-h-screen">

        {/* HOME */}
        {tab === 'home' && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">שלום! 👋</h1>
                <p className="text-sm text-gray-500 mt-0.5">סקירת ביצועי ה-SEO שלך</p>
              </div>
              <button onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-colors font-medium shadow-sm">
                <Plus size={15} /> מאמר חדש
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'מאמרים', value: stats?.total || 0, sub: 'במערכת', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FileText },
                { label: 'פורסמו', value: stats?.published || 0, sub: 'בוורדפרס', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                { label: 'ציון SEO', value: `${stats?.avg_seo_score || 0}`, sub: 'ממוצע', color: 'text-amber-600', bg: 'bg-amber-50', icon: Star },
                { label: 'קליקים', value: (stats?.total_clicks || 0).toLocaleString(), sub: '28 ימים', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                    <c.icon size={16} className={c.color} />
                  </div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.label} · {c.sub}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-medium text-gray-800 mb-4">ביצועים — 14 ימים אחרונים</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={MOCK_CHART}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fill="url(#cg)" name="קליקים" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent articles */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-800">מאמרים אחרונים</h2>
                <button onClick={() => setTab('articles')} className="text-xs text-indigo-600 flex items-center gap-1">הצג הכל <ArrowUpRight size={12} /></button>
              </div>
              {articles.slice(0, 5).map(a => {
                const cfg = STATUS[a.status];
                const isLoading = ['generating','publishing'].includes(a.status);
                return (
                  <div key={a.id} className="p-4 border-b border-gray-50 last:border-0 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title || a.keyword}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.keyword} · {fmtDate(a.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {a.seo_score && <span className="text-xs font-medium text-amber-600">{a.seo_score}%</span>}
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <cfg.Icon size={11} className={isLoading ? 'animate-spin' : ''} />
                        {cfg.label}
                      </span>
                      {a.wp_url && <a href={a.wp_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-indigo-500 transition-colors"><ExternalLink size={13} /></a>}
                    </div>
                  </div>
                );
              })}
              {!articles.length && (
                <div className="p-10 text-center">
                  <Smartphone size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">אין מאמרים עדיין</p>
                  <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-indigo-600 font-medium">צור מאמר ראשון ←</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARTICLES */}
        {tab === 'articles' && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900">כל המאמרים</h1>
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium">
                <Plus size={15} /> מאמר חדש
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {Object.entries(STATUS).map(([k, v]) => {
                const count = articles.filter(a => a.status === k).length;
                return <span key={k} className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: v.bg, color: v.color }}>{v.label} ({count})</span>;
              })}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {articles.map(a => {
                const cfg = STATUS[a.status];
                const isLoading = ['generating','publishing'].includes(a.status);
                return (
                  <div key={a.id} className="p-4 border-b border-gray-50 last:border-0 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                    {a.image_url
                      ? <img src={a.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0"><Smartphone size={18} className="text-indigo-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.title || a.keyword}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.keyword} · {fmtDate(a.created_at)}</p>
                          {a.error_message && <p className="text-xs text-red-500 mt-1">{a.error_message}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {a.word_count && <div className="text-center"><p className="text-sm font-medium text-gray-700">{a.word_count.toLocaleString()}</p><p className="text-xs text-gray-400">מילים</p></div>}
                          {a.seo_score && <div className="text-center"><p className="text-sm font-medium text-amber-600">{a.seo_score}%</p><p className="text-xs text-gray-400">SEO</p></div>}
                          {a.gsc_clicks != null && <div className="text-center"><p className="text-sm font-medium text-blue-600">{a.gsc_clicks}</p><p className="text-xs text-gray-400">קליקים</p></div>}
                          {a.gsc_position != null && <div className="text-center"><p className="text-sm font-medium text-emerald-600">#{Math.round(a.gsc_position)}</p><p className="text-xs text-gray-400">מיקום</p></div>}
                          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            <cfg.Icon size={11} className={isLoading ? 'animate-spin' : ''} />{cfg.label}
                          </span>
                          {a.wp_url && <a href={a.wp_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-indigo-500"><ExternalLink size={14} /></a>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!articles.length && <div className="p-12 text-center text-gray-400"><FileText size={32} className="mx-auto mb-2 opacity-20" /><p className="text-sm">אין מאמרים</p></div>}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {tab === 'schedule' && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-900">לוח תוכן</h1>
              <button onClick={() => setShowSched(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-xl font-medium">
                <Plus size={15} /> הוסף מאמר
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100">
              {schedule.filter(s => s.status === 'pending').map(item => (
                <div key={item.id} className="p-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Calendar size={14} className="text-indigo-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.keyword}</p>
                      <p className="text-xs text-gray-400">{fmtDate(item.target_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.priority === 'high' ? 'bg-red-50 text-red-500' :
                      item.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                    }`}>{item.priority === 'high' ? 'גבוה' : item.priority === 'medium' ? 'בינוני' : 'נמוך'}</span>
                    <button onClick={() => delSchedule(item.id)} className="text-gray-300 hover:text-red-400 transition-colors"><X size={14} /></button>
                  </div>
                </div>
              ))}
              {!schedule.filter(s => s.status === 'pending').length && (
                <div className="p-12 text-center"><Calendar size={32} className="mx-auto mb-2 text-gray-200" /><p className="text-sm text-gray-400">לוח התוכן ריק</p></div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="max-w-4xl">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">אנליטיקס</h1>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'קליקים', value: (stats?.total_clicks || 0).toLocaleString(), color: 'text-indigo-600' },
                { label: 'הצגות', value: (stats?.total_impressions || 0).toLocaleString(), color: 'text-blue-600' },
                { label: 'מיקום ממוצע', value: `#${stats?.avg_position || 0}`, color: 'text-emerald-600' },
                { label: 'ציון SEO', value: `${stats?.avg_seo_score || 0}%`, color: 'text-amber-600' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-medium text-gray-800 mb-4">קליקים לאורך זמן</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MOCK_CHART}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="clicks" fill="#6366f1" radius={[6, 6, 0, 0]} name="קליקים" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-xl">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">הגדרות</h1>
            {[
              { title: 'וורדפרס', fields: [
                { key: 'wp_url', label: 'כתובת האתר', placeholder: 'https://my-site.co.il' },
                { key: 'wp_username', label: 'שם משתמש', placeholder: 'admin' },
                { key: 'wp_app_password', label: 'Application Password', placeholder: '••••••••', type: 'password' },
              ]},
              { title: 'Google Search Console', fields: [
                { key: 'gsc_site_url', label: 'כתובת האתר ב-GSC', placeholder: 'https://my-site.co.il' },
              ]},
            ].map(section => (
              <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                      <input type={f.type || 'text'} value={settings[f.key] || ''} dir="ltr"
                        onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                    </div>
                  ))}
                </div>
                {section.title === 'וורדפרס' && (
                  <button onClick={testWP} className={`mt-3 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    wpStatus === 'ok' ? 'bg-emerald-50 text-emerald-600' :
                    wpStatus === 'fail' ? 'bg-red-50 text-red-500' :
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                    <Wifi size={12} />
                    {wpStatus === 'checking' ? 'בודק...' : wpStatus === 'ok' ? '✓ מחובר!' : wpStatus === 'fail' ? '✗ שגיאה' : 'בדוק חיבור'}
                  </button>
                )}
              </div>
            ))}
            <button onClick={saveSettings} className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {saved ? '✓ נשמר בהצלחה!' : 'שמור הגדרות'}
            </button>
          </div>
        )}
      </main>

      {/* Modal: New Article */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Zap size={15} className="text-white" /></div>
                <h2 className="text-base font-semibold text-gray-900">מאמר חדש</h2>
              </div>
              <button onClick={() => setShowNew(false)} className="text-gray-300 hover:text-gray-500"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">מילת מפתח ראשית *</label>
                <input autoFocus value={genForm.keyword} onChange={e => setGenForm(p => ({ ...p, keyword: e.target.value }))}
                  placeholder='למשל: "תיקון מסך אייפון עד הבית"'
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">מילות מפתח משניות</label>
                <input value={genForm.secondary} onChange={e => setGenForm(p => ({ ...p, secondary: e.target.value }))}
                  placeholder="תיקון סמסונג, החלפת מסך, טכנאי טלפונים"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-gray-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">ביטול</button>
              <button onClick={createArticle} disabled={!genForm.keyword || generating}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                {generating ? <><Loader2 size={14} className="animate-spin" />יוצר...</> : <><Zap size={14} />צור ופרסם</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule */}
      {showSched && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowSched(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">הוסף לתזמון</h2>
              <button onClick={() => setShowSched(false)} className="text-gray-300 hover:text-gray-500"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">מילת מפתח *</label>
                <input autoFocus value={schedForm.keyword} onChange={e => setSchedForm(p => ({ ...p, keyword: e.target.value }))}
                  placeholder="תיקון טלפון תל אביב"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">תאריך</label>
                  <input type="date" dir="ltr" value={schedForm.date} onChange={e => setSchedForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">עדיפות</label>
                  <div className="relative">
                    <select value={schedForm.priority} onChange={e => setSchedForm(p => ({ ...p, priority: e.target.value as Priority }))}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all">
                      <option value="high">גבוה</option>
                      <option value="medium">בינוני</option>
                      <option value="low">נמוך</option>
                    </select>
                    <ChevronDown size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSched(false)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">ביטול</button>
              <button onClick={addSchedule} disabled={!schedForm.keyword || !schedForm.date}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">הוסף</button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <button onClick={fetchAll} className="fixed bottom-6 left-6 w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
        <RefreshCw size={15} />
      </button>
    </div>
  );
}
