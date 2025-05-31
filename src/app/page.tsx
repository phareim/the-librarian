'use client';

import React, { useState, useEffect } from 'react';
import type { Article, RssFeed } from '@/types';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import { ArticleList } from '@/components/articles/article-list';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { AppHeader } from '@/components/layout/header'; // Import AppHeader
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching initial data
    setArticles(MOCK_ARTICLES);
  }, []);

  const handleAddArticle = (newArticleData: Partial<Article>) => {
    const completeArticle: Article = {
      id: newArticleData.id || Date.now().toString(),
      title: newArticleData.title || 'Untitled Article',
      url: newArticleData.url || '',
      tags: newArticleData.tags || [],
      dateAdded: newArticleData.dateAdded || new Date().toISOString(),
      summary: newArticleData.summary || 'No summary available.',
      imageUrl: newArticleData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: newArticleData.dataAiHint || 'general content',
      ...newArticleData,
    };
    setArticles(prevArticles => [completeArticle, ...prevArticles]);
    toast({
      title: "Article Added",
      description: `"${completeArticle.title}" has been added to your library.`,
    });
  };

  const handleAddRssFeed = (newFeed: Partial<RssFeed>) => {
    const completeFeed: RssFeed = {
      id: newFeed.id || Date.now().toString(),
      url: newFeed.url || '',
      name: newFeed.name || 'Untitled Feed',
      ...newFeed,
    };
    setRssFeeds(prevFeeds => [completeFeed, ...prevFeeds]);
     toast({
      title: "RSS Feed Added",
      description: `"${completeFeed.name}" has been added. Articles will appear soon.`,
    });
    // Here you would typically trigger fetching articles from the RSS feed.
    // For now, we just add the feed.
  };

  const handleUpdateArticle = (updatedArticle: Article) => {
    setArticles(prevArticles =>
      prevArticles.map(article =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto">
        <ArticleList articles={articles} onUpdateArticle={handleUpdateArticle} />
      </div>
      <AddContentDialog
        isOpen={isAddContentDialogOpen}
        onOpenChange={setIsAddContentDialogOpen}
        onAddArticle={handleAddArticle}
        onAddRssFeed={handleAddRssFeed}
      />
    </main>
  );
}
