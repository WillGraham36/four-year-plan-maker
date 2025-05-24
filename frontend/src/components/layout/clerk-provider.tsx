'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import React from 'react'
import { dark } from '@clerk/themes'

const LightModeVariables = {
  colorBackground: 'hsl(36.0000 41.6667% 95.2941%)',
}

const DarkModeVariables = {
  colorBackground: 'hsl(12.0000 6.4935% 15.0980%)'
}


export default function CustomClerkProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: (theme === 'dark' && dark) || undefined,
        variables: {
          ...(theme === 'dark' ? DarkModeVariables : LightModeVariables),
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
}