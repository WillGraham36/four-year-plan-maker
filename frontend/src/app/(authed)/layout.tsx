import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react'

async function Authedlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { userId } = await auth();

  if(!userId) {
    return redirect('/')
  }

  return (
    <>
      {children}
    </>
  )
}

export default Authedlayout