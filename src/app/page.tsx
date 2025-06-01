
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
    const db = getFirebaseFirestore(); // Get db instance
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
      const localArticle: Article = {
        id: `local-${Date.now().toString()}`,
        userId: 'local-session-user', 
        title: newArticleData.title || 'Untitled Article',
        url: newArticleData.url || '',
        summary: newArticleData.summary || 'No summary available.',
        imageUrl: newArticleData.imageUrl || 'https://placehold.co/600x400.png',
        dataAiHint: newArticleData.dataAiHint || 'general content',
        tags: newArticleData.tags || [],
        dateAdded: new Date().toISOString(),
        isRead: false,
        sourceName: newArticleData.sourceName,
        content: newArticleData.content,
        aiRelevance: newArticleData.aiRelevance ? { ...newArticleData.aiRelevance, isLoading: false } : undefined,
      };
      setArticles(prevArticles => [localArticle, ...prevArticles]);
      toast({
        title: "Article Added Locally",
        description: `"${localArticle.title}" has been added to your current session. Login to save permanently.`,
      });
      return;
    }

    const db = getFirebaseFirestore(); // Get db instance
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
      sourceName: newArticleData.sourceName,
      content: newArticleData.content, 
      aiRelevance: newArticleData.aiRelevance ? { score: newArticleData.aiRelevance.score, reasoning: newArticleData.aiRelevance.reasoning } : undefined,
    };
    
    try {
      await addDoc(collection(db, 'articles'), articleToSave);
      toast({
        title: "Article Added",
        description: `"${articleToSave.title}" has been added to your library.`,
      });
    } catch (error) {
      console.error("Error adding article: ", error);
      toast({ title: "Error", description: "Could not add article to your library.", variant: "destructive" });
    }
  }, [user, toast]);


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

  const handleUpdateArticle = useCallback(async (updatedArticle: Article) => {
    const db = getFirebaseFirestore(); // Get db instance
    if (!db || !user || !updatedArticle.id || updatedArticle.id.startsWith('local-')) {
      if (updatedArticle.id.startsWith('local-')) { 
         setArticles(prevArticles => prevArticles.map(a => a.id === updatedArticle.id ? updatedArticle : a));
         return;
      }
      toast({ title: "Error", description: "Could not update article. User or article ID missing.", variant: "destructive" });
      return;
    }
    
    const articleRef = doc(db, 'articles', updatedArticle.id);
    const { isLoading, ...aiRelevanceToSave } = updatedArticle.aiRelevance || {};
    const dataToUpdate = {
        ...updatedArticle,
        aiRelevance: updatedArticle.aiRelevance ? aiRelevanceToSave : null, 
        dateAdded: updatedArticle.dateAdded instanceof Timestamp ? updatedArticle.dateAdded : new Date(updatedArticle.dateAdded as string) 
    };
    delete (dataToUpdate as any).id;

    try {
      await updateDoc(articleRef, dataToUpdate);
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

    if (articleToDelete.id.startsWith('local-')) { 
        setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
        toast({
            title: "Local Article Deleted",
            description: `"${articleToDelete.title}" has been removed from this session.`,
        });
        setArticleToDelete(null);
        return;
    }
    
    const db = getFirebaseFirestore(); // Get db instance
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
        ) : !user && !authLoading && displayArticles.length === 0 ? ( 
          <div className="text-center py-12">
            <h2 className="text-2xl font-headline mb-2">Welcome to Your Personal Archive</h2>
            <p className="text-muted-foreground">Please log in to manage and view your articles, or add content to view it in this session.</p>
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
