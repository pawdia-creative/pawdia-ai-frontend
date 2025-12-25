import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { generateFAQPageSchema } from "@/components/SEO/StructuredData";
import { SEO_CONFIG, FAQ_DATA, BASE_URL } from "@/config/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Download, Check } from "lucide-react";
import { useParams } from "react-router-dom";

interface StylePageProps {
  styleId: string;
  styleName: string;
  description: string;
  features: string[];
  image: string;
  relatedStyles: Array<{ name: string; path: string; image: string }>;
}

const StylePage: React.FC<StylePageProps> = ({
  styleId,
  styleName,
  description,
  features,
  image,
  relatedStyles,
}) => {
  const path = `/${styleId}-pet-portrait-ai`;
  const seo = SEO_CONFIG[path] || {
    path,
    title: `${styleName} Pet Portrait AI | Pawdia AI`,
    description: `Create beautiful ${styleName.toLowerCase()} pet portraits with AI. Free preview available. Download high-resolution, print-ready artwork.`,
    keywords: `${styleName.toLowerCase()} pet portrait AI, ${styleName.toLowerCase()} pet art`,
    ogImage: `${BASE_URL}/logo.png`,
  };

  const faqs = FAQ_DATA[path] || FAQ_DATA['/ai-pet-portrait-generator'] || [];

  const faqSchema = faqs.length > 0 ? generateFAQPageSchema(faqs) : null;

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
      />
      {faqSchema && <StructuredData data={faqSchema} type="FAQPage" />}
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  {styleName} Pet Portrait AI
                </h1>
                <p className="text-xl text-muted-foreground mb-6">{description}</p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Now
                  </Link>
                  <Link
                    to="/examples"
                    className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                  >
                    See Examples
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src={image}
                  alt={`${styleName} pet portrait example`}
                  className="w-full rounded-lg shadow-lg"
                  loading="lazy"
                  width={600}
                  height={600}
                />
              </div>
            </div>

            {/* Features Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Why Choose {styleName} Style?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-muted-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 mb-16 text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Create Your {styleName} Pet Portrait?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload your pet photo and get a free preview. Download high-resolution, print-ready 
                artwork perfect for framing and display.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Try Free Preview
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Related Styles */}
            {relatedStyles.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Related Styles</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedStyles.map((style, index) => (
                    <Link
                      key={index}
                      to={style.path}
                      className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow group"
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <img
                          src={style.image}
                          alt={`${style.name} pet portrait`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          width={300}
                          height={300}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {style.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-card rounded-lg p-6 border border-border">
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

// Individual style page components
export const WatercolorPetPortrait = () => (
  <StylePage
    styleId="watercolor"
    styleName="Watercolor"
    description="Transform your pet into beautiful watercolor art. Our AI creates soft, flowing watercolor portraits that capture your pet's unique personality with artistic elegance."
    features={[
      'Soft, flowing watercolor effects',
      'Perfect for elegant home decor',
      'High-resolution print-ready downloads',
      'Free preview before purchase',
      'Customizable color intensity',
    ]}
    image="/assets/style-watercolor.jpg"
    relatedStyles={[
      { name: 'Sketch', path: '/sketch-pet-portrait-ai', image: '/assets/style-pencil.jpg' },
      { name: 'Oil Painting', path: '/oil-painting-pet-portrait-ai', image: '/assets/style-oil-dg.jpg' },
      { name: 'Cartoon', path: '/cartoon-pet-portrait-ai', image: '/assets/style-gta.jpg' },
      { name: 'Ink Drawing', path: '/ai-pet-portrait-generator', image: '/assets/style-ink.jpg' },
    ]}
  />
);

export const SketchPetPortrait = () => (
  <StylePage
    styleId="sketch"
    styleName="Sketch"
    description="Create stunning pencil sketch pet portraits with detailed shading and texture. Perfect for classic, timeless pet art that emphasizes your pet's features."
    features={[
      'Detailed pencil sketch techniques',
      'Beautiful shading and texture',
      'Available in black & white or colored',
      'Perfect for framing',
      'High-resolution downloads',
    ]}
    image="/assets/style-pencil.jpg"
    relatedStyles={[
      { name: 'Watercolor', path: '/watercolor-pet-portrait-ai', image: '/assets/style-watercolor.jpg' },
      { name: 'Oil Painting', path: '/oil-painting-pet-portrait-ai', image: '/assets/style-oil-dg.jpg' },
      { name: 'Cartoon', path: '/cartoon-pet-portrait-ai', image: '/assets/style-gta.jpg' },
      { name: 'Ink Drawing', path: '/ai-pet-portrait-generator', image: '/assets/style-ink.jpg' },
    ]}
  />
);

export const OilPaintingPetPortrait = () => (
  <StylePage
    styleId="oil-painting"
    styleName="Oil Painting"
    description="Transform your pet into classic oil painting art. Rich colors, texture, and depth create museum-quality portraits perfect for elegant home decor."
    features={[
      'Classic oil painting style',
      'Rich colors and texture',
      'Museum-quality artwork',
      'Perfect for large prints',
      '4K resolution available',
    ]}
    image="/assets/style-oil-dg.jpg"
    relatedStyles={[
      { name: 'Watercolor', path: '/watercolor-pet-portrait-ai', image: '/assets/style-watercolor.jpg' },
      { name: 'Sketch', path: '/sketch-pet-portrait-ai', image: '/assets/style-pencil.jpg' },
      { name: 'Cartoon', path: '/cartoon-pet-portrait-ai', image: '/assets/style-gta.jpg' },
      { name: 'Crayon Art', path: '/ai-pet-portrait-generator', image: '/assets/style-crayon.jpg' },
    ]}
  />
);

export const CartoonPetPortrait = () => (
  <StylePage
    styleId="cartoon"
    styleName="Cartoon"
    description="Create fun, playful cartoon pet portraits perfect for kids' rooms, social media, and lighthearted pet art collections."
    features={[
      'Fun, animated style',
      'Perfect for kids and social media',
      'Multiple cartoon variations',
      'Vibrant colors',
      'Instant preview',
    ]}
    image="/assets/style-gta.jpg"
    relatedStyles={[
      { name: 'Watercolor', path: '/watercolor-pet-portrait-ai', image: '/assets/style-watercolor.jpg' },
      { name: 'Sketch', path: '/sketch-pet-portrait-ai', image: '/assets/style-pencil.jpg' },
      { name: 'Oil Painting', path: '/oil-painting-pet-portrait-ai', image: '/assets/style-oil-dg.jpg' },
      { name: 'Crayon Art', path: '/ai-pet-portrait-generator', image: '/assets/style-crayon.jpg' },
    ]}
  />
);

