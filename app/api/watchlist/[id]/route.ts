import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/watchlist/:id - removes a coin from the logged-in user's watchlist
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Missing watchlist entry ID' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('[DELETE /api/watchlist/:id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove coin from watchlist' },
      { status: 500 }
    );
  }
}