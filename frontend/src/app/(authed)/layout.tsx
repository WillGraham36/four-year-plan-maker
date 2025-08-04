import LayoutSidebar from "@/components/layout/layout-sidebar";
import Navbar from "@/components/layout/navbar";


export default function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="md:flex">
      <LayoutSidebar />
      <main>
        <Navbar />
        {children}
      </main>
    </div>
  )
}