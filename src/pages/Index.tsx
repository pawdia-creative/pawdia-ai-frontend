import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { StyleShowcase } from "@/components/StyleShowcase";
import { HowItWorks } from "@/components/HowItWorks";
import { MemorialSection } from "@/components/MemorialSection";
import { InfluencerSection } from "@/components/InfluencerSection";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <StyleShowcase />
      <HowItWorks />
      <MemorialSection />
      <InfluencerSection />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
