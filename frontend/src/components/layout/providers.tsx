import React from 'react'
import { ThemeProvider } from '../context/theme-provider';
import { TooltipProvider } from '../ui/tooltip';
import CustomClerkProvider from './clerk-provider';
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SpeedInsights />
      <CustomClerkProvider>
        <UIProviders>
          {children}
        </UIProviders>
      </CustomClerkProvider>
    </>
  )
};

const UIProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider delayDuration={100}>
      {children}
    </TooltipProvider>
  )
}