
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
  isUserLoggedIn: boolean;
}

export function AddContentDialog({ isOpen, onOpenChange, onAddArticle, onAddRssFeed, isUserLoggedIn }: AddContentDialogProps) {
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
    // The onAddArticle callback (from page.tsx) will now handle the !isUserLoggedIn case with a toast
    setIsExtractingInfo(true);
    
    let extractedInfo: ExtractArticleInfoOutput = {
        title: values.url,
        summary: 'Extracting information...',
        imageUrl: null, // Ensure it's null not undefined
        dataAiHint: "content hint", // Ensure it's a string
    };
    let sourceName;

    try {
      toast({
        title: "Extracting Information...",
        description: "AI is fetching title, summary, and image from the URL.",
      });
      extractedInfo = await extractArticleInfo({ articleUrl: values.url });
      
      try {
        const urlObject = new URL(values.url);
        sourceName = urlObject.hostname.replace(/^www\./, '');
      } catch {
        sourceName = undefined;
      }

      if (extractedInfo.title.toLowerCase().includes("extraction failed")) {
          toast({
              title: "AI Extraction Issues",
              description: extractedInfo.summary || "AI had trouble extracting all info. Review the added article.",
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
      extractedInfo.title = values.url; 
      extractedInfo.summary = "Error extracting content. Please check the URL or try again.";
      extractedInfo.imageUrl = null;
      extractedInfo.dataAiHint = "extraction error";
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
      title: extractedInfo.title,
      summary: extractedInfo.summary,
      sourceName: sourceName,
      tags: [], 
      imageUrl: extractedInfo.imageUrl || undefined, // Use undefined if null for proper fallback
      dataAiHint: extractedInfo.dataAiHint || undefined,
    };
    onAddArticle(newArticle);
    urlForm.reset();
    // onOpenChange(false) will be handled by onAddArticle if successful or login required
  };

  const handleAddRss = (values: z.infer<typeof rssFormSchema>) => {
    // onAddRssFeed will be called, page.tsx might choose to show a login toast if needed for RSS persistence
    const newRssFeed: Partial<RssFeed> = {
      url: values.rssUrl,
      name: values.name,
      lastFetched: new Date().toISOString(),
    };
    onAddRssFeed(newRssFeed);
    rssForm.reset();
    // onOpenChange(false); // Let onAddRssFeed handle this if it needs to
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
            Add a URL to save an article to your archive, or an RSS feed to follow.
            {!isUserLoggedIn && " Please note: Articles can only be saved if you are logged in."}
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
