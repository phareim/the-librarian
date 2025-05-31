'use client';

import React, { useState, useEffect } from 'react';
import type { Article, RssFeed } from '@/types';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import { ArticleList } from '@/components/articles/article-list';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { AppHeader } from '@/components/layout/header';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
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
      ...newArticleData, // Spread the rest of newArticleData, ensuring type compatibility
    } as Article; // Assert as Article to satisfy type checker after removing category
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
  };

  const handleUpdateArticle = (updatedArticle: Article) => {
    setArticles(prevArticles =>
      prevArticles.map(article =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
  };

  const handleInitiateDeleteArticle = (article: Article) => {
    setArticleToDelete(article);
  };

  const handleConfirmDeleteArticle = () => {
    if (articleToDelete) {
      setArticles(prevArticles => prevArticles.filter(article => article.id !== articleToDelete.id));
      toast({
        title: "Article Deleted",
        description: `"${articleToDelete.title}" has been removed from your library.`,
      });
      setArticleToDelete(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto">
        <ArticleList 
          articles={articles} 
          onUpdateArticle={handleUpdateArticle}
          onDeleteArticle={handleInitiateDeleteArticle} 
        />
      </div>
      <AddContentDialog
        isOpen={isAddContentDialogOpen}
        onOpenChange={setIsAddContentDialogOpen}
        onAddArticle={handleAddArticle}
        onAddRssFeed={handleAddRssFeed}
      />
      {articleToDelete && (
        <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete the article "{articleToDelete.title}". You cannot undo this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setArticleToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteArticle}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </main>
  );
}
