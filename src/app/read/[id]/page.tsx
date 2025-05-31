'use client'; // Keep as client component to use hooks and state if needed later for interactions

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Article } from '@/types';
import { MOCK_ARTICLES } from '@/lib/mock-data'; // Using mock data for now
import { ReaderView } from '@/components/articles/reader-view';
import { AppHeader } from '@/components/layout/header'; // Import AppHeader
import { AddContentDialog } from '@/components/forms/add-content-dialog'; // For consistency, header needs this
import { useToast } from "@/hooks/use-toast";

export default function ArticleReadPage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // States for AddContentDialog, needed by AppHeader
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const { toast } = useToast(); // toast might be used by header actions or dialog

  useEffect(() => {
    if (articleId) {
      // Simulate fetching article data
      const foundArticle = MOCK_ARTICLES.find(a => a.id === articleId);
      setArticle(foundArticle || null);
      setLoading(false);
    }
  }, [articleId]);

  // Placeholder handlers for AddContentDialog
  const handleAddArticle = (newArticleData: Partial<Article>) => {
    console.log("Add article from reader page (placeholder):", newArticleData);
    toast({ title: "Action Placeholder", description: "Add article action triggered."});
  };
  const handleAddRssFeed = (newFeed: Partial<RssFeed>) => { // RssFeed type might need to be imported
    console.log("Add RSS feed from reader page (placeholder):", newFeed);
    toast({ title: "Action Placeholder", description: "Add RSS feed action triggered."});
  };


  if (loading) {
    return (
      <main className="flex flex-1 flex-col">
        <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading article...</p>
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

  return (
    <main className="flex flex-1 flex-col">
       <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto bg-background">
        <ReaderView article={article} />
      </div>
      <AddContentDialog
        isOpen={isAddContentDialogOpen}
        onOpenChange={setIsAddContentDialogOpen}
        onAddArticle={handleAddArticle} // Placeholder
        onAddRssFeed={handleAddRssFeed}   // Placeholder
      />
    </main>
  );
}
