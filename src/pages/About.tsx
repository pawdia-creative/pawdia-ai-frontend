import { MetaTags } from "@/components/SEO/MetaTags";
import { StructuredData } from "@/components/SEO/StructuredData";
import { generateOrganizationSchema } from "@/components/SEO/StructuredData";
import { SEO_CONFIG, BASE_URL } from "@/config/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Users, Award } from "lucide-react";

const About = () => {
  const seo = SEO_CONFIG['/about'];

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

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        ogImage={seo.ogImage}
      />
      <StructuredData data={orgSchema} type="Organization" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              About Pawdia AI
            </h1>
            
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-xl text-muted-foreground mb-6">
                At Pawdia AI, we believe every pet deserves to be immortalized in beautiful art. 
                Our mission is to help pet lovers around the world transform their beloved pet photos 
                into stunning artistic portraits using the power of artificial intelligence.
              </p>

              <div className="grid md:grid-cols-2 gap-8 my-12">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Made with Love</h3>
                    <p className="text-muted-foreground">
                      Every portrait is crafted with care, ensuring your pet's unique personality 
                      shines through in every artistic style.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Art</h3>
                    <p className="text-muted-foreground">
                      Our advanced AI technology creates museum-quality artwork that captures 
                      every detail of your pet's features and expressions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">For Pet Lovers</h3>
                    <p className="text-muted-foreground">
                      We understand the special bond between pets and their families. Our service 
                      helps you celebrate and memorialize that bond through beautiful art.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                    <p className="text-muted-foreground">
                      All our portraits are print-ready in high resolution, perfect for framing, 
                      gifting, or creating lasting memories.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Pawdia AI was born from a simple idea: what if we could use artificial intelligence 
                to create beautiful, personalized art from pet photos? After months of development 
                and testing, we launched our platform to help pet lovers worldwide create stunning 
                portraits of their furry, feathered, and scaled friends.
              </p>
              <p className="text-muted-foreground mb-4">
                Today, we've helped thousands of pet owners create beautiful art, from memorial 
                portraits honoring beloved pets to fun cartoon versions for kids' rooms. Our 
                commitment to quality, customer service, and innovation drives everything we do.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6">Get Started</h2>
              <p className="text-muted-foreground mb-6">
                Ready to create your pet's portrait? Start with our free preview - no credit card required. 
                Choose from 50+ artistic styles and download print-ready high-resolution artwork.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/create"
                  className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Create Your Pet Portrait
                </Link>
                <Link
                  to="/examples"
                  className="border-2 border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                >
                  View Examples
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default About;

