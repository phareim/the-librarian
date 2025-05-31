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
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from './tag-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Article, Category, RssFeed, Tag } from '@/types';
import { MOCK_CATEGORIES } from '@/lib/mock-data'; // Assuming mock categories are available

const urlFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  title: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  categoryId: z.string().optional(),
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
  const urlForm = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: '',
      title: '',
      summary: '',
      tags: [],
    },
  });

  const rssForm = useForm<z.infer<typeof rssFormSchema>>({
    resolver: zodResolver(rssFormSchema),
    defaultValues: {
      rssUrl: '',
      name: '',
    },
  });

  const handleAddUrl = (values: z.infer<typeof urlFormSchema>) => {
    const newArticle: Partial<Article> = {
      id: Date.now().toString(),
      url: values.url,
      title: values.title || values.url, // Fallback title
      summary: values.summary,
      tags: values.tags || [],
      category: values.categoryId ? MOCK_CATEGORIES.find(c => c.id === values.categoryId) : undefined,
      dateAdded: new Date().toISOString(),
      imageUrl: 'https://placehold.co/600x400.png', // Placeholder image
      dataAiHint: 'general web content',
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                <FormField
                  control={urlForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom title for the article" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={urlForm.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief summary of the article" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={urlForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add tags (press Enter or ,)"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={urlForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_CATEGORIES.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Add Article</Button>
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
