
export interface Tag {
  id: string;
  name: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  sourceName?: string;
  content?: string; // Full content for reader view, can be markdown or HTML
  summary?: string; // Short summary for card view
  imageUrl?: string;
  tags: Tag[];
  dateAdded: string; // ISO string
  aiRelevance?: {
    score: number;
    reasoning: string;
    isLoading?: boolean;
  };
  isRead?: boolean;
  dataAiHint?: string; // Added based on usage in page.tsx
}

export interface RssFeed {
  id: string;
  url: string;
  name: string;
  lastFetched?: string; // ISO string
}

