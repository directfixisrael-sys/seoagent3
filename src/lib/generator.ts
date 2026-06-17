import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  imagePrompt: string;
  seoScore: number;
  wordCount: number;
  preview: string;
}

export async function generateArticle(keyword: string, secondaryKeywords = ''): Promise<GeneratedArticle> {
  const prompt = `אתה מומחה SEO ומומחה לתיקון טלפונים. כתוב מאמר בלוג מקצועי ומותאם SEO לאתר שמספק שירות תיקון טלפונים עד הבית בישראל.

מילת מפתח ראשית: "${keyword}"
${secondaryKeywords ? `מילות מפתח משניות: ${secondaryKeywords}` : ''}

הנחיות:
- אורך: 1200-1600 מילים
- מבנה ברור עם H2 ו-H3
- שלב את מילת המפתח באופן טבעי (1.5-2.5%)
- הדגש את היתרון של תיקון עד הבית - נוח, מהיר, ללא יציאה מהבית
- כתוב בעברית שוטפת, ידידותית ומקצועית
- הוסף קריאה לפעולה בסוף

החזר JSON בלבד (ללא markdown backticks):
{
  "title": "כותרת H1",
  "slug": "english-slug-here",
  "content": "<h2>...</h2><p>...</p>...",
  "metaTitle": "כותרת SEO עד 60 תווים",
  "metaDescription": "תיאור מטא 120-155 תווים",
  "imagePrompt": "phone repair technician at customer home, professional, Israel",
  "seoScore": 85,
  "preview": "משפט פתיחה קצר"
}`;

  const response = await getAnthropic().messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(clean);
  const wordCount = parsed.content.replace(/<[^>]+>/g, '').split(/\s+/).length;

  return { ...parsed, wordCount, seoScore: parsed.seoScore || 80, preview: parsed.preview || '' };
}

export async function generateImage(prompt: string): Promise<string> {
  const openai = getOpenAI();
  if (!openai) return '';
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional photo: ${prompt}. Clean, modern, high quality, suitable for Israeli phone repair service website. No text.`,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    });
    return response.data?.[0]?.url ?? '';
  } catch {
    return '';
  }
}

export function calcSeoScore(article: GeneratedArticle, keyword: string): number {
  let score = 0;
  if (article.title.toLowerCase().includes(keyword.toLowerCase())) score += 20;
  if (article.metaDescription.length >= 120 && article.metaDescription.length <= 155) score += 15;
  if (article.metaTitle.length >= 30 && article.metaTitle.length <= 60) score += 15;
  if (article.wordCount >= 1000) score += 20;
  if (article.wordCount >= 1400) score += 10;
  const text = article.content.replace(/<[^>]+>/g, '');
  const count = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  const density = (count / article.wordCount) * 100;
  if (density >= 1 && density <= 3) score += 20;
  return Math.min(score, 100);
}
