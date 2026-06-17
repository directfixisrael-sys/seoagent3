import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function generateArticle(
  keyword: string,
  secondaryKeywords: string = '',
  siteContext: string = ''
): Promise<GeneratedArticle> {
  const secondary = secondaryKeywords
    ? `מילות מפתח משניות: ${secondaryKeywords}`
    : '';

  const prompt = `אתה מומחה SEO בכיר ועורך תוכן מקצועי. צור מאמר בלוג מלא ומותאם SEO.

מילת מפתח ראשית: "${keyword}"
${secondary}
${siteContext ? `הקשר האתר: ${siteContext}` : ''}

דרישות:
- אורך: 1200-1800 מילים
- מבנה H1, H2, H3 ברור
- שילוב טבעי של מילת המפתח (צפיפות 1.5-2.5%)
- פסקת מבוא מושכת
- תוכן מועיל ומקורי
- קריאה לפעולה בסוף
- כתוב בעברית שוטפת ומקצועית

החזר JSON בפורמט הזה בלבד (ללא markdown):
{
  "title": "כותרת H1 מלאה",
  "slug": "slug-in-english-with-hyphens",
  "content": "תוכן HTML מלא עם תגיות H2, H3, p, ul, li",
  "metaTitle": "כותרת SEO עד 60 תווים",
  "metaDescription": "תיאור מטא עד 155 תווים",
  "imagePrompt": "תיאור מפורט לאנגלית ליצירת תמונה רלוונטית",
  "seoScore": 85,
  "preview": "משפט פתיחה קצר לתצוגה מקדימה"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(clean);

  const wordCount = parsed.content.replace(/<[^>]+>/g, '').split(/\s+/).length;

  return {
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content,
    metaTitle: parsed.metaTitle,
    metaDescription: parsed.metaDescription,
    imagePrompt: parsed.imagePrompt,
    seoScore: parsed.seoScore || 80,
    wordCount,
    preview: parsed.preview || '',
  };
}

export async function generateImage(prompt: string): Promise<string> {
  const enhancedPrompt = `Professional blog header image, high quality photography style. ${prompt}. Clean, modern, suitable for a professional website. No text overlay.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  });

  return response?.data?.[0]?.url ?? '';
}

export function calculateSeoScore(article: GeneratedArticle, keyword: string): number {
  let score = 0;

  // כותרת מכילה מילת מפתח
  if (article.title.toLowerCase().includes(keyword.toLowerCase())) score += 20;

  // meta description באורך הנכון
  if (article.metaDescription.length >= 120 && article.metaDescription.length <= 155) score += 15;

  // meta title באורך הנכון
  if (article.metaTitle.length >= 30 && article.metaTitle.length <= 60) score += 15;

  // אורך תוכן
  if (article.wordCount >= 1000) score += 20;
  if (article.wordCount >= 1500) score += 10;

  // צפיפות מילת מפתח
  const contentText = article.content.replace(/<[^>]+>/g, '');
  const keywordCount = (contentText.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  const density = (keywordCount / article.wordCount) * 100;
  if (density >= 1 && density <= 3) score += 20;

  return Math.min(score, 100);
}
