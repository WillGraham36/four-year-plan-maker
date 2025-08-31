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
import { Download, LoaderCircleIcon, Menu, Settings, User } from "lucide-react";
import { buttonVariants } from "./button";
import { navbarLinks } from "../layout/layout-sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ThemeToggleIcon } from "./toggle";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { IconWithLightMode } from "../layout/footer";
import { getAllGenEds, getAllSemesters, getUserInfo } from "@/lib/api/planner/planner.server";
import fillPDFForm from "../planner/fill-pdf";
import { toast } from "sonner";

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const [open, setOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { setTheme, theme } = useTheme();
  const { openUserProfile, user } = useClerk();
  const fullName = user?.fullName;

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const handleManageAccountClick = () => {
    setOpen(false);
    openUserProfile();
  };
  const handleDownloadClick = async () => {
    setGeneratingPdf(true);
    try {
      const [userInfo, semesters, genEds] = await Promise.all([
        getUserInfo(),
        getAllSemesters(),
        getAllGenEds(),
      ]);
      const userData = userInfo.data;
      if(!userData) throw new Error("User data not found");
      if(!semesters) throw new Error("Semesters not found");

      const totalCredits = Object.values(semesters)
        .flat()
        .reduce((sum, course) => sum + course.credits, 0);
      const res = await fillPDFForm({ userInfo: userData, semesters, totalCredits, genEds, fullName });
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "md:hidden" })}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-screen max-w-md border-none">
        <SheetHeader className="flex flex-row items-center gap-2">
          <IconWithLightMode
            icon="/icons/logo"
            alt="Logo"
            width={24}
            height={24}
          />
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
                "flex items-center justify-start gap-2 group/sidebar cursor-pointer",
                className
              )}
              onClick={handleDownloadClick}
            >
              {generatingPdf ? (
                <>
                  <LoaderCircleIcon
                    className="animate-spin h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
                    aria-hidden="true"
                  /> 
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
                  Download Grad Plan
                </>
              )}
            </div>
            <Link href="/account/setup" 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar ",
                className
              )}
              onClick={() => setOpen(false)}
            >
              <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <p>Account Setup</p>
            </Link>
            <div 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar cursor-pointer",
                className
              )}
              onClick={handleManageAccountClick}
            >
              <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              <p>Manage Account</p>
            </div>
            <div 
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex items-center justify-start gap-2 group/sidebar cursor-pointer",
                className
              )}
              onClick={handleThemeToggle}
            >
              <ThemeToggleIcon />
              <p>Toggle Theme</p>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  );
};