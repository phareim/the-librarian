
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Article, RssFeed } from '@/types';
import { ArticleList } from '@/components/articles/article-list';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { AppHeader } from '@/components/layout/header';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { getFirebaseFirestore } from '@/lib/firebase'; // Use getter
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const db = getFirebaseFirestore(); 
    if (!db || !user) {
      setArticles([]);
      setIsLoadingArticles(false);
      if (!authLoading && !user) {
         // User is not logged in and auth is not loading
      }
      return;
    }

    setIsLoadingArticles(true);
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('userId', '==', user.uid), orderBy('dateAdded', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedArticles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dateAdded = data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : data.dateAdded as string;
        return {
          ...data,
          id: doc.id,
          dateAdded,
          aiRelevance: data.aiRelevance ? { ...data.aiRelevance, isLoading: false } : undefined,
        } as Article;
      });
      setArticles(fetchedArticles);
      setIsLoadingArticles(false);
    }, (error) => {
      console.error("Error fetching articles: ", error);
      toast({
        title: "Error",
        description: "Could not fetch articles from the library.",
        variant: "destructive",
      });
      setIsLoadingArticles(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const handleAddArticle = useCallback(async (newArticleData: Partial<Article>) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add articles to your library.",
        variant: "destructive",
      });
      setIsAddContentDialogOpen(false); 
      return;
    }

    const db = getFirebaseFirestore(); 
    if (!db) {
        toast({ title: "Database Error", description: "Database not available. Cannot save article.", variant: "destructive" });
        return;
    }

    const articleToSave: Omit<Article, 'id' | 'dateAdded'> & { dateAdded: any } = {
      userId: user.uid,
      title: newArticleData.title || 'Untitled Article',
      url: newArticleData.url!,
      summary: newArticleData.summary || 'No summary available.',
      tags: newArticleData.tags || [],
      dateAdded: serverTimestamp(),
      isRead: false,
      imageUrl: newArticleData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: newArticleData.dataAiHint || 'general content',
      sourceName: newArticleData.sourceName ?? null,
      content: newArticleData.content ?? null,
      aiRelevance: newArticleData.aiRelevance 
        ? { score: newArticleData.aiRelevance.score, reasoning: newArticleData.aiRelevance.reasoning } 
        : null,
    };

    try {
      await addDoc(collection(db, 'articles'), articleToSave);
      toast({
        title: "Article Added",
        description: `"${articleToSave.title}" has been added to your library.`,
      });
      setIsAddContentDialogOpen(false); 
    } catch (error) {
      console.error("Error adding article: ", error);
      toast({ title: "Error", description: "Could not add article to your library.", variant: "destructive" });
    }
  }, [user, toast]);


  const handleAddRssFeed = (newFeed: Partial<RssFeed>) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add RSS feeds.",
        variant: "destructive",
      });
      setIsAddContentDialogOpen(false);
      return;
    }
    // For now, RSS feeds are added locally. Firestore persistence can be added later.
    const completeFeed: RssFeed = {
      id: newFeed.id || Date.now().toString(),
      url: newFeed.url || '',
      name: newFeed.name || 'Untitled Feed',
      ...newFeed,
    };
    setRssFeeds(prevFeeds => [completeFeed, ...prevFeeds]);
     toast({
      title: "RSS Feed Added",
      description: `"${completeFeed.name}" has been added. (Note: RSS feeds are currently local and not saved to Firebase)`,
    });
    setIsAddContentDialogOpen(false);
  };

  const handleUpdateArticle = useCallback(async (updatedArticle: Article) => {
    const db = getFirebaseFirestore(); 
    if (!db || !user || !updatedArticle.id) {
      toast({ title: "Error", description: "Could not update article. User or article ID missing.", variant: "destructive" });
      return;
    }

    const articleRef = doc(db, 'articles', updatedArticle.id);
    const { isLoading, ...aiRelevanceToSave } = updatedArticle.aiRelevance || {};
    
    // Ensure dateAdded is a Firebase Timestamp or a Date object for update
    let dateAddedForUpdate: Timestamp | Date;
    if (updatedArticle.dateAdded instanceof Timestamp) {
      dateAddedForUpdate = updatedArticle.dateAdded;
    } else if (typeof updatedArticle.dateAdded === 'string') {
      dateAddedForUpdate = new Date(updatedArticle.dateAdded);
    } else {
      // Fallback or handle error if dateAdded is not in expected format
      // For this example, we'll default to now, but ideally this case is handled by type consistency.
      dateAddedForUpdate = new Date(); 
    }

    const dataToUpdate = {
        ...updatedArticle,
        aiRelevance: updatedArticle.aiRelevance ? aiRelevanceToSave : null,
        dateAdded: dateAddedForUpdate,
        // Ensure optional fields are null if undefined
        content: updatedArticle.content ?? null,
        sourceName: updatedArticle.sourceName ?? null,
    };
    delete (dataToUpdate as any).id; // id should not be part of the update data

    try {
      await updateDoc(articleRef, dataToUpdate);
      // Toast for update is often handled by the component triggering it, or can be added here
    } catch (error) {
      console.error("Error updating article: ", error);
      toast({ title: "Error", description: "Could not update article.", variant: "destructive" });
    }
  }, [user, toast]);

  const handleInitiateDeleteArticle = (article: Article) => {
    setArticleToDelete(article);
  };

  const handleConfirmDeleteArticle = async () => {
    if (!articleToDelete || !articleToDelete.id) {
       toast({ title: "Error", description: "Could not delete article. Article ID missing.", variant: "destructive" });
      return;
    }

    const db = getFirebaseFirestore(); 
    if (!db || !user) {
         toast({ title: "Error", description: "Could not delete article. User or database not available.", variant: "destructive" });
        return;
    }

    const articleRef = doc(db, 'articles', articleToDelete.id);
    try {
      await deleteDoc(articleRef);
      toast({
        title: "Article Deleted",
        description: `"${articleToDelete.title}" has been removed from your library.`,
      });
      setArticleToDelete(null);
    } catch (error) {
      console.error("Error deleting article: ", error);
      toast({ title: "Error", description: "Could not delete article.", variant: "destructive" });
      setArticleToDelete(null);
    }
  };

  const displayArticles = articles;

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto">
        {authLoading || (isLoadingArticles && user) ? (
          <div className="text-center py-12 text-muted-foreground">Loading articles...</div>
        ) : !user && !authLoading ? ( // Removed check for displayArticles.length here
          <div className="text-center py-12">
            <h2 className="text-2xl font-headline mb-2">Welcome to Your Personal Archive</h2>
            <p className="text-muted-foreground">Please log in to add, manage, and view your articles.</p>
          </div>
        ) : displayArticles.length === 0 && !isLoadingArticles ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-headline mb-2">Your Library is Empty</h2>
            <p className="text-muted-foreground">Click "Add Content" to save your first article!</p>
          </div>
        ) : (
          <ArticleList
            articles={displayArticles}
            onUpdateArticle={handleUpdateArticle}
            onDeleteArticle={handleInitiateDeleteArticle}
          />
        )}
      </div>
      <AddContentDialog
        isOpen={isAddContentDialogOpen}
        onOpenChange={setIsAddContentDialogOpen}
        onAddArticle={handleAddArticle}
        onAddRssFeed={handleAddRssFeed}
        isUserLoggedIn={!!user}
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
