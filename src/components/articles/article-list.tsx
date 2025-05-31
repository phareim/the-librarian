'use client';

import type { Article } from '@/types';
import { ArticleCard } from './article-card';

interface ArticleListProps {
  articles: Article[];
  onUpdateArticle: (updatedArticle: Article) => void;
  onDeleteArticle: (article: Article) => void; // Added onDeleteArticle
}

export function ArticleList({ articles, onUpdateArticle, onDeleteArticle }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-headline mb-2">Your Library is Empty</h2>
        <p className="text-muted-foreground">Add some articles or RSS feeds to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
      {articles.map(article => (
        <ArticleCard 
          key={article.id} 
          article={article} 
          onUpdateArticle={onUpdateArticle}
          onDeleteArticle={onDeleteArticle} // Pass down
        />
      ))}
    </div>
  );
}
