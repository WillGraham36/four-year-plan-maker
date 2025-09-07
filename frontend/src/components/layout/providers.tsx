import React from 'react'
import { ThemeProvider } from '../context/theme-provider';
import { TooltipProvider } from '../ui/tooltip';
import CustomClerkProvider from './clerk-provider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SpeedInsights />
      <Analytics />
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