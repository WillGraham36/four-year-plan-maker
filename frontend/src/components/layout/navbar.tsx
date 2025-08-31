"use client";
import { Button } from "../ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import AccountButton from "./account-button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MobileSidebar } from "../ui/mobile-sidebar";

const Navbar = () => {
  const pathName = usePathname();

  let headerTitle = "";
  let headerSubtitle: string | undefined;
  switch (pathName) {
    case "/planner":
      headerTitle = "Planner";
      headerSubtitle = "Plan your courses effectively and see if you can graduate on time";
      break;
    case "/audit":
      headerTitle = "Audit";
      headerSubtitle = "See if you meet the detailed degree requirements";
      break;
    case "/account/setup":
      headerTitle = "Account Setup";
      headerSubtitle = "Upload your transcript and configure your account";
      break;
    default:
      headerTitle = "Terp Planner";
      headerSubtitle = undefined;
      break;
  }

  return (
    <nav className="w-full h-15 flex items-center justify-between px-4 border-b shadow-xs">
      <span className="flex gap-2 md:gap-5 items-center">
        <SignedIn>
          <MobileSidebar />
        </SignedIn>
        <Link href={pathName}>
          <h3 className="text-xl font-bold">{headerTitle}</h3>
        </Link>
        {headerSubtitle && (
          <p className="text-sm text-muted-foreground hidden md:block">{headerSubtitle}</p>
        )}
      </span>
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
      </div>
    </nav>
  );
};

export default Navbar