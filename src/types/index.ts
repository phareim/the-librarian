
import type { Timestamp } from 'firebase/firestore';

export interface Tag {
  id: string;
  name: string;
}

export interface Article {
  id: string; // Firestore document ID
  userId: string; // Firebase Auth User UID
  title: string;
  url: string;
  sourceName?: string;
  content?: string; // Full content for reader view, can be markdown or HTML
  summary?: string; // Short summary for card view
  imageUrl?: string;
  tags: Tag[];
  dateAdded: string | Timestamp; // ISO string for client, Timestamp for Firestore
  aiRelevance?: {
    score: number;
    reasoning: string;
    isLoading?: boolean; // UI state, not stored in Firestore
  };
  isRead?: boolean;
  dataAiHint?: string;
}

export interface RssFeed {
  id: string;
  url: string;
  name: string;
  lastFetched?: string; // ISO string
}
