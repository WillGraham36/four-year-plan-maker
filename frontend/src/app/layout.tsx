import type { Metadata } from "next";
import { Outfit } from 'next/font/google'
import "./globals.css";
import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "TerpPlanner | UMD Course & Graduation Planning",
  description: "Plan your next four years at UMD. Explore courses, gen eds, and graduation requirements",
  keywords: ["UMD", "University of Maryland", "course planner", "gen eds", "graduation requirements", "academic planning", "four year planner", "computer science", "CS", "Academic Planner", "Terpplanner"],
  authors: [{ name: "Will Graham" }],
  metadataBase: new URL("https://terpplanner.com"),
  openGraph: {
    title: "TerpPlanner | UMD Course & Graduation Planning",
    description: "Plan your next four years at UMD. Explore courses, gen eds, and graduation requirements",
    url: "https://terpplanner.com",
    siteName: "TerpPlanner",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TerpPlanner Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TerpPlanner | UMD Course & Graduation Planning",
    description: "Plan your next four years at UMD with course tracking and graduation planning.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://terpplanner.com",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.className} antialiased`}
      >
        <Providers>
          {children}
          <Toaster 
            position="top-center"
          />
        </Providers>
      </body>
    </html>
  );
}
