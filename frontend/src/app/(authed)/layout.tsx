import LayoutSidebar from "@/components/layout/layout-sidebar";
import Navbar from "@/components/layout/navbar";


export default function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="md:flex w-full">
      <LayoutSidebar />
      <main className="flex-1 w-full">
        <Navbar />
        {children}
      </main>
    </div>
  )
}