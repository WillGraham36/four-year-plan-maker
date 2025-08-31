"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SideBarClickableItem, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import { CalendarCheck2, ChartSpline, Download, LoaderCircleIcon, PanelLeft, Settings, User } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { ThemeToggleIcon } from "../ui/toggle";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import fillPDFForm from "../planner/fill-pdf";
import { getAllGenEds, getAllSemesters, getUserInfo } from "@/lib/api/planner/planner.server";
import { toast } from "sonner";
import { IconWithLightMode } from "./footer";

export const navbarLinks = [
  {
    label: "Planner",
    href: "/planner",
    icon: (
      <CalendarCheck2 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Audit",
    href: "/audit",
    icon: (
      <ChartSpline className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
];

function LayoutSidebar() {
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const { openUserProfile, user } = useClerk();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const fullName = user?.fullName;

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const handleManageAccountClick = () => {
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
    <Sidebar open={open} setOpenAction={setOpen} animate>
      <SidebarBody className="justify-between gap-10 h-screen hidden md:sticky top-0">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto max-h-max" onClick={() => setOpen((prev) => !prev)}>
          <Logo />
          <div className="mt-8 flex flex-col gap-2">
            {navbarLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
            <hr />
            <SideBarClickableItem
              label={generatingPdf ? "Generating PDF..." : "Download Grad Plan"}
              onClickAction={handleDownloadClick}
            >
              {generatingPdf ? (
               <LoaderCircleIcon
                  className="animate-spin h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200"
                  aria-hidden="true"
                /> 
              ) : (
                <Download className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              )}
            </SideBarClickableItem>
            <SidebarLink link={{ 
              label: "Account Setup", 
              href: "/account/setup", 
              icon: <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" /> }} 
            />
            <SideBarClickableItem
              label="Manage Account" 
              onClickAction={handleManageAccountClick}
            >
              <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            </SideBarClickableItem>
            <SideBarClickableItem
              label="Toggle Theme" 
              onClickAction={handleThemeToggle}
            >
              <ThemeToggleIcon />
            </SideBarClickableItem>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
export const Logo = () => {
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/"
        className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal pl-1.5"
      >
        <IconWithLightMode
          icon="/icons/logo"
          alt="Logo"
          width={24}
          height={24}
        />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium whitespace-pre text-"
        >
          TerpPlanner
        </motion.span>
      </Link>
      <Button variant="ghost" className="p-2 h-8 w-8 z-20">
        <PanelLeft size={20} />
      </Button>
    </div>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

export default LayoutSidebar;