import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-elevated">
          <div className="absolute inset-0 gradient-secondary opacity-90" />
          
          <div className="relative z-10 text-center py-20 px-4">
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            
            <h2 className="mb-6 text-primary-foreground">
              Ready to Create Your Pet's Masterpiece?
            </h2>
            
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Join 10,000+ happy pet parents who've transformed their furry friends into art
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 shadow-glow hover:shadow-elevated transition-smooth group"
                onClick={() => navigate('/create')}
              >
                Start Creating Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
            </div>
            
            <p className="text-sm text-primary-foreground/70 mt-6">
              Free portrait generation with your first order ✨
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
