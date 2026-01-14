import { MetaTags } from "@/components/SEO/MetaTags";
import { SEO_CONFIG } from "@/config/seo";
import { Footer } from "@/components/Footer";
// Use plain anchors and simple glyphs to avoid router/icon type conflicts
import { examplesStyles } from "@/config/examplesData";
import ImageComparison from "@/components/ImageComparison";

const Examples = () => {
  const seo = SEO_CONFIG['/examples'];

  const styles = examplesStyles;

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords ?? ''}
        ogImage={seo.ogImage ?? ''}
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
                    {/* Image comparison slider: use a sample original image */}
                    <ImageComparison
                      original={style.original ?? '/examples/memorial/original-cat.jpg'}
                      generated={style.generated}
                      className="w-full h-full"
                      minHeight={200}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                      <h3 className="text-white font-semibold text-lg mb-1">{style.name}</h3>
                      <p className="text-white/90 text-sm">{style.description}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <a
                      href={style.link}
                      className="flex items-center justify-between text-primary hover:underline font-medium"
                    >
                      <span>Try {style.name} Style</span>
                      <span aria-hidden className="ml-2">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center">
              <span aria-hidden className="w-12 h-12 text-primary mx-auto mb-4 text-3xl">✨</span>
              <h2 className="text-2xl font-bold mb-4">Ready to Create Your Pet Portrait?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload your pet photo and choose from 50+ artistic styles. Get a free preview 
                before downloading your high-resolution, print-ready artwork.
              </p>
              <a
                href="/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <span aria-hidden className="inline-block w-5 text-center">⬇️</span>
                Start Creating Now
              </a>
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

