'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface AppHeaderProps {
  onAddContentClick: () => void;
}

export function AppHeader({ onAddContentClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-headline font-semibold">Personal Archive</h1>
        <Button onClick={onAddContentClick} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Content
        </Button>
      </div>
    </header>
  );
}
