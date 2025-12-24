import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { generateBlogPostingSchema } from "@/components/SEO/StructuredData";
import { SEO_CONFIG, BASE_URL } from "@/config/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";

const Blog = () => {
  const seo = SEO_CONFIG['/blog'];

  // Sample blog posts - in production, these would come from a CMS or API
  const blogPosts = [
    {
      id: 1,
      title: 'How to Create the Perfect Pet Memorial Portrait',
      description: 'Learn how to choose the right photo and style for a meaningful pet memorial portrait that honors your beloved companion.',
      date: '2025-01-15',
      image: `${BASE_URL}/logo.png`,
      slug: 'how-to-create-perfect-pet-memorial-portrait',
    },
    {
      id: 2,
      title: 'Top 10 Pet Portrait Styles for 2025',
      description: 'Discover the most popular AI pet portrait styles this year, from watercolor to cartoon, and find the perfect style for your pet.',
      date: '2025-01-10',
      image: `${BASE_URL}/logo.png`,
      slug: 'top-10-pet-portrait-styles-2025',
    },
    {
      id: 3,
      title: 'Print-Ready Pet Portraits: A Complete Guide',
      description: 'Everything you need to know about downloading and printing your AI pet portraits in high resolution for framing and display.',
      date: '2025-01-05',
      image: `${BASE_URL}/logo.png`,
      slug: 'print-ready-pet-portraits-guide',
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
              <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Blog
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tips, stories, and inspiration for creating beautiful AI pet portraits
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogPosts.map((post) => {
                const blogSchema = generateBlogPostingSchema({
                  headline: post.title,
                  description: post.description,
                  image: post.image,
                  datePublished: post.date,
                  dateModified: post.date,
                  author: {
                    name: 'Pawdia AI Team',
                  },
                  publisher: {
                    name: 'Pawdia AI',
                    logo: `${BASE_URL}/logo.png`,
                  },
                });

                return (
                  <article key={post.id} className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
                    <StructuredData data={blogSchema} type={`BlogPost-${post.id}`} />
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={600}
                        height={400}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{post.description}</p>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Want to Create Your Own Pet Portrait?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Get started with our free preview. No credit card required. Choose from 50+ 
                artistic styles and download print-ready artwork.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Start Creating
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Blog;

