import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WelcomeToast } from "@/components/layout/WelcomeToast";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <WelcomeToast />
        {children}
      </main>
      <Footer />
    </div>
  );
}
