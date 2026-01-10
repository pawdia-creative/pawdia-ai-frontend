import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Coins, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import heroImage from "@/assets/hero-pets.jpg";

export const Hero = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 gradient-hero" />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* User credit display and recharge button */}
        {isAuthenticated && user && (
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-soft">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{user.credits || 0} Credits</span>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-glow"
              onClick={() => navigate('/subscription')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Recharge
            </Button>
          </div>
        )}
        
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 shadow-soft">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Pet Art</span>
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
          >
            Create Your Art
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-smooth" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 border-2"
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
