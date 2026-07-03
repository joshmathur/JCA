export interface Pick {
  coinId: string;
  symbol: string;
  name: string;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface PicksResponse {
  picks: Pick[];
  summary: string;
}

// Shape of a row as stored in and read back from Supabase
export interface SavedPick {
  id: string;
  coin_id: string;
  symbol: string;
  name: string;
  analysis: {
    reason: string;
    confidence: 'low' | 'medium' | 'high';
  };
  created_at: string;
}