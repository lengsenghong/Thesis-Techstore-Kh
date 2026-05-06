// layout.tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";
import FloatingMascot from "@/components/FloatingMascot";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingMascot />  {/* 👈 sits just above the ChatBot FAB */}
      <ChatBot />
    </div>
  );
}