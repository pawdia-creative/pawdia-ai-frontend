import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Wand2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "../components/ImageUpload";
import { StyleSelection } from "../components/StyleSelection";
import { ArtGeneration } from "../components/ArtGeneration";

type CreationStep = 'upload' | 'style' | 'generate';

export const ArtCreation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CreationStep>('upload');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatedArt, setGeneratedArt] = useState<string>('');

  const steps = [
    { id: 'upload' as CreationStep, title: 'Upload Photo', icon: Upload },
    { id: 'style' as CreationStep, title: 'Choose Style', icon: Wand2 },
    { id: 'generate' as CreationStep, title: 'Generate Art', icon: Wand2 },
  ];

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setCurrentStep('style');
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setCurrentStep('generate');
  };

  const handleArtGenerated = (artUrl: string) => {
    setGeneratedArt(artUrl);
    // 移除产品定制步骤，生成完成后停留在当前步骤
  };

  const handleBack = () => {
    if (currentStep === 'style') setCurrentStep('upload');
    else if (currentStep === 'generate') setCurrentStep('style');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Your Art
            </h1>
            <p className="text-muted-foreground">Transform your pet into stunning AI art</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center z-10">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-smooth ${
                    steps.findIndex(s => s.id === currentStep) >= index
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <span 
                  className={`mt-2 text-sm font-medium ${
                    steps.findIndex(s => s.id === currentStep) >= index
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
            
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted-foreground/30 -z-10">
              <div 
                className="h-full bg-primary transition-smooth"
                style={{ 
                  width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 shadow-elevated">
            <CardContent className="p-8">
              {currentStep === 'upload' && (
                <ImageUpload onImageUpload={handleImageUpload} />
              )}
              
              {currentStep === 'style' && uploadedImage && (
                <StyleSelection 
                  onStyleSelect={handleStyleSelect}
                  onBack={handleBack}
                />
              )}
              
              {currentStep === 'generate' && uploadedImage && selectedStyle && !generatedArt && (
                <ArtGeneration 
                  image={uploadedImage}
                  styleId={selectedStyle}
                  onArtGenerated={handleArtGenerated}
                  onBack={handleBack}
                />
              )}
              
              {currentStep === 'generate' && generatedArt && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Art Generated Successfully!</h3>
                  <div className="mb-6">
                    <img 
                      src={generatedArt} 
                      alt="Generated Art" 
                      className="max-w-full rounded-lg shadow-lg mx-auto"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      // 下载图片
                      const link = document.createElement('a');
                      link.href = generatedArt;
                      link.download = 'pawdia-artwork.png';
                      link.click();
                    }}
                  >
                    <Download className="w-5 h-5" />
                    Download Artwork
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};