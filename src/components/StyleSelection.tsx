import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
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

interface StyleSelectionProps {
  onStyleSelect: (styleId: string) => void;
  onBack: () => void;
}

export const StyleSelection = ({ onStyleSelect, onBack }: StyleSelectionProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      onStyleSelect(selectedStyle);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold">Choose Art Style</h2>
          <p className="text-muted-foreground">Select a style for your AI art generation</p>
        </div>
        
        <div className="w-24"></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stylePrompts.map((style) => (
          <Card
            key={style.id}
            className={`
              cursor-pointer transition-smooth border-2 hover:shadow-elevated
              ${selectedStyle === style.id 
                ? 'border-primary shadow-glow' 
                : 'border-muted-foreground/30'
              }
            `}
            onClick={() => handleStyleSelect(style.id)}
          >
            <CardContent className="p-6">
              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-lg mb-4 group">
                  <img
                    src={imageMap[style.id as keyof typeof imageMap]}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                </div>
                
                {selectedStyle === style.id && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{style.name}</h3>
                <p className="text-muted-foreground text-sm">{style.description}</p>
                
                <div className="mt-4 pt-4 border-t border-muted-foreground/20">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Steps:</span>
                      <span>{style.parameters?.steps || 25}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CFG Scale:</span>
                      <span>{style.parameters?.cfgScale || 7.0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        {selectedStyle ? (
          <div>
            <p className="text-green-600 font-medium mb-4">
              ✓ {stylePrompts.find(s => s.id === selectedStyle)?.name} style selected!
            </p>
            <Button size="lg" onClick={handleContinue} className="shadow-glow">
              Generate AI Art
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">Please select an art style to continue</p>
        )}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <p className="mb-2">🎨 Each style uses specialized AI parameters:</p>
        <ul className="space-y-1 text-left max-w-md mx-auto">
          <li>• Steps: Number of AI processing iterations</li>
          <li>• CFG Scale: Creative freedom vs. prompt adherence</li>
          <li>• Sampler: AI algorithm for style-specific results</li>
        </ul>
      </div>
    </div>
  );
};