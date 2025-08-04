"use client";
import { Button } from "../ui/button";
import { ModeToggle } from "../toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import AccountButton from "./account-button";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathName = usePathname();
  let headerTitle;
  switch (pathName) {
    case "/planner":
      headerTitle = "Planner";
      break;
    case "/audit":
      headerTitle = "Audit";
      break;
    default:
      headerTitle = "4 Year Planner";
  }

  return (
    <nav className="w-full h-15 flex items-center justify-between px-4 border-b shadow-xs">
      <h3 className="text-xl font-bold">{headerTitle}</h3>
      <div className="gap-2 items-center flex">
        <SignedOut>
          <div className="flex gap-4">
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/account/setup"
            >
              <Button className="px-5">
                Sign Up
              </Button>
            </SignUpButton>

            <SignInButton
              mode="modal"
              forceRedirectUrl="/planner"
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
    </nav>
  );
};

export default Navbar