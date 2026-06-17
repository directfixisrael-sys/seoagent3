# 🤖 SEO Agent — מערכת ניהול תוכן אוטומטית

מערכת Next.js לכתיבה, יצירת תמונות ופרסום אוטומטי של מאמרי SEO לוורדפרס.

## מה המערכת עושה?

1. **כותבת מאמר מלא** באמצעות Claude AI (כולל H1-H3, meta, קריאה לפעולה)
2. **יוצרת תמונה** ייחודית עם DALL-E 3 ומעלה אותה לוורדפרס
3. **מפרסמת אוטומטית** לוורדפרס עם כל ה-SEO metadata
4. **עוקבת אחרי ביצועים** דרך Google Search Console
5. **לוח תוכן** לתכנון מאמרים עתידיים עם תאריכי יעד ועדיפויות

---

## התקנה מהירה

### 1. דרישות מקדימות
- Node.js 18+
- חשבון Anthropic (Claude API)
- חשבון OpenAI (DALL-E)
- וורדפרס עם Application Passwords מופעל (WordPress 5.6+)
- (אופציונלי) Google Search Console

### 2. התקנת הפרויקט

```bash
cd seo-agent
npm install
```

### 3. הגדרת משתני סביבה

```bash
cp .env.example .env.local
```

ערוך את `.env.local` עם הפרטים שלך:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
WP_URL=https://your-site.com
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 4. WordPress Application Password

1. בוורדפרס: **Users → Profile → Application Passwords**
2. הכנס שם ("SEO Agent") ולחץ **Add New Application Password**
3. העתק את הסיסמה שנוצרה (מופיעה פעם אחת!)
4. הכנס ל-`.env.local` ב-`WP_APP_PASSWORD`

### 5. Google Search Console (אופציונלי)

1. פתח [Google Cloud Console](https://console.cloud.google.com)
2. צור פרויקט חדש → אפשר **Search Console API**
3. צור **Service Account** → הורד JSON
4. ב-Search Console: הוסף את המייל של ה-Service Account כמשתמש
5. הכנס את כל תוכן ה-JSON ל-`GSC_SERVICE_ACCOUNT_JSON`

### 6. הפעלה

```bash
# פיתוח
npm run dev

# פרודקשן
npm run build && npm start
```

פתח: **http://localhost:3000**

---

## שימוש

### יצירת מאמר מיידי
לחץ **"צור מאמר חדש"** → הכנס מילת מפתח → **"צור ופרסם"**

המערכת תבצע אוטומטית:
- כתיבת מאמר (~90 שניות)
- יצירת תמונה ייחודית (~30 שניות)
- העלאה ופרסום בוורדפרס (~15 שניות)

### לוח תוכן
לחץ **"לוח תוכן"** → **"הוסף לתזמון"**  
המאמרים יפורסמו אוטומטית בתאריך שקבעת.

---

## מבנה הפרויקט

```
seo-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/      # יצירה + רשימה
│   │   │   │   └── schedule/  # לוח תוכן
│   │   │   ├── analytics/     # GSC + סטטיסטיקות
│   │   │   └── settings/      # שמירת הגדרות
│   │   └── dashboard/         # ממשק הדשבורד
│   ├── lib/
│   │   ├── generator.ts       # Claude + DALL-E
│   │   ├── wordpress.ts       # WordPress REST API
│   │   ├── gsc.ts             # Google Search Console
│   │   ├── pipeline.ts        # ה-pipeline המלא
│   │   └── db.ts              # SQLite database
│   ├── types/                 # TypeScript types
│   └── scheduler.ts           # תזמון אוטומטי (cron)
├── data/                      # מסד הנתונים (נוצר אוטומטית)
├── .env.example
└── README.md
```

---

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | Next.js 14 + React + Tailwind |
| AI כותב | Claude claude-opus-4-6 (Anthropic) |
| AI תמונות | DALL-E 3 (OpenAI) |
| Database | SQLite (better-sqlite3) |
| Analytics | Google Search Console API |
| CMS | WordPress REST API |
| גרפים | Recharts |
