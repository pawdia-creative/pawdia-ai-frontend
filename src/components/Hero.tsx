import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useEffect, useState } from "react";
import fallbackStatic from "@/assets/hero-pets-compressed.jpg";

// Type for dynamic import modules
type DynamicImportModule = { default: string };

export const Hero = () => {
  const navigate = (useNavigate as any)() as (to: string) => void;
  const { user, isAuthenticated } = useAuth();
  
  // Prefetch commonly used routes to reduce first-click latency
  const preloadCreate = () => {
    // preload ArtCreation page chunk
    import('@/pages/ArtCreation').catch(() => {});
  };
  const preloadExamples = () => {
    import('@/pages/Examples').catch(() => {});
  };
  
  // Lazy load hero background image with responsive srcset during idle time.
  const [bgImageData, setBgImageData] = useState<{
    src: string;
    srcSet: string;
  } | null>(null);

  useEffect(() => {
    let fallbackMod: DynamicImportModule | string | null = null;

    const doLoadHero = async () => {
      try {
        // Import all responsive images
        const [mobileMod, smMod, mdMod, lgMod, xlMod, fallback] = await Promise.all([
          import('@/assets/hero-pets-mobile.webp'),
          import('@/assets/hero-pets-sm.webp'),
          import('@/assets/hero-pets-md.webp'),
          import('@/assets/hero-pets-lg.webp'),
          import('@/assets/hero-pets-xl.webp'),
          import('@/assets/hero-pets-compressed.jpg')
        ]);
        fallbackMod = fallback;

        // Build srcset for responsive loading
        const srcSet = [
          `${(mobileMod as DynamicImportModule).default} 640w`,
          `${(smMod as DynamicImportModule).default} 768w`,
          `${(mdMod as DynamicImportModule).default} 1024w`,
          `${(lgMod as DynamicImportModule).default} 1280w`,
          `${(xlMod as DynamicImportModule).default} 1920w`
        ].join(', ');

        // Choose appropriate src based on current screen size
        const screenWidth = window.innerWidth;
        let src: string;

        if (screenWidth <= 640) {
          src = (mobileMod as DynamicImportModule).default;
        } else if (screenWidth <= 768) {
          src = (smMod as DynamicImportModule).default;
        } else if (screenWidth <= 1024) {
          src = (mdMod as DynamicImportModule).default;
        } else if (screenWidth <= 1280) {
          src = (lgMod as DynamicImportModule).default;
        } else {
          src = (xlMod as DynamicImportModule).default;
        }

        // Preload the selected image for LCP
        try {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          link.setAttribute('imagesrcset', srcSet);
          link.setAttribute('imagesizes', '(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1920px');
          document.head.appendChild(link);
        } catch (e) {
          // ignore
        }

        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        img.onload = () => setBgImageData({ src, srcSet });

        } catch (e) {
        // fallback to compressed jpg
        try {
          const fallbackUrl =
            fallbackMod && typeof (fallbackMod as any).default === 'string'
              ? (fallbackMod as DynamicImportModule).default
              : (fallbackMod as string) || '';
          const img = new Image();
          img.decoding = 'async';
          img.src = fallbackUrl;
          img.onload = () => setBgImageData({ src: fallbackUrl, srcSet: fallbackUrl });
        } catch (fallbackError) {
          // ignore
        }
      }
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => void }).requestIdleCallback(() => {
        doLoadHero().catch(() => {});
      }, { timeout: 1500 });
    } else {
      const id = setTimeout(() => {
        doLoadHero().catch(() => {});
      }, 1500);
      return () => clearTimeout(id);
    }
    // Fallback: if lazy loading failed for any reason, ensure we show a compressed background after a short delay
    const fallbackId = setTimeout(() => {
      if (!bgImageData) {
        setBgImageData({ src: fallbackStatic, srcSet: fallbackStatic });
      }
    }, 2500);
    return () => {
      clearTimeout(fallbackId);
    };
  }, []);
  const sectionStyle = bgImageData
    ? {
        // Put the image first so it displays above the gradient layer (gradient remains visible via transparency)
        backgroundImage: `url(${bgImageData.src}), var(--gradient-hero)`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
      }
    : undefined;

  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={sectionStyle}
    >
      {/* White translucent overlay to improve text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.72)', zIndex: 5 }}
      />
      {/* Background handled via section inline style (gradient + image) */}
      
      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 py-20 text-center">
        {/* User credit display and recharge button */}
        {isAuthenticated && user && (
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-soft">
              <span className="text-yellow-500">🪙</span>
              <span className="text-sm font-medium">{user.credits || 0} Credits</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-glow"
              onClick={() => navigate('/subscription')}
            >
              +
              Recharge
            </Button>
          </div>
        )}
        
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 shadow-soft">
          <span className="text-sm font-medium text-primary">✨ AI-Powered Pet Art</span>
        </div>
        
        <h1 className="mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Transform Your Pet Into Art
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          Turn your beloved pet's photo into stunning artistic portraits with AI.
          <br />
          Choose a style, generate art, download high-quality files - all in one place.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="shadow-glow hover:shadow-elevated transition-smooth group text-lg px-8 py-6"
            onClick={() => navigate('/create')}
            onMouseEnter={preloadCreate}
          >
            Create Your Art →
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 border-2"
            onClick={() => navigate('/examples')}
            onMouseEnter={preloadExamples}
          >
            View Examples
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-sm text-muted-foreground">Happy Pet Parents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Art Styles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100+</div>
            <div className="text-sm text-muted-foreground">High-Quality Downloads</div>
          </div>
        </div>
      </div>
    </section>
  );
};
