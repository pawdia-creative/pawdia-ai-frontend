import React from 'react';
import { MetaTags } from "@/components/SEO/MetaTags";
import { SEO_CONFIG } from "@/config/seo";
import { Footer } from "@/components/Footer";

const BlogComingSoon: React.FC = () => {
  const seo = SEO_CONFIG['/blog'] || { title: 'Blog', description: 'Blog coming soon', keywords: '', ogImage: '' };

  return (
    <>
      <MetaTags title={seo.title} description={seo.description} keywords={seo.keywords ?? ''} ogImage={seo.ogImage ?? ''} />
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center bg-card rounded-lg p-12 border border-border shadow-md">
          <h1 className="text-4xl font-bold mb-4">Blog — Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-6">
            We're preparing helpful articles and guides about Pawdia AI. Check back soon for updates.
          </p>
          <p className="text-sm text-muted-foreground">
            In the meantime, explore our examples, styles, and create your first pet portrait.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogComingSoon;


