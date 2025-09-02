import { ThemeProvider } from "@/components/context/theme-provider";
import Navbar from "@/components/layout/navbar";
import { useTheme } from "next-themes";

export default function StaticLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Navbar />
      {children}
    </ThemeProvider>
  )
}