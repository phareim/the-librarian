'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
// import { useTheme } from "next-themes"; // next-themes can be added later if needed

export function AppLayout({ children }: { children: React.ReactNode }) {
  // const { setTheme, theme } = useTheme(); // For theme toggling
  const [sidebarOpen, setSidebarOpen] = React.useState(true); // Default to open on desktop
  
  // This is a placeholder for theme toggling logic
  const toggleTheme = () => {
    // Implement theme toggling if next-themes is integrated
    // For now, it does nothing or can console.log
    console.log("Toggle theme clicked");
    // const newTheme = theme === "light" ? "dark" : "light";
    // setTheme(newTheme);
  };

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
            {/* Simple text logo for now */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span className="font-headline text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">
              Personal Archive
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          {/* Placeholder for theme toggle & user */}
           <Button variant="ghost" size="icon" onClick={toggleTheme} className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only group-data-[collapsible=icon]:hidden">Toggle theme</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
