import Navbar from "@/components/layout/navbar";
import { useTheme } from "next-themes";

export default function StaticLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}