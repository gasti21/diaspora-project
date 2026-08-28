import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WelcomeBanner } from "@/components/layout/WelcomeBanner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <WelcomeBanner />
        {children}
      </main>
      <Footer />
    </div>
  );
}
