import { UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';
import Image from 'next/image';

const AccountButton = () => {
  const { user } = useUser();

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
        className="p-0 lg:py-2 lg:px-5 max-lg:!bg-background"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden">
          <Image
            src={user?.imageUrl || "/default-user.svg"}
            width={32}
            height={32}
            alt="Profile Picture"
            className="h-full w-full object-cover"
          />
        </div>
        <p className='hidden lg:block'>
          {user?.fullName || user?.username || 'My Account'}
        </p>
      </Button>
    </div>
  )
}

export default AccountButton