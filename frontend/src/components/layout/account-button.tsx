import { useClerk, UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';

const AccountButton = () => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  const handleSetupClick = () => {
    router.push('/account/setup');
  };

  const handleManageAccountClick = () => {
    openUserProfile();
  };

  const handleSignOut = () => {
    router.push('/'); // Redirect to home page after sign out
    toast.success('You have successfully signed out');
    signOut();
  };

 return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* <Button
          variant={'outline'}
          className="p-0 lg:py-2 lg:px-5 max-lg:!bg-background hover:bg-accent"
        > */}
          <div className="h-9 w-9 rounded-full overflow-hidden cursor-pointer">
            <Image
              src={user?.imageUrl || "/default-user.svg"}
              width={32}
              height={32}
              alt="Profile Picture"
              className="h-full w-full object-cover"
            />
          </div>
          {/* <p className='hidden lg:block'>
            {user?.fullName || user?.username || 'My Account'}
          </p> */}
        {/* </Button> */}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        {/* User info header */}
        <div className="flex items-center gap-3 p-3 border-b mb-2">
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <Image
              src={user?.imageUrl || "/default-user.svg"}
              width={40}
              height={40}
              alt="Profile Picture"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.fullName || user?.username || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || ''}
            </p>
          </div>
        </div>

        {/* Setup button */}
        <DropdownMenuItem onClick={handleSetupClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Account Setup</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Manage account */}
        <DropdownMenuItem onClick={handleManageAccountClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage Account</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountButton