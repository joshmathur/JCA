export interface CitedArticle {
  title: string;
  url: string;
}

export interface AIAnalysis {
  entryZone: string;
  exitZone: string;
  stopLoss: string;
  reasoning: string;
  outlook: 'favorable' | 'neutral' | 'unfavorable';
  newsBased: boolean;
  citedArticles: CitedArticle[];
  confidence: 'low' | 'medium' | 'high';
}