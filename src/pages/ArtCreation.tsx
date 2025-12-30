import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as Lucide from "lucide-react";
const ArrowLeft = (Lucide as any).ArrowLeft ?? (() => null);
const Upload = (Lucide as any).Upload ?? (() => null);
const Wand = (Lucide as any).Wand ?? (() => null);
const Download = (Lucide as any).Download ?? (() => null);
const MoveHorizontal = (Lucide as any).MoveHorizontal ?? (() => null);
import { useNavigate, useLocation } from "react-router-dom";
import { ImageUpload } from "../components/ImageUpload";
import { StyleSelection } from "../components/StyleSelection";
import { ArtGeneration } from "../components/ArtGeneration";
import { Card as UiCard, CardHeader as UiCardHeader, CardTitle as UiCardTitle } from "@/components/ui/card";
import { MetaTags } from "@/components/SEO/MetaTags";
import { SEO_CONFIG } from "@/config/seo";

type CreationStep = 'upload' | 'style' | 'generate';

export const ArtCreation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<CreationStep>('upload');
  
  // Get SEO config based on current path
  const seo = SEO_CONFIG[location.pathname] || SEO_CONFIG['/create'];
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatedArt, setGeneratedArt] = useState<string>('');
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [autoRotateDeg, setAutoRotateDeg] = useState<number>(0);
  const [comparisonPosition, setComparisonPosition] = useState(50); // slider for comparison
  const [originalImageOrientation, setOriginalImageOrientation] = useState<{ isPortrait: boolean; width: number; height: number } | null>(null);

  const steps = [
    { id: 'upload' as CreationStep, title: 'Upload Photo', icon: Upload },
    { id: 'style' as CreationStep, title: 'Choose Style', icon: Wand },
    { id: 'generate' as CreationStep, title: 'Generate Art', icon: Wand },
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
    // 重置旋转状态，等待图片加载后自动检测
    setAutoRotateDeg(0);
    setRotationDeg(0);
    // 移除产品定制步骤，生成完成后停留在当前步骤
  };

  // 图像方向检测函数 - 基于原图方向，确保生成图与原图方向一致
  // 使用 useCallback 确保函数使用最新的 originalImageOrientation
  const detectAutoRotate = useCallback((img: HTMLImageElement): number => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    // 确保有有效的尺寸
    if (!width || !height || width === 0 || height === 0) {
      if (import.meta.env.DEV) console.warn('Invalid image dimensions:', { width, height });
      return 0;
    }
    
    // 如果没有原图信息，使用默认逻辑（横向转纵向）
    if (!originalImageOrientation) {
      if (import.meta.env.DEV) console.warn('Original image orientation not available, using default logic');
      if (width > height) {
        if (import.meta.env.DEV) console.log(`Auto-correcting orientation: landscape (${width}x${height}) to portrait - rotating 90°`);
        return 90;
      }
      return 0;
    }
    
    // 检测生成图的方向
    const generatedIsPortrait = height > width;
    const originalIsPortrait = originalImageOrientation.isPortrait;
    
    if (import.meta.env.DEV) console.log('Orientation comparison:', {
      original: originalIsPortrait ? 'portrait' : 'landscape',
      generated: generatedIsPortrait ? 'portrait' : 'landscape',
      originalDimensions: `${originalImageOrientation.width}x${originalImageOrientation.height}`,
      generatedDimensions: `${width}x${height}`
    });
    
    // 如果生成图的方向与原图不一致，需要旋转
    if (generatedIsPortrait !== originalIsPortrait) {
      if (import.meta.env.DEV) console.log(`Orientation mismatch detected! Rotating generated image 90° to match original (${originalIsPortrait ? 'portrait' : 'landscape'})`);
      return 90;
    }
    
    // 方向一致，不需要旋转
    if (import.meta.env.DEV) console.log('Orientation matches original, no rotation needed');
    return 0;
  }, [originalImageOrientation]); // 添加 originalImageOrientation 到依赖数组

  // Comparison slider handlers (used on success screen)
  const handleComparisonMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonPosition(percentage);
  };

  const handleComparisonTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonPosition(percentage);
  };

  // 生成原图预览并检测方向
  useEffect(() => {
    if (uploadedImage) {
      const url = URL.createObjectURL(uploadedImage);
      setUploadedPreview(url);
      
      // 检测原图方向
      const img = new Image();
      img.onload = () => {
        const isPortrait = img.height > img.width;
        setOriginalImageOrientation({
          isPortrait,
          width: img.width,
          height: img.height
        });
        if (import.meta.env.DEV) console.log('Original image orientation detected:', {
          width: img.width,
          height: img.height,
          isPortrait,
          orientation: isPortrait ? 'portrait' : 'landscape'
        });
      };
      img.src = url;
      
      return () => URL.revokeObjectURL(url);
    } else {
      setUploadedPreview('');
      setOriginalImageOrientation(null);
    }
  }, [uploadedImage]);

  // 检测已缓存的生成图片（如果 onLoad 没有触发）
  useEffect(() => {
    if (!generatedArt || !originalImageOrientation) return; // 等待原图方向信息
    
    // 使用标志避免重复检测
    let isDetected = false;
    
    const img = new Image();
    img.onload = () => {
      if (!isDetected && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        isDetected = true;
        const detected = detectAutoRotate(img);
        if (import.meta.env.DEV) console.log('Cached image detected, rotation:', detected, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        setAutoRotateDeg(detected);
      }
    };
    img.onerror = () => {
      if (import.meta.env.DEV) console.error('Failed to load cached image for rotation detection');
    };
    img.src = generatedArt;
    
    // 如果图片已经缓存，立即检查
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      isDetected = true;
      const detected = detectAutoRotate(img);
      if (import.meta.env.DEV) console.log('Image already cached, rotation:', detected, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
      setAutoRotateDeg(detected);
    }
  }, [generatedArt, originalImageOrientation, detectAutoRotate]); // 添加 detectAutoRotate 到依赖数组

  const handleBack = () => {
    if (currentStep === 'style') setCurrentStep('upload');
    else if (currentStep === 'generate') setCurrentStep('style');
  };

  return (
    <>
      <MetaTags
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords ?? ''}
        ogImage={seo.ogImage ?? ''}
      />
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
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-center">Art Generated Successfully!</h3>

                  {/* Original & Generated side by side */}
                  <div className="grid grid-cols-10 gap-6">
                    {/* Original */}
                    <UiCard className="col-span-10 lg:col-span-3">
                      <UiCardHeader>
                        <UiCardTitle>Original Photo</UiCardTitle>
                      </UiCardHeader>
                      <CardContent>
                        <div className="aspect-[3/4] overflow-hidden rounded-lg">
                          <img
                            src={uploadedPreview}
                            alt="Original"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CardContent>
                    </UiCard>

                    {/* Generated */}
                    <UiCard className="col-span-10 lg:col-span-7">
                      <UiCardHeader>
                        <UiCardTitle>AI Generated Art</UiCardTitle>
                      </UiCardHeader>
                      <CardContent>
                        <div className="aspect-[3/4] overflow-hidden rounded-lg relative">
                          {/* 图片已在生成时进行了方向校正，无需 CSS 旋转 */}
                          <img
                            src={generatedArt}
                            alt="Generated Art"
                            className="w-full h-full object-contain"
                            style={{ transform: `rotate(${rotationDeg}deg)` }}
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (import.meta.env.DEV) console.log('Main generated image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                            }}
                            onError={() => {
                              if (import.meta.env.DEV) console.error('Failed to load generated image');
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-smooth flex items-center justify-center gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setRotationDeg((prev) => (prev - 90) % 360)}
                            >
                              Rotate -90°
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setRotationDeg((prev) => (prev + 90) % 360)}
                            >
                              Rotate +90°
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = generatedArt;
                                link.download = 'pawdia-artwork.jpg';
                                link.click();
                              }}
                              className="shadow-glow"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </UiCard>
                  </div>

                  {/* Image Comparison Slider (moved above Style Details) */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MoveHorizontal className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-semibold">Image Comparison</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Slide to compare the original photo and the AI-generated artwork.
                      </p>

                      <div
                        className="relative aspect-[3/4] w-full max-w-2xl mx-auto bg-gray-100 rounded-lg overflow-hidden cursor-col-resize"
                        onMouseDown={handleComparisonMove}
                        onMouseMove={(e) => e.buttons === 1 && handleComparisonMove(e)}
                        onTouchStart={handleComparisonTouch}
                        onTouchMove={handleComparisonTouch}
                      >
                        {/* Generated (background) - 图片已在生成时进行了方向校正，无需 CSS 旋转 */}
                        <div className="absolute inset-0">
                          <img
                            src={generatedArt}
                            alt="AI generated art"
                            className="w-full h-full object-contain"
                            draggable={false}
                            style={{ transform: `rotate(${rotationDeg}deg)` }}
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              if (import.meta.env.DEV) console.log('Comparison generated image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                            }}
                            onError={() => {
                              if (import.meta.env.DEV) console.error('Failed to load comparison image');
                            }}
                          />
                        </div>

                        {/* Original (clipped overlay) */}
                        {uploadedPreview && (
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                          >
                            <img
                              src={uploadedPreview}
                              alt="Original"
                              className="w-full h-full object-contain"
                              draggable={false}
                            />
                          </div>
                        )}

                        {/* Slider handle */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg cursor-col-resize z-10"
                          style={{ left: `${comparisonPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
                            <MoveHorizontal className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-xs">
                          Original
                        </div>
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-xs">
                          AI Generated
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedArt;
                        link.download = 'pawdia-artwork.jpg';
                        link.click();
                      }}
                    >
                      <Download className="w-5 h-5" />
                      Download Artwork
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => {
                        // 重置手动旋转，但保留自动检测的旋转
                        setRotationDeg(0);
                        if (import.meta.env.DEV) console.log('Manual rotation reset, auto rotation:', autoRotateDeg);
                      }}
                    >
                      Reset Manual Rotation
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};