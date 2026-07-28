import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hurry",
  description: "Buy and sell locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-muted/30">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-background">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
            Hurry — a take-home project.
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
