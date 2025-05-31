'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Article, Tag } from '@/types';
import { predictArticleRelevance, type PredictArticleRelevanceInput } from '@/ai/flows/predict-article-relevance';
import { USER_READING_HISTORY } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ArticleCardProps {
  article: Article;
  onUpdateArticle: (updatedArticle: Article) => void;
}

export function ArticleCard({ article, onUpdateArticle }: ArticleCardProps) {
  const [isPredicting, setIsPredicting] = useState(false);
  const { toast } = useToast();

  const handlePredictRelevance = async () => {
    setIsPredicting(true);
    onUpdateArticle({ ...article, aiRelevance: { ...article.aiRelevance, score: 0, reasoning: '', isLoading: true } });
    try {
      const input: PredictArticleRelevanceInput = {
        // Use summary for now, or full content if available and short enough.
        // A real app might fetch full content on demand for AI processing.
        articleContent: article.summary || article.title,
        userReadingHistory: USER_READING_HISTORY,
      };
      const result = await predictArticleRelevance(input);
      onUpdateArticle({ ...article, aiRelevance: { score: result.relevanceScore, reasoning: result.reasoning, isLoading: false } });
      toast({
        title: "Relevance Predicted",
        description: `Score: ${result.relevanceScore.toFixed(2)} for "${article.title}"`,
      });
    } catch (error) {
      console.error('Error predicting relevance:', error);
      onUpdateArticle({ ...article, aiRelevance: { ...article.aiRelevance, score: 0, reasoning: 'Error predicting relevance.', isLoading: false } });
       toast({
        title: "Prediction Error",
        description: "Could not predict relevance for this article.",
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const formattedDate = new Date(article.dateAdded).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        {article.imageUrl && (
          <div className="relative aspect-video mb-4 rounded-t-lg overflow-hidden">
            <Image 
              src={article.imageUrl} 
              alt={article.title} 
              layout="fill" 
              objectFit="cover"
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
        
        {article.aiRelevance && !article.aiRelevance.isLoading && (
          <div className="mb-3 p-3 bg-accent/20 rounded-md border border-accent/50">
            <p className="text-xs font-semibold text-accent-foreground mb-1">AI Relevance: {article.aiRelevance.score.toFixed(2)} / 1.0</p>
            <p className="text-xs text-accent-foreground/80 line-clamp-2">{article.aiRelevance.reasoning}</p>
          </div>
        )}
         {article.aiRelevance?.isLoading && (
          <div className="mb-3 p-3 bg-accent/10 rounded-md border border-accent/30 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin text-accent-foreground/70" />
            <p className="text-xs text-accent-foreground/70">Predicting relevance...</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          {article.category && (
            <Badge variant="outline" className="border-primary/50 text-primary/80">{article.category.name}</Badge>
          )}
          {article.tags.map((tag: Tag) => (
            <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground self-center sm:self-auto">Added: {formattedDate}</p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/read/${article.id}`}>
              <BookOpen className="mr-2 h-4 w-4" /> Read
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePredictRelevance} disabled={isPredicting || article.aiRelevance?.isLoading}>
            {isPredicting || article.aiRelevance?.isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {article.aiRelevance?.score ? 'Re-check' : 'AI Check'}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Source
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
