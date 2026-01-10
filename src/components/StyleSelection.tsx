import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, AlertTriangle, Lock, Crown } from "lucide-react";
import { stylePrompts } from "@/config/prompts";
import oilImage from "@/assets/style-oil.jpg";
import watercolorImage from "@/assets/style-watercolor.jpg";
import gtaImage from "@/assets/style-gta.jpg";
import inkImage from "@/assets/style-ink.jpg";
import crayonImage from "@/assets/style-crayon.jpg";
import pencilImage from "@/assets/style-pencil.jpg";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Subscription-based style filtering
  const plan = (user?.subscription?.plan as 'free' | 'basic' | 'premium') || 'free';
  const freeStyles = ['watercolor', 'crayon', 'pencil-sketch'];
  const allowedStyles = plan === 'free' ? freeStyles : stylePrompts.map(s => s.id);
  
  // Show all styles, but mark restricted ones for free users
  const allStyles = stylePrompts;

  // Clear selection if current selection is not allowed for current plan
  useEffect(() => {
    if (selectedStyle && !allowedStyles.includes(selectedStyle)) {
      setSelectedStyle('');
    }
  }, [plan, user?.subscription?.plan, allowedStyles, selectedStyle]);

  const handleStyleSelect = (styleId: string) => {
    // If style is not allowed for current plan, show upgrade prompt
    if (!allowedStyles.includes(styleId)) {
      // Show toast or navigate to subscription page
      navigate('/subscription');
      return;
    }
    setSelectedStyle(styleId);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      // Double-check that selected style is allowed for current plan
      if (!allowedStyles.includes(selectedStyle)) {
        setSelectedStyle('');
        return;
      }
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
          <p className="text-muted-foreground">
            {plan === 'free'
              ? 'Free plan: 3 styles available. Upgrade to unlock all 6 styles!'
              : 'Select a style for your AI art generation'}
          </p>
        </div>
        
        <div className="w-24"></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {allStyles.map((style) => {
          const isAllowed = allowedStyles.includes(style.id);
          const isRestricted = plan === 'free' && !isAllowed;
          
          return (
            <Card
              key={style.id}
              className={`
                transition-smooth border-2 relative
                ${isRestricted 
                  ? 'border-muted-foreground/20 opacity-75 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-elevated border-muted-foreground/30'
                }
                ${selectedStyle === style.id && isAllowed
                  ? 'border-primary shadow-glow' 
                  : ''
                }
              `}
              onClick={() => handleStyleSelect(style.id)}
            >
              <CardContent className="p-6">
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-lg mb-4 group relative">
                    <img
                      src={imageMap[style.id as keyof typeof imageMap]}
                      alt={style.name}
                      className={`w-full h-full object-cover transition-smooth ${
                        isRestricted ? 'grayscale' : 'group-hover:scale-110'
                      }`}
                    />
                    {isRestricted && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Upgrade Required</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedStyle === style.id && isAllowed && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center z-10">
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  
                  {isRestricted && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="bg-amber-500 text-white flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  <h3 className={`text-xl font-bold mb-2 ${isRestricted ? 'text-muted-foreground' : ''}`}>
                    {style.name}
                  </h3>
                  <p className={`text-sm ${isRestricted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {style.description}
                  </p>
                  
                  {isRestricted && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <p className="font-medium">Upgrade to Basic or Premium to unlock this style</p>
                    </div>
                  )}
                  
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
          );
        })}
      </div>

      {/* Free plan upgrade notice */}
      {plan === 'free' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-1">Unlock All Styles</p>
              <p className="text-sm text-blue-800 mb-3">
                You're currently on the Free plan with access to 3 styles. Upgrade to <strong>Basic</strong> or <strong>Premium</strong> to unlock all 6 art styles including Oil Painting, Urban Comic, and Chinese Ink!
              </p>
              <Button 
                size="sm" 
                onClick={() => navigate('/subscription')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}

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