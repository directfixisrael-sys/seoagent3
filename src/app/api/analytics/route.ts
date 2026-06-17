export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getStats, getArticles, getSchedule } from '@/lib/db';

export async function GET() {
  const [stats, articles, schedule] = await Promise.all([
    getStats(),
    getArticles(10),
    getSchedule(),
  ]);
  return NextResponse.json({ stats, articles, schedule });
}
