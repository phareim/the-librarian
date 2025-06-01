
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Article, RssFeed } from '@/types'; 
import { ReaderView } from '@/components/articles/reader-view';
import { AppHeader } from '@/components/layout/header';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getFirebaseFirestore } from '@/lib/firebase'; // Use getter
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
    const db = getFirebaseFirestore(); // Get db instance
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

  // These handlers are placeholders if "Add Content" is used from this page.
  // Actual article addition logic is primarily in page.tsx.
  const handleAddArticle = useCallback((newArticleData: Partial<Article>) => {
    // This typically would call a global add function or redirect.
    // For now, it's a placeholder as the dialog is available app-wide.
    toast({ title: "Action Not Primary Here", description: "Use 'Add Content' from the main library for full functionality."});
    setIsAddContentDialogOpen(false); // Close dialog if opened from here
  }, [toast]);

  const handleAddRssFeed = useCallback((newFeed: Partial<RssFeed>) => {
    toast({ title: "Action Not Primary Here", description: "Use 'Add Content' from the main library for full functionality."});
    setIsAddContentDialogOpen(false);
  }, [toast]);


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
