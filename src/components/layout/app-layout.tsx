
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
import { LogIn, LogOut, Moon, Sun, UserCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { useTheme } from "next-themes"; // next-themes can be added later if needed

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  
  const toggleTheme = () => {
    console.log("Toggle theme clicked");
    // const newTheme = theme === "light" ? "dark" : "light";
    // setTheme(newTheme);
  };

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
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
           <div className="flex flex-col gap-2 items-stretch group-data-[collapsible=icon]:items-center">
            {loading ? (
              <Button variant="ghost" disabled className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Loading...</span>
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle2 size={18}/>}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-body text-sm group-data-[collapsible=icon]:hidden truncate max-w-[100px]">{user.displayName || 'User Profile'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={signInWithGoogle} className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2">
                <LogIn className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Login with Google</span>
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:p-2.5 h-auto p-2.5 self-center">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
