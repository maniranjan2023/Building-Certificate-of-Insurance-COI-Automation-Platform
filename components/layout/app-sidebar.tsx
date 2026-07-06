"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { dashboardNavigation } from "@/lib/navigation";
import { NavUser, SidebarBrand } from "@/components/layout/nav-user";
import { cn } from "@/lib/utils";

function NavSearch({ onQueryChange }: { onQueryChange: (query: string) => void }) {
  const { state } = useSidebar();

  if (state === "collapsed") {
    return null;
  }

  return (
    <div className="relative px-2 pb-1">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <SidebarInput
        placeholder="Search navigation…"
        className="h-8 bg-sidebar-accent/50 pl-8 text-sm"
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </div>
  );
}

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredNavigation = useMemo(() => {
    if (!normalizedQuery) return dashboardNavigation;

    return dashboardNavigation
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedQuery) ||
            item.description?.toLowerCase().includes(normalizedQuery) ||
            section.title.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-none">
      <SidebarHeader className="gap-2 p-2">
        <SidebarBrand />
        <NavSearch onQueryChange={setQuery} />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        {filteredNavigation.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No navigation items match your search.
          </p>
        ) : null}

        {filteredNavigation.map((section, sectionIndex) => (
          <SidebarGroup key={section.title} className="p-1">
            <SidebarGroupLabel className="h-6 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.enabled &&
                    (pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(`${item.href}/`)));

                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.enabled ? (
                        <SidebarMenuButton
                          asChild
                          size="default"
                          isActive={isActive}
                          tooltip={item.label}
                          className={cn(
                            "h-10 rounded-lg transition-colors",
                            isActive &&
                              "bg-sidebar-primary/10 text-sidebar-primary shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                          )}
                        >
                          <Link href={item.href}>
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                isActive && "text-sidebar-primary"
                              )}
                            />
                            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                              <span className="truncate text-sm font-medium">
                                {item.label}
                              </span>
                              {item.description ? (
                                <span className="truncate text-[11px] text-muted-foreground">
                                  {item.description}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          disabled
                          size="default"
                          tooltip={item.label}
                          className="h-10 rounded-lg opacity-60"
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                            <span className="truncate text-sm font-medium">
                              {item.label}
                            </span>
                            {item.description ? (
                              <span className="truncate text-[11px] text-muted-foreground">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                        </SidebarMenuButton>
                      )}
                      {item.badge ? (
                        <SidebarMenuBadge
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            item.enabled
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {sectionIndex < filteredNavigation.length - 1 ? (
              <SidebarSeparator className="my-1" />
            ) : null}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-2">
        <NavUser userEmail={userEmail} />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => void handleLogout()}
              tooltip="Sign out"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
