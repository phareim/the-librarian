
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Article, Tag } from '@/types';
import { predictArticleRelevance, type PredictArticleRelevanceInput } from '@/ai/flows/predict-article-relevance';
import { USER_READING_HISTORY } from '@/lib/mock-data'; // This should ideally come from user settings
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Timestamp } from 'firebase/firestore';

interface ArticleCardProps {
  article: Article;
  onUpdateArticle: (updatedArticle: Article) => void;
  onDeleteArticle: (article: Article) => void;
}

export function ArticleCard({ article, onUpdateArticle, onDeleteArticle }: ArticleCardProps) {
  const [isPredicting, setIsPredicting] = useState(article.aiRelevance?.isLoading || false);
  const { toast } = useToast();

  // Effect to sync isPredicting state with article prop if it changes externally
  useEffect(() => {
    setIsPredicting(article.aiRelevance?.isLoading || false);
  }, [article.aiRelevance?.isLoading]);

  const handlePredictRelevance = async () => {
    setIsPredicting(true);
    // Immediately update local UI state for loading
    const tempArticleWithLoading = { 
      ...article, 
      aiRelevance: { 
        score: article.aiRelevance?.score || 0, 
        reasoning: article.aiRelevance?.reasoning || '', 
        isLoading: true 
      } 
    };
    // Visually update the card, but don't persist isLoading to Firestore yet.
    // The actual onUpdateArticle will handle persistence.
    // For local display, we can use this state.
    // Let's assume onUpdateArticle correctly handles not saving isLoading.

    // The actual call to onUpdateArticle for Firestore should happen with final data.
    // Here, we primarily trigger the AI flow.
    try {
      const input: PredictArticleRelevanceInput = {
        articleContent: article.summary || article.title,
        userReadingHistory: USER_READING_HISTORY, // In a real app, fetch this dynamically
      };
      const result = await predictArticleRelevance(input);
      onUpdateArticle({ 
        ...article, 
        aiRelevance: { score: result.relevanceScore, reasoning: result.reasoning, isLoading: false } 
      });
      toast({
        title: "Relevance Predicted",
        description: `Score: ${result.relevanceScore.toFixed(2)} for "${article.title}"`,
      });
    } catch (error) {
      console.error('Error predicting relevance:', error);
      onUpdateArticle({ 
        ...article, 
        aiRelevance: { 
          score: article.aiRelevance?.score || 0, // Keep old score on error
          reasoning: 'Error predicting relevance.', 
          isLoading: false 
        } 
      });
       toast({
        title: "Prediction Error",
        description: "Could not predict relevance for this article.",
        variant: "destructive",
      });
    } finally {
      // isLoading state will be set to false by onUpdateArticle via onSnapshot eventually
      // setIsPredicting(false); // This might be set too early if onUpdateArticle is async and updates DB
    }
  };

  const handleDeleteClick = () => {
    onDeleteArticle(article);
  };

  const getDateString = (dateValue: string | Timestamp | Date): string => {
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // If it's a Firestore Timestamp object (it shouldn't be here if page.tsx converts it)
    if (dateValue && typeof (dateValue as Timestamp).toDate === 'function') {
      return (dateValue as Timestamp).toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return 'Date not available';
  };
  
  const formattedDate = getDateString(article.dateAdded);


  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {article.imageUrl && (
          <div className="relative aspect-video mb-4 rounded-t-lg overflow-hidden">
            <Image 
              src={article.imageUrl} 
              alt={article.title} 
              fill={true}
              style={{objectFit: "cover"}}
              data-ai-hint={article.dataAiHint || 'placeholder'}
            />
          </div>
        )}
        <CardTitle className="font-headline text-xl leading-tight">
          <Link href={`/read/${article.id}`} className="hover:text-primary transition-colors">
            {article.title}
          </Link>
        </CardTitle>
        {article.sourceName && (
          <CardDescription className="text-sm text-muted-foreground">
            From: {article.sourceName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 mb-4 line-clamp-3">{article.summary}</p>
        
        {article.aiRelevance && !isPredicting && article.aiRelevance.score !== undefined && (
          <div className="mb-3 p-3 bg-accent/20 rounded-md border border-accent/50">
            <p className="text-xs font-semibold text-accent-foreground mb-1">AI Relevance: {article.aiRelevance.score.toFixed(2)} / 1.0</p>
            <p className="text-xs text-accent-foreground/80 line-clamp-2">{article.aiRelevance.reasoning}</p>
          </div>
        )}
         {isPredicting && (
          <div className="mb-3 p-3 bg-accent/10 rounded-md border border-accent/30 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin text-accent-foreground/70" />
            <p className="text-xs text-accent-foreground/70">Predicting relevance...</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          {article.tags && article.tags.map((tag: Tag) => ( // Added check for article.tags
            <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground self-center sm:self-auto">Added: {formattedDate}</p>
        <div className="flex gap-1 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/read/${article.id}`}>
              <BookOpen className="mr-2 h-4 w-4" /> Read
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePredictRelevance} disabled={isPredicting}>
            {isPredicting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {article.aiRelevance?.score !== undefined ? 'Re-check' : 'AI Check'}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Source
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDeleteClick} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
