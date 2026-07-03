import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  Mail,
  type LucideIcon,
} from "lucide-react";

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
        label: "COI Dashboard",
        description: "Uploads & submissions",
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
        enabled: false,
        badge: "Soon",
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
        enabled: false,
        badge: "Soon",
      },
      {
        href: "/metrics",
        label: "Metrics",
        description: "Portfolio insights",
        icon: BarChart3,
        enabled: false,
        badge: "Soon",
      },
    ],
  },
];

export function getInitials(email: string): string {
  const localPart = email.split("@")[0] ?? "A";
  const parts = localPart.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}
