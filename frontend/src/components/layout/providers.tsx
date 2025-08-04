import React from 'react'
import { ThemeProvider } from '../theme-provider';
import { TooltipProvider } from '../ui/tooltip';
import CustomClerkProvider from './clerk-provider';

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
      <CustomClerkProvider>
        <UIProviders>
          {children}
        </UIProviders>
      </CustomClerkProvider>
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