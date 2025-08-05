"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SideBarClickableItem, SidebarLink } from "../ui/sidebar";
import { motion } from "motion/react";
import { ArrowLeft, BookDashed, CalendarCheck2, ChartSpline, PanelLeft, Settings, User } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import AccountButton from "./account-button";
import { ThemeToggleIcon } from "../toggle";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";

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
  const { openUserProfile } = useClerk();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const handleManageAccountClick = () => {
    openUserProfile();
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
              label="Toggle Theme" 
              onClickAction={handleThemeToggle}
            >
              <ThemeToggleIcon />
            </SideBarClickableItem>
            <SidebarLink link={{ 
              label: "Account Setup", 
              href: "/account/setup", 
              icon: <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" /> }} 
            />
            <SideBarClickableItem
              label="Manage Account" 
              onClickAction={handleManageAccountClick}
            >
              <User className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
        <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium whitespace-pre text-"
        >
          Terp Planner
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