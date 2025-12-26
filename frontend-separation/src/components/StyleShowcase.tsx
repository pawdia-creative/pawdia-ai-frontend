import { Card, CardContent } from "@/components/ui/card";
import { stylePrompts } from "@/config/prompts";
import oilImage from "@/assets/style-oil.jpg";
import watercolorImage from "@/assets/style-watercolor.jpg";
import gtaImage from "@/assets/style-gta.jpg";
import inkImage from "@/assets/style-ink.jpg";
import crayonImage from "@/assets/style-crayon.jpg";
import pencilImage from "@/assets/style-pencil.jpg";

// Image mapping
const imageMap = {
  "oil-painting": oilImage,
  "watercolor": watercolorImage,
  "gta-style": gtaImage,
  "chinese-ink": inkImage,
  "crayon": crayonImage,
  "pencil-sketch": pencilImage,
} as const;

const styles = stylePrompts.map(style => ({
  ...style,
  image: imageMap[style.id as keyof typeof imageMap]
}));

export const StyleShowcase = () => {

  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4">Explore Art Styles - Pawdia AI</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Each style is carefully crafted to showcase your pet's unique personality
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {styles.map((style, index) => (
            <Card 
              key={index}
              className="overflow-hidden group cursor-pointer hover:shadow-elevated transition-smooth border-2 hover:border-primary/50"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="text-xl font-bold mb-2">{style.name}</h3>
                <p className="text-muted-foreground">{style.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground">
            6 unique art styles with AI prompts to bring your pet's personality to life!
          </p>
        </div>
      </div>
    </section>
  );
};
