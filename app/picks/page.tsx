'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { SavedPick } from '@/types/picks';

export default function PicksPage() {
  // Picks currently saved in Supabase — the source of truth for what renders
  const [savedPicks, setSavedPicks] = useState<SavedPick[]>([]);

  // True while the initial saved-picks fetch is in flight
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  useEffect(() => {
    fetchSavedPicks();
  }, []);

  const fetchSavedPicks = async () => {
    try {
      const res = await fetch('/api/ai/picks');
      if (!res.ok) throw new Error('Failed to fetch saved picks');
      const data: SavedPick[] = await res.json();
      setSavedPicks(data);
    } catch (error) {
      console.error('Fetch saved picks error:', error);
    } finally {
      setIsLoadingPicks(false);
    }
  };

  const confidenceStyles = (confidence: string) =>
    confidence === 'high'
      ? 'bg-green-100 text-green-700'
      : confidence === 'medium'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-700';

  // All rows in a batch are inserted together, so the newest row's
  // timestamp is a good proxy for "when this whole batch was generated"
  const generatedAt = savedPicks[0]?.created_at
    ? new Date(savedPicks[0].created_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Today's Picks</h1>
      </div>

      {generatedAt && (
        <p className="text-xs text-gray-400 mb-4">Last generated {generatedAt}</p>
      )}

      {isLoadingPicks ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading picks...
        </div>
      ) : savedPicks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No picks yet. Picks are generated automatically once a day.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedPicks.map((pick) => (
            <div
              key={pick.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900">{pick.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{pick.symbol}</p>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${confidenceStyles(
                    pick.analysis.confidence
                  )}`}
                >
                  {pick.analysis.confidence} confidence
                </span>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-400" />
                <span>{pick.analysis.reason}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}