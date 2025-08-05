'use client';
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, Settings, User } from "lucide-react";
import { buttonVariants } from "./button";
import { navbarLinks } from "../layout/layout-sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggleIcon } from "../toggle";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const { openUserProfile } = useClerk();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const handleManageAccountClick = () => {
    setOpen(false);
    openUserProfile();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "md:hidden" })}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-screen max-w-md border-none">
        <SheetHeader>
          <SheetTitle>Terp Planner</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-2">
            {navbarLinks.map((link, idx) => (
              <Link href={link.href} key={idx} 
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "flex items-center justify-start gap-2 group/sidebar ",
                  className
                )}
                onClick={() => setOpen(false)}
              >
                {link.icon}
                <p>{link.label}</p>
              </Link>
            ))}
            <hr />
            <div 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar ",
                className
              )}
              onClick={handleThemeToggle}
            >
              <ThemeToggleIcon />
              <p>Toggle Theme</p>
            </div>
            <Link href="/account/setup" 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar ",
                className
              )}
              onClick={() => setOpen(false)}
            >
              <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <p>Account Setup</p>
            </Link>
            <div 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar ",
                className
              )}
              onClick={handleManageAccountClick}
            >
              <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <p>Manage Account</p>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  );
};