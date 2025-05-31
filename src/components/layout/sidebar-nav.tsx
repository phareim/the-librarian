'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, Cog, Library, Rss, PlusCircle } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'My Library', icon: Library, matchExact: true },
  // Add Content will be a dialog, so not a direct nav link for now
  // { href: '/add', label: 'Add Content', icon: PlusCircle },
  { href: '/settings', label: 'Settings', icon: Cog },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
                tooltip={{ children: item.label, side: "right", align: "center", className: "font-body" }}
              >
                <a>
                  <item.icon className="h-5 w-5" />
                  <span className="font-body">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
