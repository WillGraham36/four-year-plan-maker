import { ThemeProvider } from "@/components/context/theme-provider";
import { CurrentUserProvider } from "@/components/context/current-user-context";
import Footer from "@/components/layout/footer";
import LayoutSidebar from "@/components/layout/layout-sidebar";
import Navbar from "@/components/layout/navbar";
import { getCurrentSession } from "@/lib/api/auth/session.server";


export default async function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentSession = await getCurrentSession();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      key="four-year-planner-theme"
      storageKey="four-year-planner-theme"
      enableSystem
      disableTransitionOnChange
    >
      <CurrentUserProvider initialSession={currentSession}>
        <div className="md:flex w-full">
          <LayoutSidebar />
          <main className="flex-1 w-full">
            <Navbar />
            {children}
            <Footer />
          </main>
        </div>
      </CurrentUserProvider>
    </ThemeProvider>
  )
}
