import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-marketing",
});

export const metadata: Metadata = {
  title: "COI Platform — AI Certificate of Insurance Compliance",
  description:
    "Automate COI intake, AI validation, and tenant communication for property managers. Replace manual PDF review with a modern compliance workspace.",
  openGraph: {
    title: "COI Platform — AI Certificate of Insurance Compliance",
    description:
      "Automate COI intake, AI validation, and tenant communication for property managers.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} min-h-screen font-[family-name:var(--font-marketing)] antialiased`}
    >
      {children}
    </div>
  );
}
