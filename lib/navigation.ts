import {
  BarChart3,
  ClipboardCheck,
  History,
  LayoutDashboard,
  ListTodo,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { normalizePathname } from "@/lib/utils/pathname";

export interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  enabled: boolean;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const dashboardNavigation: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Portfolio",
        description: "Submissions, versions, and review queue",
        icon: LayoutDashboard,
        enabled: true,
      },
      {
        href: "/dashboard/jobs",
        label: "Job Queue",
        description: "BullMQ status & DLQ",
        icon: ListTodo,
        enabled: true,
      },
      {
        href: "/tenants",
        label: "Tenant Activity",
        description: "Uploads, emails & AI logs",
        icon: History,
        enabled: true,
      },
    ],
  },
  {
    title: "Compliance",
    items: [
      {
        href: "/checklist",
        label: "Checklist",
        description: "Review requirements",
        icon: ClipboardCheck,
        enabled: true,
      },
    ],
  },
  {
    title: "Automation",
    items: [
      {
        href: "/templates",
        label: "Email Templates",
        description: "Tenant notifications",
        icon: Mail,
        enabled: true,
      },
      {
        href: "/metrics",
        label: "Metrics",
        description: "Portfolio & email engagement",
        icon: BarChart3,
        enabled: true,
      },
    ],
  },
];

export const PRODUCT_NAME = "COI Platform";

export function getActiveNavContext(pathname: string): {
  section: NavSection | null;
  item: NavItem | null;
} {
  const path = normalizePathname(pathname);

  for (const section of dashboardNavigation) {
    const items = section.items
      .filter((item) => item.enabled)
      .sort((a, b) => b.href.length - a.href.length);

    const item = items.find(
      (entry) => path === entry.href || path.startsWith(`${entry.href}/`)
    );

    if (item) {
      return { section, item };
    }
  }

  return { section: null, item: null };
}

/** Sub-page label when pathname goes deeper than the nav item href. */
export function getSubPageLabel(
  pathname: string,
  parentHref?: string | null
): string | null {
  const path = normalizePathname(pathname);

  if (path.startsWith("/dashboard/compare")) {
    return "Compare versions";
  }

  if (parentHref === "/dashboard") {
    const prefix = "/dashboard/";
    if (path.startsWith(prefix)) {
      const segment = path.slice(prefix.length);
      if (
        segment &&
        !segment.includes("/") &&
        segment !== "jobs" &&
        segment !== "compare"
      ) {
        return "Submission review";
      }
    }
  }

  if (parentHref === "/tenants") {
    const prefix = "/tenants/";
    if (path.startsWith(prefix)) {
      const segment = path.slice(prefix.length);
      if (segment && !segment.includes("/")) {
        return "Tenant profile";
      }
    }
  }

  return null;
}

export function getInitials(email: string): string {
  const localPart = email.split("@")[0] ?? "A";
  const parts = localPart.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}
