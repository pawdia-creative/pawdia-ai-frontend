import React, { useState, useRef } from "react";
import { Heart, Star, MoveHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const MemorialSection = () => {
  const navigate = useNavigate();
  const [sliderPosition, setSliderPosition] = useState(50); // Default in the middle position
  const containerRef = useRef<HTMLDivElement>(null);

  // Example image data
  const comparisonData = {
    original: "Original",
    aiGenerated: "AI Generated",
    description: "Slide to compare original and AI-generated images"
  };

  // Slider comparison interaction function (consistent with ArtGeneration component)
  const handleComparisonMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleComparisonTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-accent fill-accent" />
              <span className="text-sm font-medium text-accent uppercase tracking-wide">Forever Remembered</span>
            </div>
            <h2 className="mb-4">Pet Memorial Portraits</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Honor your beloved companion with a timeless artistic tribute that celebrates their unique spirit
            </p>
          </div>

          <Card className="border-2 border-accent/20 shadow-elevated">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">A Lasting Tribute</h3>
                  <p className="text-muted-foreground mb-6">
                    Create a beautiful memorial that captures the joy and love your pet brought into your life. 
                    Our high-resolution digital portraits provide a meaningful way to keep their memory alive.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">High-resolution digital downloads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Elegant artistic styles perfect for memorials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Thoughtful gift for those grieving a pet</span>
                    </li>
                  </ul>
                  <Button 
                    size="lg" 
                    className="shadow-glow"
                    onClick={() => navigate('/create')}
                  >
                    Create Memorial Portrait
                  </Button>
                </div>
                <div className="relative">
                  {/* Image Comparison Container - Consistent with ArtGeneration component */}
                  <div className="space-y-4">
                    {/* Image Comparison Title - Moved above the image */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <MoveHorizontal className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Image Comparison</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Slide to compare original and AI-generated images</p>
                      </div>
                    </div>

                    {/* Comparison Container - Overlay clipping effect */}
                    <div
                      ref={containerRef}
                      className="relative aspect-[3/4] w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden cursor-col-resize"
                      onMouseDown={handleComparisonMove}
                      onMouseMove={(e) => e.buttons === 1 && handleComparisonMove(e)}
                      onTouchStart={handleComparisonTouch}
                      onTouchMove={handleComparisonTouch}
                    >
                      {/* AI Generated Image (Background) */}
                      <div className="absolute inset-0">
                        <img
                          src="/examples/memorial/ai-cat-sketch.jpg"
                          alt="AI generated sketch portrait"
                          className="w-full h-full object-cover"
                        />
                      </div>
                        
                      {/* Original Image (Clipped overlay) */}
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img
                          src="/examples/memorial/original-cat.jpg"
                          alt="Original cat photo"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Slider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg cursor-col-resize"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 -left-2 w-5 h-5 bg-blue-600 rounded-full shadow-lg transform -translate-y-1/2"></div>
                      </div>

                      {/* Labels */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                        {comparisonData.original}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                        {comparisonData.aiGenerated}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
