import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToastProvider } from "@/components/providers/app-toast-provider";
import { BoneyardProvider } from "@/components/providers/boneyard-provider";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "COI Compliance Platform",
  description:
    "Automate Certificate of Insurance intake, review, and compliance tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-mono antialiased" suppressHydrationWarning>
        <AppToastProvider>
          <BoneyardProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </BoneyardProvider>
        </AppToastProvider>
      </body>
    </html>
  );
}
