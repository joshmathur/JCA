'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { SavedPick, PicksResponse } from '@/types/picks';

export default function PicksPage() {
  // Picks currently saved in Supabase — the source of truth for what renders
  const [savedPicks, setSavedPicks] = useState<SavedPick[]>([]);

  // True while the initial saved-picks fetch is in flight
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  // True while a manual generate request is in flight
  const [isGenerating, setIsGenerating] = useState(false);

  const [generateError, setGenerateError] = useState<string | null>(null);

  // Only populated right after a manual generate — not persisted, so it
  // won't reappear on a fresh page load. See note above.
  const [lastSummary, setLastSummary] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/ai/picks', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate picks');
      }

      const result = data as PicksResponse;
      setLastSummary(result.summary);

      // Refetch from Supabase rather than reconstructing saved-row shape
      // from the generate response — Supabase is the source of truth,
      // and a "no strong picks today" run won't have changed it at all.
      await fetchSavedPicks();
    } catch (error) {
      console.error('Generate picks error:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
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
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </>
          )}
        </button>
      </div>

      {generatedAt && (
        <p className="text-xs text-gray-400 mb-1">Last generated {generatedAt}</p>
      )}

      <p className="text-xs text-gray-400 mb-4 italic">
        Picks refresh automatically once deployed. This button is a manual dev/testing trigger.
      </p>

      {generateError && (
        <div className="flex items-start gap-1.5 text-sm text-red-600 bg-red-50 rounded-md p-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{generateError}</span>
        </div>
      )}

      {lastSummary && (
        <div className="flex items-start gap-1.5 text-sm text-blue-700 bg-blue-50 rounded-md p-3 mb-4">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{lastSummary}</span>
        </div>
      )}

      {isLoadingPicks ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading picks...
        </div>
      ) : savedPicks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No picks yet. Click Regenerate to generate today's picks.
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