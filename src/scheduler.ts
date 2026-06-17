import cron from 'node-cron';
import { processScheduledArticles } from '../lib/pipeline';

console.log('🤖 SEO Agent Scheduler started');

// בדוק כל שעה מאמרים מתוזמנים
cron.schedule('0 * * * *', async () => {
  console.log('[Scheduler] Checking scheduled articles...');
  try {
    await processScheduledArticles();
    console.log('[Scheduler] Done processing');
  } catch (err) {
    console.error('[Scheduler] Error:', err);
  }
});

// בדוק גם בהפעלה
processScheduledArticles().catch(console.error);
