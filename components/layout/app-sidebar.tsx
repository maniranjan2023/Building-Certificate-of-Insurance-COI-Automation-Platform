"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { dashboardNavigation } from "@/lib/navigation";
import { NavUser, SidebarBrand } from "@/components/layout/nav-user";

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-2">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent className="gap-1 px-1">
        {dashboardNavigation.map((section) => (
          <SidebarGroup key={section.title} className="p-1">
            <SidebarGroupLabel className="h-6 px-2 text-[10px] uppercase tracking-wider">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.enabled &&
                    (pathname === item.href ||
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.enabled ? (
                        <SidebarMenuButton
                          asChild
                          size="sm"
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <Icon className="size-3.5" />
                            <span className="text-xs">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          disabled
                          size="sm"
                          tooltip={item.label}
                        >
                          <Icon className="size-3.5" />
                          <span className="text-xs">{item.label}</span>
                        </SidebarMenuButton>
                      )}
                      {item.badge ? (
                        <SidebarMenuBadge className="text-[10px]">
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <NavUser userEmail={userEmail} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
