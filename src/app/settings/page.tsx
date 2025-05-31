'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/header';
import { AddContentDialog } from '@/components/forms/add-content-dialog';
import type { Article, RssFeed } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';


export default function SettingsPage() {
  const [isAddContentDialogOpen, setIsAddContentDialogOpen] = useState(false);
  const { toast } = useToast();

  // Placeholder handlers for AddContentDialog
  const handleAddArticle = (newArticleData: Partial<Article>) => {
    console.log("Add article from settings page (placeholder):", newArticleData);
     toast({ title: "Action Placeholder", description: "Add article action triggered."});
  };
  const handleAddRssFeed = (newFeed: Partial<RssFeed>) => {
    console.log("Add RSS feed from settings page (placeholder):", newFeed);
    toast({ title: "Action Placeholder", description: "Add RSS feed action triggered."});
  };
  
  const [userProfile, setUserProfile] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    readingHistorySummary: "Loves technology, AI, and productivity articles. Prefers deep dives and tutorials.",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    // In a real app, this would save to a backend
    console.log("Profile saved:", userProfile);
    toast({
      title: "Settings Saved",
      description: "Your profile information has been updated.",
    });
  };


  return (
    <main className="flex flex-1 flex-col">
      <AppHeader onAddContentClick={() => setIsAddContentDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <h1 className="text-2xl font-headline mb-6">Settings</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-headline">User Profile</CardTitle>
            <CardDescription>Manage your profile information. This helps AI tailor recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={userProfile.name} onChange={handleProfileChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={userProfile.email} onChange={handleProfileChange} />
            </div>
            <div>
              <Label htmlFor="readingHistorySummary">Reading Interests / History Summary</Label>
              <Textarea 
                id="readingHistorySummary" 
                name="readingHistorySummary" 
                value={userProfile.readingHistorySummary} 
                onChange={handleProfileChange}
                placeholder="Describe your reading interests, e.g., 'Interested in AI, software development, and space exploration.'"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">This summary is used by the AI to predict article relevance. Update it to reflect your current interests.</p>
            </div>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">RSS Feeds</CardTitle>
            <CardDescription>Manage your subscribed RSS feeds. (Feature coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">RSS feed management will be available here in a future update.</p>
            {/* Placeholder for listing and managing RSS feeds */}
          </CardContent>
        </Card>

      </div>
      <AddContentDialog
        isOpen={isAddContentDialogOpen}
        onOpenChange={setIsAddContentDialogOpen}
        onAddArticle={handleAddArticle}
        onAddRssFeed={handleAddRssFeed}
      />
    </main>
  );
}
