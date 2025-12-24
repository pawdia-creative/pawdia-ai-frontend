import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { StyleShowcase } from "@/components/StyleShowcase";
import { HowItWorks } from "@/components/HowItWorks";
import { MemorialSection } from "@/components/MemorialSection";
import { InfluencerSection } from "@/components/InfluencerSection";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { generateWebApplicationSchema, generateOrganizationSchema, generateFAQPageSchema } from "@/components/SEO/StructuredData";
import { SEO_CONFIG, BASE_URL } from "@/config/seo";

const Index = () => {
  const seo = SEO_CONFIG['/'];

  const webAppSchema = generateWebApplicationSchema({
    name: 'Pawdia AI - AI Pet Portrait Generator',
    description: 'Transform your pet photos into stunning AI art portraits with free preview and print-ready downloads.',
    url: BASE_URL,
    applicationCategory: 'GraphicsApplication',
    operatingSystem: 'Web',
    offers: [
      { name: 'HD Download', price: '1.99', priceCurrency: 'USD', availability: 'InStock' },
      { name: '4K Download', price: '3.49', priceCurrency: 'USD', availability: 'InStock' },
      { name: 'Basic Subscription', price: '9.99', priceCurrency: 'USD', availability: 'InStock' },
      { name: 'Premium Subscription', price: '14.99', priceCurrency: 'USD', availability: 'InStock' },
    ],
  });

  const orgSchema = generateOrganizationSchema({
    name: 'Pawdia AI',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://instagram.com/pawdia.creative',
    ],
    contactPoint: {
      contactType: 'Customer Service',
      email: 'pawdia.creative@gmail.com',
    },
  });

  const homepageFAQ = [
    {
      question: 'How does the free preview work?',
      answer: 'Upload a pet photo, pick a style, and get an instant AI preview for free. Pay only when you’re happy with the result.',
    },
    {
      question: 'Do I own the commercial rights?',
      answer: 'Yes. You own full commercial rights to the generated pet portraits for printing, merch, and social media.',
    },
    {
      question: 'What resolutions can I download?',
      answer: 'You can download HD ($1.99) and 4K ($3.49) print-ready files. Subscriptions include bundled credits for downloads.',
    },
  ];

  const faqSchema = generateFAQPageSchema(homepageFAQ);

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
      />
      <StructuredData data={webAppSchema} type="WebApplication" />
      <StructuredData data={orgSchema} type="Organization" />
      <StructuredData data={faqSchema} type="FAQHome" />
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
    </>
  );
};

export default Index;
