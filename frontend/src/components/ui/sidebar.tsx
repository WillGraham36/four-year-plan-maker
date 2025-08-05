"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./button";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpenAction: setOpenActionProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpenAction?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpenAction = setOpenActionProp !== undefined ? setOpenActionProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpenAction, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpenAction,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpenAction?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpenAction={setOpenAction} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <DesktopSidebar {...(props as React.ComponentProps<typeof motion.div> & { children?: React.ReactNode })} />
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div> & { children?: React.ReactNode }) => {
  const { open, setOpenAction, animate } = useSidebar();

  const handleSidebarClick = (e: React.MouseEvent) => {
    // Only toggle if clicking directly on the sidebar, not on links
    if (e.target === e.currentTarget) {
      setOpenAction(() => !open);
    }
  };
  return (
    <>
      <motion.aside
        className={cn(
          "h-full px-3 py-4 hidden md:flex relative md:flex-col bg-popover w-[60px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "200px" : "60px") : "60px",
        }}
        onMouseDown={handleSidebarClick}
        // onMouseLeave={() => setOpenAction(false)}
        {...props}
      >
        {children as React.ReactNode}
      </motion.aside>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const handleLinkClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the sidebar
    e.stopPropagation();
  };

  return (
    <Link
      href={link.href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex items-center justify-start gap-2 group/sidebar py-1.5 px-2 pl-2.5",
        className
      )}
      onClick={handleLinkClick}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SideBarClickableItem = ({
  className,
  label,
  children,
  onClickAction,
  ...props
}: {
  className?: string;
  label: string;
  children: React.ReactNode;
  onClickAction?: (e: React.MouseEvent) => void;
}) => {
  const { open, animate } = useSidebar();
  
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClickAction?.(e);
  };

  return (
    <div
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex items-center justify-start gap-2 group/sidebar py-1.5 px-2 pl-2.5 cursor-pointer",
        className
      )}
      onClick={handleLinkClick}
      {...props}
    >
      {children}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {label}
      </motion.span>
    </div>
  );
};