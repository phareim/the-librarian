
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Article, RssFeed } from '@/types';
import { extractArticleInfo, type ExtractArticleInfoOutput } from '@/ai/flows/extract-article-info-flow';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from 'lucide-react';

const urlFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

const rssFormSchema = z.object({
  rssUrl: z.string().url({ message: "Please enter a valid RSS feed URL." }),
  name: z.string().min(1, { message: "Please enter a name for the RSS feed."}),
});

interface AddContentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddArticle: (article: Partial<Article>) => void;
  onAddRssFeed: (feed: Partial<RssFeed>) => void;
}

export function AddContentDialog({ isOpen, onOpenChange, onAddArticle, onAddRssFeed }: AddContentDialogProps) {
  const [isExtractingInfo, setIsExtractingInfo] = useState(false);
  const { toast } = useToast();

  const urlForm = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: '',
    },
  });

  const rssForm = useForm<z.infer<typeof rssFormSchema>>({
    resolver: zodResolver(rssFormSchema),
    defaultValues: {
      rssUrl: '',
      name: '',
    },
  });

  const handleAddUrl = async (values: z.infer<typeof urlFormSchema>) => {
    setIsExtractingInfo(true);
    let articleTitle = values.url; 
    let articleSummary = 'Processing...'; 

    try {
      toast({
        title: "Extracting Information...",
        description: "AI is fetching title and summary from the URL.",
      });
      const extractedInfo: ExtractArticleInfoOutput = await extractArticleInfo({ articleUrl: values.url });
      
      articleTitle = extractedInfo.title; 
      articleSummary = extractedInfo.summary;

      if (extractedInfo.title.toLowerCase().includes("extraction failed") || extractedInfo.summary.toLowerCase().includes("extraction failed")) {
          toast({
              title: "AI Extraction Note",
              description: "AI had trouble extracting all info. Review the added article.",
              variant: "default", 
          });
      } else {
           toast({
              title: "Information Extracted",
              description: "AI has processed the URL.",
          });
      }
    } catch (error) {
      console.error("Failed to extract article info:", error);
      articleTitle = values.url; 
      articleSummary = "Error extracting content. Please check the URL or try again.";
      toast({
        title: "AI Extraction Error",
        description: "Could not process the URL due to an error.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingInfo(false);
    }

    const newArticle: Partial<Article> = {
      url: values.url,
      title: articleTitle,
      summary: articleSummary,
      tags: [], 
    };
    onAddArticle(newArticle);
    urlForm.reset();
    onOpenChange(false);
  };

  const handleAddRss = (values: z.infer<typeof rssFormSchema>) => {
    const newRssFeed: Partial<RssFeed> = {
      id: Date.now().toString(),
      url: values.rssUrl,
      name: values.name,
      lastFetched: new Date().toISOString(),
    };
    onAddRssFeed(newRssFeed);
    rssForm.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        urlForm.reset();
        rssForm.reset();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Content</DialogTitle>
          <DialogDescription>
            Add a URL or an RSS feed to your personal archive.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Add URL</TabsTrigger>
            <TabsTrigger value="rss">Add RSS Feed</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <Form {...urlForm}>
              <form onSubmit={urlForm.handleSubmit(handleAddUrl)} className="space-y-4 py-4">
                <FormField
                  control={urlForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/article" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={isExtractingInfo}>
                    {isExtractingInfo ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Extracting & Adding...
                      </>
                    ) : (
                      'Add Article'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="rss">
            <Form {...rssForm}>
              <form onSubmit={rssForm.handleSubmit(handleAddRss)} className="space-y-4 py-4">
                <FormField
                  control={rssForm.control}
                  name="rssUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RSS Feed URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/feed.xml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rssForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., My Favorite Blog" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Add RSS Feed</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
