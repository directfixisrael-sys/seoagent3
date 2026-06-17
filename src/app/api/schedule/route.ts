export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSchedule, addScheduleItem, deleteScheduleItem } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await getSchedule());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await addScheduleItem(body);
  return NextResponse.json({ success: true, item });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'חסר ID' }, { status: 400 });
  await deleteScheduleItem(Number(id));
  return NextResponse.json({ success: true });
}
