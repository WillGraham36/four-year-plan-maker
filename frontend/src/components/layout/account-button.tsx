import { UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';

const AccountButton = () => {
  const { user } = useUser();
  const { theme } = useTheme();

  return (
    <div className="relative inline-block h-10">
      {/* Invisible full-width UserButton that handles clicks */}
      <div className="absolute inset-0 z-10 opacity-0">
        <UserButton
          appearance={{
            elements: {
              rootBox: "h-full w-full rounded-none",
              userButtonTrigger: "h-full w-full rounded-none p-1"
            },
          }}
        />
      </div>

      {/* Visual presentation */}
      <Button
        variant={'secondary'}
        className="px-5"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden">
          <img
            src={user?.imageUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
        {user?.fullName || user?.username || 'My Account'}
      </Button>
    </div>
  )
}

export default AccountButton