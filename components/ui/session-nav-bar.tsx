"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, type Transition } from "framer-motion";
import {
  ChevronsUpDown,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  dashboardNavigation,
  getInitials,
  type NavItem,
} from "@/lib/navigation";
import { useNavigationPending } from "@/components/layout/navigation-pending";

const SIDEBAR_COLLAPSED_WIDTH = "3.05rem";
const SIDEBAR_EXPANDED_WIDTH = "15rem";

const sidebarVariants = {
  open: { width: SIDEBAR_EXPANDED_WIDTH },
  closed: { width: SIDEBAR_COLLAPSED_WIDTH },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const labelVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { x: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: { x: { stiffness: 100 } },
  },
};

const transitionProps: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export const SESSION_NAVBAR_WIDTH = SIDEBAR_COLLAPSED_WIDTH;

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  isCollapsed,
  isNavigating,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  isNavigating: boolean;
  onNavigate: (href: string) => void;
}) {
  const Icon = item.icon;
  const active = item.enabled && isActivePath(pathname, item.href);

  const className = cn(
    "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
    active && "bg-muted text-primary",
    isNavigating && "animate-pulse opacity-80",
    !item.enabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground"
  );

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <motion.span variants={labelVariants} className="flex min-w-0 items-center">
        {!isCollapsed ? (
          <span className="ml-2 flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{item.label}</span>
            {item.badge ? (
              <Badge
                className="h-fit w-fit rounded border-none bg-primary/10 px-1.5 text-[10px] text-primary"
                variant="outline"
              >
                {item.badge}
              </Badge>
            ) : null}
          </span>
        ) : null}
      </motion.span>
    </>
  );

  if (!item.enabled) {
    return (
      <div className={className} aria-disabled title={item.description}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch={false}
      className={className}
      onClick={() => onNavigate(item.href)}
      aria-busy={isNavigating || undefined}
    >
      {content}
    </Link>
  );
}

export interface SessionNavBarProps {
  userEmail: string;
}

export function SessionNavBar({ userEmail }: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { pendingHref, setPendingHref } = useNavigationPending();
  const initials = getInitials(userEmail);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <motion.aside
      className="fixed top-0 left-0 z-40 h-full shrink-0 border-r border-border bg-background"
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      aria-label="Main navigation"
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col text-muted-foreground transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2"
                    >
                      <Avatar className="size-4 rounded-md">
                        <AvatarFallback className="rounded-md text-[10px]">
                          <ShieldCheck className="size-3" />
                        </AvatarFallback>
                      </Avatar>
                      <motion.span
                        variants={labelVariants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed ? (
                          <>
                            <span className="text-sm font-medium text-foreground">
                              COI Platform
                            </span>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        ) : null}
                      </motion.span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Compliance workspace</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/checklist">Checklist rules</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/templates">Email templates</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className="flex w-full flex-col gap-1">
                    {dashboardNavigation.map((section, index) => (
                      <div key={section.title} className="flex flex-col gap-1">
                        {!isCollapsed ? (
                          <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                            {section.title}
                          </p>
                        ) : null}
                        {section.items.map((item) => (
                          <NavLink
                            key={item.href}
                            item={item}
                            pathname={pathname}
                            isCollapsed={isCollapsed}
                            isNavigating={pendingHref === item.href}
                            onNavigate={setPendingHref}
                          />
                        ))}
                        {index < dashboardNavigation.length - 1 ? (
                          <Separator className="my-1 w-full" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col p-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <motion.span
                        variants={labelVariants}
                        className="flex w-full items-center gap-2"
                      >
                        {!isCollapsed ? (
                          <>
                            <span className="truncate text-sm font-medium text-foreground">
                              Admin
                            </span>
                            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                          </>
                        ) : null}
                      </motion.span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={5} align="start">
                    <div className="flex flex-row items-center gap-2 p-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col text-left">
                        <span className="text-sm font-medium">Admin</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {userEmail}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() => void handleLogout()}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.aside>
  );
}
