"use client";
import { Button } from "../ui/button";
import { ModeToggle } from "../toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import AccountButton from "./account-button";

const Navbar = () => {
  return (
    <nav className="w-full top-0 h-16 flex items-center justify-center z-50 border-b shadow-sm">
      <div className="w-full lg:w-[95%] flex justify-between items-center px-4">
        <h3 className="text-2xl font-bold py-2 px-4 rounded-md bg-card">4 Year Planner</h3>
        <div className="gap-2 items-center flex">
          <SignedOut>
            <div className="flex gap-4">
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/account/setup" // Redirect after signup
              >
                <Button className="px-5">
                  Sign Up
                </Button>
              </SignUpButton>

              <SignInButton
                mode="modal"
                forceRedirectUrl="/planner" // Redirect after login
              >
                <Button variant="secondary" className="px-5">
                  Log In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <AccountButton />
          </SignedIn>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar