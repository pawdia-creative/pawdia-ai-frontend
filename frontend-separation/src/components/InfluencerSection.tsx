import { Camera, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Camera,
    title: "Stand Out on Social",
    description: "Unique AI art styles that grab attention and boost engagement",
  },
  {
    icon: TrendingUp,
    title: "Monetize Your Brand",
    description: "Create custom merch collections for your followers",
  },
  {
    icon: Users,
    title: "Build Your Community",
    description: "Offer exclusive artwork and products to your audience",
  },
];

export const InfluencerSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-2 mb-4">
            <Camera className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">For Pet Influencers</span>
          </div>
          <h2 className="mb-4">Take Your Pet Brand to the Next Level</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join successful pet influencers who use Pawdia AI to create stunning content and monetize their audience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="border-2 hover:border-secondary/50 transition-smooth hover:shadow-glow group"
            >
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-secondary mb-4 group-hover:scale-110 transition-bounce">
                  <benefit.icon className="w-8 h-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Special pricing available for content creators
          </p>
          <a 
            href="#" 
            className="text-secondary hover:text-secondary/80 font-semibold transition-smooth underline"
          >
            Learn about Creator Program →
          </a>
        </div>
      </div>
    </section>
  );
};
