
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Article, RssFeed } from '@/types';
import { ArticleList } from '@/components/articles/article-list';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import { AppHeader } from '@/components/layout/header';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
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
    if (!db || !user) {
      setArticles([]);
      setIsLoadingArticles(false);
      if (!authLoading && !user) {
         // Optionally, inform user to log in if not loading and no user
      }
      return;
    }

    setIsLoadingArticles(true);
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('userId', '==', user.uid), orderBy('dateAdded', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedArticles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to ISO string for client-side consistency
        const dateAdded = data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : data.dateAdded as string;
        return {
          ...data,
          id: doc.id,
          dateAdded,
          // Ensure aiRelevance.isLoading is not persisted or handled appropriately
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
    if (!db || !user) {
      toast({ title: "Error", description: "You must be logged in to add articles.", variant: "destructive" });
      return;
    }

    const articleToSave = {
      ...newArticleData, // Contains title, summary, url from AI extraction
      userId: user.uid,
      tags: newArticleData.tags || [],
      dateAdded: serverTimestamp(), // Firestore will set this
      isRead: false,
      imageUrl: newArticleData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: newArticleData.dataAiHint || 'general content',
      sourceName: newArticleData.sourceName, // Ensure this is passed if available
      content: newArticleData.content, // Ensure this is passed if available
    };
    
    // Remove id if it was part of newArticleData to let Firestore generate it
    // The `id` field in `articleToSave` should not exist for `addDoc`
    const { id, ...dataToSaveWithoutId } = articleToSave as any;


    try {
      const docRef = await addDoc(collection(db, 'articles'), dataToSaveWithoutId);
      toast({
        title: "Article Added",
        description: `"${newArticleData.title || 'Article'}" has been added to your library.`,
      });
      // No need to manually add to local state if onSnapshot is working correctly
    } catch (error) {
      console.error("Error adding article: ", error);
      toast({ title: "Error", description: "Could not add article.", variant: "destructive" });
    }
  }, [user, toast]);


  const handleAddRssFeed = (newFeed: Partial<RssFeed>) => {
    // RSS Feed logic will need Firestore integration similar to articles if persisted
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

  const handleUpdateArticle = useCallback(async (updatedArticle: Article) => {
    if (!db || !user || !updatedArticle.id) {
      toast({ title: "Error", description: "Could not update article. User or article ID missing.", variant: "destructive" });
      return;
    }
    
    const articleRef = doc(db, 'articles', updatedArticle.id);
    // Prepare data for Firestore, ensuring not to save UI-specific state like `isLoading`
    const { isLoading, ...aiRelevanceToSave } = updatedArticle.aiRelevance || {};
    const dataToUpdate = {
        ...updatedArticle,
        aiRelevance: updatedArticle.aiRelevance ? aiRelevanceToSave : null, // Store null if no relevance
        dateAdded: updatedArticle.dateAdded instanceof Timestamp ? updatedArticle.dateAdded : new Date(updatedArticle.dateAdded as string) // Ensure it's a Date or Timestamp
    };
    // Firestore expects simple objects, remove id from the data payload for update.
    delete (dataToUpdate as any).id;


    try {
      await updateDoc(articleRef, dataToUpdate);
      // Optimistic update handled by onSnapshot
      // toast({ title: "Article Updated", description: `"${updatedArticle.title}" has been updated.` });
    } catch (error) {
      console.error("Error updating article: ", error);
      toast({ title: "Error", description: "Could not update article.", variant: "destructive" });
    }
  }, [user, toast]);

  const handleInitiateDeleteArticle = (article: Article) => {
    setArticleToDelete(article);
  };

  const handleConfirmDeleteArticle = async () => {
    if (!db || !user || !articleToDelete || !articleToDelete.id) {
       toast({ title: "Error", description: "Could not delete article. User or article ID missing.", variant: "destructive" });
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
      // Optimistic update handled by onSnapshot
    } catch (error) {
      console.error("Error deleting article: ", error);
      toast({ title: "Error", description: "Could not delete article.", variant: "destructive" });
      setArticleToDelete(null);
    }
  };

  const displayArticles = user ? articles : [];

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto">
        {authLoading || (isLoadingArticles && user) ? (
          <div className="text-center py-12 text-muted-foreground">Loading articles...</div>
        ) : !user ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-headline mb-2">Welcome to Your Personal Archive</h2>
            <p className="text-muted-foreground">Please log in to manage and view your articles.</p>
          </div>
        ) : displayArticles.length === 0 && !isLoadingArticles ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-headline mb-2">Your Library is Empty</h2>
            <p className="text-muted-foreground">Add some articles or RSS feeds to get started!</p>
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
