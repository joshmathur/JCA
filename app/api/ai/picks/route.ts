import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/ai/picks - returns the most recently saved picks (used by the
// Picks page on load — requires a logged-in user)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/ai/picks] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved picks' }, { status: 500 });
  }
}