import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { SEO_CONFIG } from "@/config/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Sparkles } from "lucide-react";

const Examples = () => {
  const seo = SEO_CONFIG['/examples'];

  const styles = [
    {
      id: 'watercolor',
      name: 'Watercolor',
      description: 'Soft, flowing watercolor art perfect for elegant home decor',
      image: '/assets/style-watercolor.jpg',
      link: '/watercolor-pet-portrait-ai',
    },
    {
      id: 'sketch',
      name: 'Pencil Sketch',
      description: 'Detailed pencil sketch with beautiful shading and texture',
      image: '/assets/style-pencil.jpg',
      link: '/sketch-pet-portrait-ai',
    },
    {
      id: 'oil',
      name: 'Oil Painting',
      description: 'Classic oil painting style with rich colors and depth',
      image: '/assets/style-oil-dg.jpg',
      link: '/oil-painting-pet-portrait-ai',
    },
    {
      id: 'cartoon',
      name: 'Cartoon',
      description: 'Fun, playful cartoon style perfect for kids and social media',
      image: '/assets/style-gta.jpg',
      link: '/cartoon-pet-portrait-ai',
    },
    {
      id: 'ink',
      name: 'Ink Drawing',
      description: 'Bold ink drawings with striking contrast',
      image: '/assets/style-ink.jpg',
      link: '/ai-pet-portrait-generator',
    },
    {
      id: 'crayon',
      name: 'Crayon Art',
      description: 'Colorful crayon-style art with vibrant textures',
      image: '/assets/style-crayon.jpg',
      link: '/ai-pet-portrait-generator',
    },
  ];

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                AI Pet Portrait Examples
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse stunning examples of AI-generated pet portraits in various artistic styles. 
                See how we transform pet photos into beautiful artwork.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img
                      src={style.image}
                      alt={`${style.name} pet portrait example`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={400}
                      height={400}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-lg mb-1">{style.name}</h3>
                      <p className="text-white/90 text-sm">{style.description}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <Link
                      to={style.link}
                      className="flex items-center justify-between text-primary hover:underline font-medium"
                    >
                      <span>Try {style.name} Style</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Create Your Pet Portrait?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload your pet photo and choose from 50+ artistic styles. Get a free preview 
                before downloading your high-resolution, print-ready artwork.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                Start Creating Now
              </Link>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Popular Use Cases</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="font-semibold mb-2">Pet Memorials</h3>
                  <p className="text-muted-foreground text-sm">
                    Create beautiful memorial portraits to honor your beloved pet. Perfect for 
                    framing and keeping their memory alive.
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="font-semibold mb-2">Custom Gifts</h3>
                  <p className="text-muted-foreground text-sm">
                    Surprise pet owners with personalized artwork. Perfect for birthdays, 
                    holidays, or just because.
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="font-semibold mb-2">Home Decor</h3>
                  <p className="text-muted-foreground text-sm">
                    Transform your pet photos into stunning wall art. Available in HD and 4K 
                    resolutions for large prints.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Examples;

