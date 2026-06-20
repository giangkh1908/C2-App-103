import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import Sandbox from "@/components/landing/Sandbox";
import Roadmap from "@/components/landing/Roadmap";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-natural-bg font-sans text-natural-charcoal antialiased">
      <Navbar />
      <main>
        <Hero />
        <Benefits />
        <Sandbox />
        <Roadmap />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
