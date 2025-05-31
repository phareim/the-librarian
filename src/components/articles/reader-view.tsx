'use client';

import type { Article } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, ExternalLink, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ReaderViewProps {
  article: Article | null;
}

export function ReaderView({ article }: ReaderViewProps) {
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h1 className="text-3xl font-headline mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">The article you are looking for does not exist or could not be loaded.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(article.dateAdded).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-2">
          {article.sourceName && <span>From: <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{article.sourceName} <ExternalLink className="inline h-3 w-3 ml-0.5"/></a></span>}
          <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4" /> Added: {formattedDate}</span>
        </div>
        {article.tags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="mr-2 my-1">
            <TagIcon className="mr-1 h-3 w-3" />{tag.name}
          </Badge>
        ))}
      </header>
      
      {article.imageUrl && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden shadow-md">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover"
            data-ai-hint={article.dataAiHint || 'placeholder'}
          />
        </div>
      )}

      <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-headline prose-p:font-body prose-li:font-body prose-a:text-primary hover:prose-a:text-primary/80">
        {/* For simplicity, assuming content is pre-formatted HTML or Markdown that can be rendered directly.
            A more robust solution would use a Markdown parser like 'react-markdown'.
            Using dangerouslySetInnerHTML for PoC with mock HTML content.
            If content is plain text, wrap it in <p>. If Markdown, use a parser.
        */}
        {article.content?.startsWith('<') ? (
            <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
        ) : (
            <p>{article.content}</p>
        )}
        {!article.content && article.summary && <p>{article.summary}</p>}
        {!article.content && !article.summary && <p>No content available for this article. You can view it at the original source.</p>}
      </article>

      <footer className="mt-12 pt-8 border-t">
         <Button variant="default" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              View Original Source <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
      </footer>
    </div>
  );
}
