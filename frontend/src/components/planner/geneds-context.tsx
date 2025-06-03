'use client';
import { getAllGenEds } from "@/lib/api/planner/planner.server";
import { GenEdList } from "@/lib/utils/schemas";
import { createContext, useContext, useState } from "react";

interface GenEdsContextProps {
  triggerGenEdsUpdate: () => void;
  genEds: GenEdList;
}

const GenEdsContext = createContext<GenEdsContextProps | undefined>(undefined);

export const GenEdsProvider = ({ children, initialGenEds }: { children: React.ReactNode, initialGenEds: GenEdList }) => {
  const [genEds, setGenEds] = useState<GenEdList>(initialGenEds || []);

  const triggerGenEdsUpdate = async () => {
    const genEds = await getAllGenEds();
    setGenEds(genEds);
  };

  return (
    <GenEdsContext.Provider value={{ triggerGenEdsUpdate, genEds }}>
      {children}
    </GenEdsContext.Provider>
  );
}

export const useGenEds = () => {
  const context = useContext(GenEdsContext);
  if (context === undefined) {
    throw new Error("useGenEds must be used within a GenEdsProvider");
  }
  return context;
}