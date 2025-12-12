import { Sparkles, Palette, Coins, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Advanced AI technology transforms your pet photos into professional artistic portraits in seconds",
  },
  {
    icon: Palette,
    title: "6 Art Styles",
    description: "From oil painting and watercolor to pop art, Chinese ink painting, crayon, and pencil sketch",
  },
  {
    icon: Coins,
    title: "Purchase Credits",
    description: "Use credits to generate AI art",
  },
  {
    icon: Zap,
    title: "Fast Generation",
    description: "Quick AI processing with instant results - get your artwork in minutes, not days",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4">Why Choose Pawdia AI?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional AI technology meets premium print-on-demand quality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-smooth hover:shadow-glow group"
            >
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 group-hover:scale-110 transition-bounce">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
