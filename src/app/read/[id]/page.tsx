
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Article, RssFeed } from '@/types'; // RssFeed might be needed for handleAddRssFeed
import { ReaderView } from '@/components/articles/reader-view';
import { AppHeader } from '@/components/layout/header';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

export default function ArticleReadPage() {
  const params = useParams();
  const articleId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !user || !articleId) {
      if (!authLoading && !user) {
        toast({ title: "Authentication Required", description: "Please log in to view articles.", variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            toast({ title: "Access Denied", description: "You do not have permission to view this article.", variant: "destructive" });
            setArticle(null);
          } else {
            const dateAdded = data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : data.dateAdded as string;
            setArticle({ 
              ...data, 
              id: docSnap.id,
              dateAdded,
              aiRelevance: data.aiRelevance ? { ...data.aiRelevance, isLoading: false } : undefined,
            } as Article);
          }
        } else {
          toast({ title: "Not Found", description: "Article not found in your library.", variant: "destructive" });
          setArticle(null);
        }
      } catch (error) {
        console.error("Error fetching article: ", error);
        toast({ title: "Error", description: "Could not load the article.", variant: "destructive" });
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, user, authLoading, toast]);

  const handleAddArticle = useCallback((newArticleData: Partial<Article>) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to add articles." });
      return;
    }
    console.log("Add article from reader page (placeholder for DB integration):", newArticleData);
    toast({ title: "Action Placeholder", description: "Add article action triggered."});
  }, [user, toast]);

  const handleAddRssFeed = useCallback((newFeed: Partial<RssFeed>) => {
     if (!user) {
      toast({ title: "Login Required", description: "Please log in to add RSS feeds." });
      return;
    }
    console.log("Add RSS feed from reader page (placeholder for DB integration):", newFeed);
    toast({ title: "Action Placeholder", description: "Add RSS feed action triggered."});
  }, [user, toast]);


  if (authLoading || loading) {
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
            isUserLoggedIn={!!user}
        />
      </main>
    );
  }
  
  if (!user && !authLoading) {
     return (
      <main className="flex flex-1 flex-col">
        <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-2xl font-headline mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to view this article.</p>
          </div>
        </div>
         <AddContentDialog
            isOpen={isAddContentDialogOpen}
            onOpenChange={setIsAddContentDialogOpen}
            onAddArticle={handleAddArticle}
            onAddRssFeed={handleAddRssFeed}
            isUserLoggedIn={!!user}
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
        onAddArticle={handleAddArticle}
        onAddRssFeed={handleAddRssFeed}
        isUserLoggedIn={!!user}
      />
    </main>
  );
}
