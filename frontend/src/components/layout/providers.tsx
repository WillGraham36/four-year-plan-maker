import React from 'react'
import { ThemeProvider } from '../theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from './navbar';
import { TooltipProvider } from '../ui/tooltip';

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      key="four-year-planner-theme"
      storageKey="four-year-planner-theme"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider>
        <UIProviders>
          <Navbar />
          {children}
        </UIProviders>
      </ClerkProvider>
    </ThemeProvider>
  )
};

const UIProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider delayDuration={100}>
      {children}
    </TooltipProvider>
  )
}