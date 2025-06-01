
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
      const fetchedArticles = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        let clientDateAdded: string;
        if (data.dateAdded instanceof Timestamp) {
          clientDateAdded = data.dateAdded.toDate().toISOString();
        } else if (typeof data.dateAdded === 'string') {
          const parsedDate = new Date(data.dateAdded);
          if (!isNaN(parsedDate.getTime())) {
            clientDateAdded = data.dateAdded; 
          } else {
            console.warn(`Article ${docSnap.id} has invalid dateAdded string: ${data.dateAdded}. Falling back to current date.`);
            clientDateAdded = new Date().toISOString(); 
          }
        } else {
          console.warn(`Article ${docSnap.id} has missing or unexpected dateAdded type: ${typeof data.dateAdded}. Falling back to current date.`);
          clientDateAdded = new Date().toISOString(); 
        }

        return {
          ...data,
          id: docSnap.id,
          dateAdded: clientDateAdded,
          aiRelevance: data.aiRelevance ? { ...data.aiRelevance, isLoading: false } : null,
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
      aiRelevance: newArticleData.aiRelevance && newArticleData.aiRelevance.score !== undefined
        ? { score: newArticleData.aiRelevance.score, reasoning: newArticleData.aiRelevance.reasoning }
        : null,
    };

    try {
      console.log("Attempting to add article to Firestore with data:", JSON.stringify(articleToSave, null, 2));
      const docRef = await addDoc(collection(db, 'articles'), articleToSave);
      console.log("Article added successfully to Firestore with ID: ", docRef.id);
      toast({
        title: "Article Added",
        description: `"${articleToSave.title}" has been added to your library.`,
      });
      setIsAddContentDialogOpen(false);
    } catch (error) {
      console.error("FirebaseError: Error adding article to Firestore: ", error);
      let detailedErrorMessage = "Could not save article. Please check browser console for details.";
      if (error instanceof Error) {
        detailedErrorMessage = `Failed to save article: ${error.message}`;
        if ((error as any).code) { // Check for Firebase error code
          detailedErrorMessage += ` (Error Code: ${(error as any).code})`;
        }
      }
      toast({
        title: "Save Error",
        description: detailedErrorMessage,
        variant: "destructive",
      });
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
    
    const aiRelevanceToSave = updatedArticle.aiRelevance && updatedArticle.aiRelevance.score !== undefined
        ? { score: updatedArticle.aiRelevance.score, reasoning: updatedArticle.aiRelevance.reasoning }
        : null;
    
    let dateAddedForUpdate: Date;
    if (typeof updatedArticle.dateAdded === 'string') {
      const parsedDate = new Date(updatedArticle.dateAdded);
      if (!isNaN(parsedDate.getTime())) {
        dateAddedForUpdate = parsedDate;
      } else {
        dateAddedForUpdate = new Date();
      }
    } else if (updatedArticle.dateAdded instanceof Timestamp) {
      dateAddedForUpdate = updatedArticle.dateAdded.toDate();
    }
     else {
      dateAddedForUpdate = new Date();
    }

    const dataToUpdate = {
        ...updatedArticle,
        aiRelevance: aiRelevanceToSave,
        dateAdded: dateAddedForUpdate,
        content: updatedArticle.content ?? null,
        sourceName: updatedArticle.sourceName ?? null,
    };
    delete (dataToUpdate as any).id;

    try {
      console.log("Attempting to update article in Firestore with data:", JSON.stringify(dataToUpdate, null, 2));
      await updateDoc(articleRef, dataToUpdate);
      console.log("Article updated successfully in Firestore for ID: ", updatedArticle.id);
      // Toast for update success can be here or handled by calling component
    } catch (error) {
      console.error("FirebaseError: Error updating article in Firestore: ", error);
      let detailedErrorMessage = "Could not update article. Please check browser console for details.";
      if (error instanceof Error) {
        detailedErrorMessage = `Failed to update article: ${error.message}`;
         if ((error as any).code) {
          detailedErrorMessage += ` (Error Code: ${(error as any).code})`;
        }
      }
      toast({ title: "Update Error", description: detailedErrorMessage, variant: "destructive" });
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
      console.log("Attempting to delete article from Firestore with ID: ", articleToDelete.id);
      await deleteDoc(articleRef);
      console.log("Article deleted successfully from Firestore.");
      toast({
        title: "Article Deleted",
        description: `"${articleToDelete.title}" has been removed from your library.`,
      });
      setArticleToDelete(null);
    } catch (error) {
      console.error("FirebaseError: Error deleting article from Firestore: ", error);
      let detailedErrorMessage = "Could not delete article. Please check browser console for details.";
       if (error instanceof Error) {
        detailedErrorMessage = `Failed to delete article: ${error.message}`;
        if ((error as any).code) {
          detailedErrorMessage += ` (Error Code: ${(error as any).code})`;
        }
      }
      toast({ title: "Delete Error", description: detailedErrorMessage, variant: "destructive" });
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
        ) : !user && !authLoading ? (
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

    