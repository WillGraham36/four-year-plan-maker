import { ThemeProvider } from "@/components/context/theme-provider";
import Footer from "@/components/layout/footer";
import LayoutSidebar from "@/components/layout/layout-sidebar";
import Navbar from "@/components/layout/navbar";


export default function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      key="four-year-planner-theme"
      storageKey="four-year-planner-theme"
      enableSystem
      disableTransitionOnChange
    >
      <div className="md:flex w-full">
        <LayoutSidebar />
        <main className="flex-1 w-full">
          <Navbar />
          {children}
          <Footer />
        </main>
      </div>
    </ThemeProvider>
  )
}