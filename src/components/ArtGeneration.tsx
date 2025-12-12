import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wand2, Download, RefreshCw, AlertCircle, Settings, Coins, AlertTriangle, Info } from "lucide-react";
import { stylePrompts, generatePrompt } from "@/config/prompts";
import { generateImage, ImageGenerationRequest } from "@/services/aiApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ArtGenerationProps {
  image: File;
  styleId: string;
  onArtGenerated: (artUrl: string) => void;
  onBack: () => void;
}

export const ArtGeneration = ({ image, styleId, onArtGenerated, onBack }: ArtGenerationProps) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArt, setGeneratedArt] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showQualitySettings, setShowQualitySettings] = useState(false);
  const [dpi, setDpi] = useState<number>(300);
  const [resolution, setResolution] = useState<string>('high');
  const [quality, setQuality] = useState<string>('ultra');
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  useEffect(() => {
    // Create image preview URL
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [image]);
  
  // Check if user has sufficient credits
  const checkCredits = async () => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    // Check user credits
    const currentCredits = user.credits || 0;
    if (currentCredits < 1) {
      setInsufficientCredits(true);
      return false;
    }
    
    return true;
  };
  
  // Deduct credits
  const deductCredits = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/subscriptions/credits/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: 1 })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deduct credits');
      }
  
      const result = await response.json();
      
      // Update local user information
      if (updateUser) {
        updateUser({ ...user, credits: result.credits });
      }
      
      return true;
    } catch (error) {
      console.error('Credit deduction failed:', error);
      throw error;
    }
  };
  
  const generateArtWithAI = async () => {
    // Check if user is logged in
    if (!isAuthenticated || !user) {
      setError('Please login first to use AI art generation');
      return;
    }
  
    // Check if credits are sufficient
    const hasSufficientCredits = await checkCredits();
    if (!hasSufficientCredits) {
      setError('Insufficient credits, please recharge first');
      return;
    }
  
    setIsGenerating(true);
    setError('');
    setProgress(0);
    setInsufficientCredits(false);
  
    try {
      // Deduct credits first
      await deductCredits();
  
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
  
      // Generate dynamic prompt based on selected style
      const prompt = generatePrompt(styleId);
      console.log('Using prompt:', prompt);
  
      // Prepare API request - pass image and prompt to Gemini
      const request: ImageGenerationRequest = {
        prompt: prompt,
        image: image,
        dpi: dpi,
        quality: quality
      };
  
      // Call AI API to generate image
      const result = await generateImage(request);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.imageUrl) {
        setGeneratedArt(result.imageUrl);
        onArtGenerated(result.imageUrl);
      } else {
        throw new Error('API returned invalid image URL');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Credit display and recharge guidance
  {isAuthenticated && user && (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Current Credits:</span>
            <span className="text-xl font-bold text-blue-600">{user.credits || 0}</span>
          </div>
          {user.credits && user.credits < 3 && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Insufficient credits, please recharge</span>
            </div>
          )}
        </div>
        <Button 
          onClick={() => navigate('/subscription')}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
        >
          <Coins className="w-4 h-4 mr-2" />
          Recharge Credits
        </Button>
      </div>
    </div>
  )}
  
  // Start AI Generation button
  <Button
    onClick={generateArtWithAI}
    disabled={isGenerating || insufficientCredits}
    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold"
  >
    {isGenerating ? (
      <>
        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <Wand2 className="w-5 h-5 mr-2" />
        Start AI Generation (Costs 1 Credit)
      </>
    )}
  </Button>
  
  const handleDownload = () => {
    if (generatedArt) {
      const link = document.createElement('a');
      link.href = generatedArt;
      link.download = `pet-art-${styleId}-${Date.now()}.jpg`;
      link.click();
    }
  };

  const handleRegenerate = () => {
    setGeneratedArt('');
    setError('');
    generateArtWithAI();
  };

  // Remove auto-generation logic, let user select pet type first
  // useEffect(() => {
  //   // Auto-start generation when component mounts
  //   if (!generatedArt && !isGenerating) {
  //     generateArtWithAI();
  //   }
  // }, []);

  const selectedStyle = stylePrompts.find(s => s.id === styleId);

  return (
    <div>
      {/* Credits display and recharge guidance */}
      {isAuthenticated && user && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Current Credits:</span>
                <span className="text-xl font-bold text-blue-600">{user.credits || 0}</span>
              </div>
              {user.credits && user.credits < 3 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Insufficient credits, please recharge in time</span>
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              Recharge Credits
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold">Generating AI Art</h2>
          <p className="text-muted-foreground">
            Creating {selectedStyle?.name.toLowerCase()} style portrait
          </p>
        </div>
        
        <div className="w-24"></div>
      </div>

      {/* Simple Generation Control */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">AI Art Generation</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowQualitySettings(!showQualitySettings)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Quality Settings
            </Button>
          </div>
          
          {/* Quality Settings Panel */}
          {showQualitySettings && (
            <div className="bg-muted/20 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* DPI Setting */}
                <div className="space-y-2">
                  <Label htmlFor="dpi-select">DPI Resolution</Label>
                  <Select value={dpi.toString()} onValueChange={(value) => setDpi(Number(value))}>
                    <SelectTrigger id="dpi-select">
                      <SelectValue placeholder="Select DPI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150">150 DPI (Web Quality)</SelectItem>
                      <SelectItem value="300">300 DPI (Print Quality) - Recommended</SelectItem>
                      <SelectItem value="600">600 DPI (High Quality Print)</SelectItem>
                      <SelectItem value="1200">1200 DPI (Ultra Quality Print)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {dpi >= 300 ? '✓ Print-ready quality' : 'Web display only'}
                  </p>
                </div>
                
                {/* Resolution Setting */}
                <div className="space-y-2">
                  <Label htmlFor="resolution-select">Image Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution-select">
                      <SelectValue placeholder="Select Resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1024×1024)</SelectItem>
                      <SelectItem value="high">High (2048×2048)</SelectItem>
                      <SelectItem value="ultra">Ultra (4096×4096)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {resolution === 'ultra' ? '✓ Maximum detail' : 'Good for most uses'}
                  </p>
                </div>
                
                {/* Quality Setting */}
                <div className="space-y-2">
                  <Label htmlFor="quality-select">Generation Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger id="quality-select">
                      <SelectValue placeholder="Select Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good (Fast)</SelectItem>
                      <SelectItem value="high">High (Balanced)</SelectItem>
                      <SelectItem value="ultra">Ultra (Best) - Recommended for Print</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {quality === 'ultra' ? '✓ Professional print quality' : 'Standard quality'}
                  </p>
                </div>
              </div>
              
              {/* Print Quality Information */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Print Quality Recommendations:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• <strong>300 DPI + Ultra Quality</strong> - Professional printing</li>
                      <li>• <strong>600 DPI + Ultra Quality</strong> - Premium large format prints</li>
                      <li>• <strong>1200 DPI</strong> - Maximum detail for close inspection</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-muted-foreground">
                <p>Current settings: {dpi} DPI • {resolution.toUpperCase()} Resolution • {quality.toUpperCase()} Quality</p>
                <p>These requirements will be sent to the AI model and enhanced for optimal print quality.</p>
              </div>
            </div>
          )}
          
          {/* Start Generation Button */}
          {!generatedArt && !isGenerating && (
            <div className="mt-4 text-center">
              {isAuthenticated && user && user.credits && user.credits > 0 ? (
                <Button 
                  size="lg" 
                  onClick={generateArtWithAI}
                  className="shadow-glow"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Start AI Generation (Costs 1 Credit)
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Insufficient Credits</span>
                    </div>
                    <p className="text-red-600 text-sm mt-2 text-center">
                      You need at least 1 credit to use the AI drawing function
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/subscription')}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Recharge Now
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Original Image - Vertical Layout */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Original Photo</h3>
            <div className="aspect-[3/4] overflow-hidden rounded-lg">
              <img
                src={imagePreview}
                alt="Original pet"
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Generated Art - Larger Vertical Layout */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Generated Art</h3>
            
            {isGenerating && (
              <div className="aspect-[3/4] flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4 mx-auto" />
                  <p className="font-medium mb-2">AI is creating your art...</p>
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mx-auto">
                    <div 
                      className="h-full bg-primary transition-smooth"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
                </div>
              </div>
            )}
            
            {generatedArt && (
              <div className="aspect-[3/4] overflow-hidden rounded-lg relative group">
                <img
                  src={generatedArt}
                  alt="Generated AI art"
                  className="w-full h-full object-cover -rotate-90 transform origin-center"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <Button onClick={handleDownload} className="shadow-glow">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Style Details */}
      {selectedStyle && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Style Details</h3>
            <div className="grid md:grid-cols-1 gap-6">
              <div>
                <h4 className="font-medium mb-2">Generation Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Steps:</span>
                    <span className="font-mono">{selectedStyle.parameters?.steps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CFG Scale:</span>
                    <span className="font-mono">{selectedStyle.parameters?.cfgScale}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sampler:</span>
                    <span className="font-mono">{selectedStyle.parameters?.sampler}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution:</span>
                    <span className="font-mono">
                      {selectedStyle.parameters?.width}×{selectedStyle.parameters?.height}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Generation Failed</span>
          </div>
          <p className="text-red-600 mt-1 text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerate}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="text-center space-y-4">
        {generatedArt ? (
          <div>
            <p className="text-green-600 font-medium mb-4">
              ✓ AI Art Generation Successful!
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button size="lg" onClick={() => onArtGenerated(generatedArt)} className="shadow-glow">
                <Wand2 className="w-4 h-4 mr-2" />
                Customize Products
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Wand2 className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-muted-foreground">AI is working on your masterpiece...</span>
          </div>
        )}
      </div>
    </div>
  );
};