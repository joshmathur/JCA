import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE /api/watchlist/:id - removes a coin from the watchlist
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
