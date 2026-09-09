import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
