import type { Metadata } from "next";
import { Outfit } from 'next/font/google'
import "./globals.css";
import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "UMD Four Year Planner",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head>
      <body
        className={`${outfit.className} antialiased`}
      >
        <Providers>
          {children}

          <Toaster 
            position="top-center"
            richColors
          />
        </Providers>
      </body>
    </html>
  );
}
