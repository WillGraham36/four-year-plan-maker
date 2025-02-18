"use client";
import { Button } from "../ui/button";
import { ModeToggle } from "../toggle";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const Navbar = () => {
  return (
    <nav className="w-full top-0 h-20 flex items-center justify-center z-50">
      <div className="w-full lg:w-[95%] flex justify-between items-center px-4">
        <h3 className="text-2xl font-bold py-2 px-4 rounded-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">UMD 4-year planner</h3>
        <div className="gap-2 items-center flex">
          <SignedOut>
            <SignInButton>
              <Button
                variant={'secondary'}
                className="px-5"
              >
                Log In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar