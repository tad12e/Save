import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EcosystemMarquee from "@/components/EcosystemMarquee";
import ConcentricOrbit from "@/components/ConcentricOrbit";
import DualCoreIntelligence from "@/components/DualCoreIntelligence";
import SaveAnythingMarquee from "@/components/SaveAnythingMarquee";
import NativeFidelityShowcase from "@/components/NativeFidelityShowcase";
import PlatformShowcase from "@/components/PlatformShowcase";
import BidirectionalSyncMCP from "@/components/BidirectionalSyncMCP";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-surface selection:bg-secondary-fixed selection:text-secondary">
      <Header />
      <Hero />
      <EcosystemMarquee />
      <ConcentricOrbit />
      <DualCoreIntelligence />
      <SaveAnythingMarquee />
      <NativeFidelityShowcase />
      <PlatformShowcase />
      <BidirectionalSyncMCP />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
