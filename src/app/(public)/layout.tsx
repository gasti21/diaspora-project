import { Navbar } from "@/components/layout/Navbar";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeRefresher scope="public" />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
