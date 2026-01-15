import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertCircle,
  Settings,
  Coins,
  AlertTriangle,
  MoveHorizontal,
  Wand2 as Wand
} from "lucide-react";
import { apiClient } from '@/lib/apiClient';
import { stylePrompts, generatePrompt, getStyleConfig } from "@/config/prompts";
import { generateImage, ImageGenerationRequest } from "@/services/aiApi";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";
// User type removed (unused)
import { QualitySettings } from "./QualitySettings";

// 导出类型定义供子组件使用
export type PlanKey = 'free' | 'basic' | 'premium';

export interface QualitySettingsProps {
  plan: PlanKey;
  dpi: number;
  resolution: string;
  quality: string;
  currentConfig: {
    dpiOptions: number[];
    resolutionOptions: { value: string; label: string }[];
    qualityOptions: string[];
  };
  allDpiOptions: number[];
  allResolutionOptions: { value: string; label: string; plan: PlanKey }[];
  allQualityOptions: { value: string; label: string; plan: PlanKey }[];
  onDpiChange: (dpi: number) => void;
  onResolutionChange: (resolution: string) => void;
  onQualityChange: (quality: string) => void;
  onUpgradeClick: () => void;
}

interface ArtGenerationProps {
  image: File;
  styleId: string;
  onArtGenerated: (artUrl: string) => void;
  onBack: () => void;
}

export const ArtGeneration = ({ image, styleId, onArtGenerated, onBack }: ArtGenerationProps) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = (useNavigate as any)();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArt, setGeneratedArt] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showQualitySettings, setShowQualitySettings] = useState(false);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  // imageRotation state removed (unused)
  const [autoRotateDeg, setAutoRotateDeg] = useState<number>(0); // 自动检测的旋转角度（0或90度）
  const [sliderPosition, setSliderPosition] = useState(50); // Default in the middle position
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null as unknown as HTMLDivElement | null);
  const [watermarkApplied, setWatermarkApplied] = useState<boolean>(false);
  const plan: PlanKey = (user?.subscription?.plan as PlanKey) || 'free';

  // All available options (for display)
  const allDpiOptions = [72, 200, 300, 600];
  const allResolutionOptions: { value: string; label: string; plan: PlanKey }[] = [
    { value: '512', label: '512px (short side)', plan: 'free' },
    { value: '1080', label: '1080px (short side)', plan: 'basic' },
    { value: '1440', label: '1440px (short side)', plan: 'basic' },
    { value: '2160', label: '2160px (short side)', plan: 'premium' },
  ];
  const allQualityOptions: { value: string; label: string; plan: PlanKey }[] = [
    { value: 'good', label: 'Good (Fast)', plan: 'free' },
    { value: 'high', label: 'High (Balanced)', plan: 'basic' },
    { value: 'ultra', label: 'Ultra (Best) - Recommended for Print', plan: 'premium' },
  ];

  // Plan-based constraints
  const planConfig = useMemo((): Record<PlanKey, {
    dpiOptions: number[];
    resolutionOptions: { value: string; label: string }[];
    qualityOptions: string[];
    defaultDpi: number;
    defaultResolution: string;
    defaultQuality: string;
    maxSize: number;
  }> => ({
    free: {
      dpiOptions: [72],
      resolutionOptions: [
        { value: '512', label: '512px (short side)' },
      ],
      qualityOptions: ['good'],
      defaultDpi: 72,
      defaultResolution: '512',
      defaultQuality: 'good',
      maxSize: 512,
    },
    basic: {
      dpiOptions: [200, 300],
      resolutionOptions: [
        { value: '1080', label: '1080px (short side)' },
        { value: '1440', label: '1440px (short side)' },
      ],
      qualityOptions: ['good', 'high'],
      defaultDpi: 200,
      defaultResolution: '1080',
      defaultQuality: 'high',
      maxSize: 1440,
    },
    premium: {
      dpiOptions: [200, 300, 600],
      resolutionOptions: [
        { value: '1080', label: '1080px (short side)' },
        { value: '1440', label: '1440px (short side)' },
        { value: '2160', label: '2160px (short side)' },
      ],
      qualityOptions: ['good', 'high', 'ultra'],
      defaultDpi: 300,
      defaultResolution: '1440',
      defaultQuality: 'ultra',
      maxSize: 2160,
    }
  } as const), []);

  const currentConfig = planConfig[plan as PlanKey] || planConfig.free;
  
  // Initialize DPI, resolution, and quality based on subscription plan
  const [dpi, setDpi] = useState<number>(currentConfig.defaultDpi);
  const [resolution, setResolution] = useState<string>(currentConfig.defaultResolution);
  const [quality, setQuality] = useState<string>(currentConfig.defaultQuality);

  // Get image dimensions and orientation
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; isPortrait: boolean } | null>(null);

  useEffect(() => {
    // Create image preview URL
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    if (import.meta.env.DEV) console.log('Image preview URL created:', url);
    
    // Get image dimensions and determine orientation
    const img = new Image();
    img.onload = () => {
      const isPortrait = img.height > img.width; // 纵向：高度 > 宽度
      setImageDimensions({ 
        width: img.width, 
        height: img.height,
        isPortrait 
      });
      if (import.meta.env.DEV) console.log('Original image dimensions loaded:', {
        width: img.width,
        height: img.height,
        isPortrait,
        orientation: isPortrait ? 'portrait' : 'landscape'
      });
    };
    img.src = url;
    
    // Don't revoke URL immediately - keep it for comparison component
    // Only revoke when component unmounts
    return () => {
      // Keep URL alive for comparison component
      // URL.revokeObjectURL(url); // Commented out to keep URL available
    };
  }, [image]);

  // Calculate output dimensions based on short side and aspect ratio
  const calculateOutputDimensions = (shortSide: number): { width: number; height: number } => {
    if (!imageDimensions) {
      // Fallback to square if dimensions not available
      return { width: shortSide, height: shortSide };
    }
    
    const { width: originalWidth, height: originalHeight } = imageDimensions;
    const aspectRatio = originalWidth / originalHeight;
    
    let outputWidth: number;
    let outputHeight: number;
    
    if (originalWidth <= originalHeight) {
      // Portrait or square: width is the short side
      outputWidth = shortSide;
      outputHeight = Math.round(shortSide / aspectRatio);
    } else {
      // Landscape: height is the short side
      outputHeight = shortSide;
      outputWidth = Math.round(shortSide * aspectRatio);
    }
    
    return { width: outputWidth, height: outputHeight };
  };

  // 通用的Canvas初始化函数
  const initializeCanvas = (canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D => {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    // 设置白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return ctx;
  };

  // 通用的图片缩放函数（适应画布尺寸，保持宽高比）
  const scaleImageToFit = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): void => {
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (targetWidth - drawWidth) / 2;
    const offsetY = (targetHeight - drawHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // 通用的图片旋转函数（逆时针90度）
  const rotateImage90Degrees = async (img: HTMLImageElement, logMessage: string = 'Rotating image'): Promise<HTMLImageElement> => {
    if (import.meta.env.DEV) console.log(`${logMessage} -90 degrees (counterclockwise)`);
    const rotateCanvas = document.createElement('canvas');
    // 旋转后宽高互换
    rotateCanvas.width = img.height;
    rotateCanvas.height = img.width;
    const rotateCtx = rotateCanvas.getContext('2d');
    if (!rotateCtx) {
      throw new Error('Failed to get canvas context for rotation');
    }

    rotateCtx.translate(rotateCanvas.width / 2, rotateCanvas.height / 2);
    // 使用逆时针旋转90度（-90度）来正确对齐图片方向
    rotateCtx.rotate(-90 * Math.PI / 180);
    rotateCtx.drawImage(img, -img.width / 2, -img.height / 2);

    // 创建新的 Image 对象
    const rotatedImg = new Image();
    rotatedImg.crossOrigin = 'anonymous';

    await new Promise<void>((resolveRotate, rejectRotate) => {
      rotatedImg.onload = () => resolveRotate();
      rotatedImg.onerror = () => rejectRotate(new Error('Failed to load rotated image'));
      rotatedImg.src = rotateCanvas.toDataURL('image/jpeg', 0.99);
    });

    if (import.meta.env.DEV) console.log('Image rotated successfully:', { width: rotatedImg.width, height: rotatedImg.height });
    return rotatedImg;
  };

  // 检查是否应该应用水印的辅助函数
  const shouldApplyWatermark = (): boolean => {
    return user?.subscription?.plan === 'free';
  };

  // 添加水印的辅助函数
  const addWatermarkToCanvas = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // 重新获取当前订阅等级确保准确性
    const currentPlan = user?.subscription?.plan || 'free';
    if (currentPlan === 'free') {
      if (import.meta.env.DEV) console.log('Adding watermark for free plan');
      // 添加文本水印 - 简单可靠
      const fontSize = Math.max(20, canvasWidth * 0.06); // 宽度的6%，最小20px
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#FFFFFF'; // 白色文字
      ctx.strokeStyle = '#000000'; // 黑色轮廓
      ctx.lineWidth = fontSize * 0.2; // 粗轮廓便于阅读
      ctx.textAlign = 'right'; // 右对齐，底部右侧位置
      ctx.textBaseline = 'bottom'; // 底部对齐

      // 水印文字 - 仅"pawdia ai"
      const watermarkText = 'pawdia ai';

      // 计算位置：底部右侧带边距
      const padding = canvasWidth * 0.05;
      const x = canvasWidth - padding;
      const y = canvasHeight - padding;

      // 绘制带轮廓的文字以增强可见性
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
  };

  // 加载图片的辅助函数，带 CORS fallback 机制
  const loadImageWithFallback = (imgUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // 首先尝试使用 crossOrigin（用于 canvas 操作）
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        if (import.meta.env.DEV) console.warn('Failed to load image with crossOrigin, trying without crossOrigin...');
        // 如果 crossOrigin 失败，尝试不使用 crossOrigin（可能无法在 canvas 上使用，但至少可以显示）
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          if (import.meta.env.DEV) console.warn('Image loaded without crossOrigin (may have CORS restrictions)');
          resolve(fallbackImg);
        };
        fallbackImg.onerror = () => {
          reject(new Error('Failed to load image with both crossOrigin and fallback methods'));
        };
        fallbackImg.src = imgUrl;
      };
      
      img.src = imgUrl;
    });
  };

  // 尝试为图片添加水印（即使图片已经是最终尺寸）
  // 同时进行方向校正
  const addWatermarkToImage = async (imgUrl: string, targetWidth: number, targetHeight: number): Promise<string> => {
    try {
      // 使用带 fallback 的图片加载函数
      const img = await loadImageWithFallback(imgUrl);

      // 检测是否需要旋转
      const needsRotation = shouldRotateImage(img.width, img.height);

      // 如果需要旋转，先创建一个旋转后的图片
      let sourceImg = img;
      if (needsRotation) {
        sourceImg = await rotateImage90Degrees(img, 'Rotating image in addWatermarkToImage');
      }

      const canvas = document.createElement('canvas');
      const ctx = initializeCanvas(canvas, targetWidth, targetHeight);

      try {
        scaleImageToFit(ctx, sourceImg, targetWidth, targetHeight);
      } catch (drawError) {
        // 如果 drawImage 失败（可能是 CORS 问题），尝试使用原始图片 URL
        if (import.meta.env.DEV) console.warn('Failed to draw image to canvas (CORS issue?), using original URL with watermark attempt:', drawError);
        throw new Error('CORS restriction: cannot draw image to canvas');
      }

      // 添加水印
      const hadWatermark = shouldApplyWatermark();
      addWatermarkToCanvas(ctx, targetWidth, targetHeight);
      setWatermarkApplied(hadWatermark); // 无论是否有水印都设置状态

      const dataUrl = canvas.toDataURL('image/jpeg', 0.99);
      return dataUrl;
    } catch (err) {
      throw err as Error;
    }
  };

  // 检测是否需要旋转图片以匹配原图方向
  const shouldRotateImage = (imgWidth: number, imgHeight: number): boolean => {
    if (!imageDimensions) {
      // 如果没有原图信息，使用默认逻辑（横向转纵向）
      return imgWidth > imgHeight;
    }
    
    // 检测生成图的方向
    const generatedIsPortrait = imgHeight > imgWidth;
    const originalIsPortrait = imageDimensions.isPortrait;
    
    // 如果生成图的方向与原图不一致，需要旋转
    return generatedIsPortrait !== originalIsPortrait;
  };

  // Fit generated image into target dimensions with letterboxing (no distortion)
  // 同时进行方向校正，确保图片方向与原图一致
  const fitImageToCanvas = async (imgUrl: string, targetWidth: number, targetHeight: number): Promise<string> => {
    try {
      // 使用带 fallback 的图片加载函数
      const img = await loadImageWithFallback(imgUrl);

      // 检测是否需要旋转
      const needsRotation = shouldRotateImage(img.width, img.height);
      if (import.meta.env.DEV) console.log('Image orientation check:', {
        imgWidth: img.width,
        imgHeight: img.height,
        originalIsPortrait: imageDimensions?.isPortrait,
        needsRotation
      });

      // 如果需要旋转，先创建一个旋转后的图片
      let sourceImg = img;
      if (needsRotation) {
        sourceImg = await rotateImage90Degrees(img, 'Rotating image to match original orientation');
      }

      const canvas = document.createElement('canvas');
      const ctx = initializeCanvas(canvas, targetWidth, targetHeight);

      try {
        scaleImageToFit(ctx, sourceImg, targetWidth, targetHeight);
      } catch (drawError) {
        // 如果 drawImage 失败（可能是 CORS 问题），拒绝并让调用者处理
        if (import.meta.env.DEV) console.warn('Failed to draw image to canvas (CORS issue?):', drawError);
        throw new Error('CORS restriction: cannot draw image to canvas');
      }

      // 添加水印
      const hadWatermark = shouldApplyWatermark();
      addWatermarkToCanvas(ctx, targetWidth, targetHeight);
      setWatermarkApplied(hadWatermark); // 无论是否有水印都设置状态

      const dataUrl = canvas.toDataURL('image/jpeg', 0.99);
      return dataUrl;
    } catch (err) {
      throw err as Error;
    }
  };

  // Slider comparison interaction functions
  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleComparisonMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.buttons === 1 || isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  const handleComparisonStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleComparisonEnd = () => {
    setIsDragging(false);
  };

  const handleComparisonTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  // 图像方向检测函数 - 基于原图方向，确保生成图与原图方向一致
  // 使用 useCallback 确保函数使用最新的 imageDimensions
  const detectImageOrientation = useCallback((img: HTMLImageElement): number => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    // 确保有有效的尺寸
    if (!width || !height || width === 0 || height === 0) {
      if (import.meta.env.DEV) console.warn('Invalid image dimensions:', { width, height });
      return 0;
    }
    
    // 如果没有原图信息，使用默认逻辑（横向转纵向）
    if (!imageDimensions) {
      if (import.meta.env.DEV) console.warn('Original image dimensions not available, using default logic');
      if (width > height) {
        if (import.meta.env.DEV) console.log(`Auto-correcting orientation: landscape (${width}x${height}) to portrait - rotating 90°`);
        return 90;
      }
      return 0;
    }
    
    // 检测生成图的方向
    const generatedIsPortrait = height > width;
    const originalIsPortrait = imageDimensions.isPortrait;
    
    if (import.meta.env.DEV) console.log('Orientation comparison:', {
      original: originalIsPortrait ? 'portrait' : 'landscape',
      generated: generatedIsPortrait ? 'portrait' : 'landscape',
      originalDimensions: `${imageDimensions.width}x${imageDimensions.height}`,
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
  }, [imageDimensions]); // 添加 imageDimensions 到依赖数组

  // Manual rotation handled directly via setRotationDeg when user clicks rotate buttons.

  // 生成新图像时重置旋转状态并主动检测
  useEffect(() => {
    if (generatedArt && imageDimensions) {
      // 重置自动旋转状态
      setAutoRotateDeg(0);
      setRotationDeg(0);
      
      // 主动检测已缓存的图片
      const img = new Image();
      img.onload = () => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          const detected = detectImageOrientation(img);
          if (import.meta.env.DEV) console.log('Cached image detected in useEffect, rotation:', detected, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
          setAutoRotateDeg(detected);
        }
      };
      img.onerror = () => {
        if (import.meta.env.DEV) console.error('Failed to load cached image for rotation detection in useEffect');
      };
      img.src = generatedArt;
      
      // 如果图片已经缓存，立即检查
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const detected = detectImageOrientation(img);
        if (import.meta.env.DEV) console.log('Image already cached in useEffect, rotation:', detected, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        setAutoRotateDeg(detected);
      }
    } else if (generatedArt) {
      // 如果 generatedArt 已设置但 imageDimensions 未加载，重置状态
      setAutoRotateDeg(0);
      setRotationDeg(0);
    }
  }, [generatedArt, imageDimensions, detectImageOrientation]); // 添加 detectImageOrientation 到依赖数组

  // Handle mouse move and up events globally when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSliderPosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Update DPI, resolution, and quality when subscription plan changes
  useEffect(() => {
    const newConfig = planConfig[plan] || planConfig.free;

    // Always update to plan defaults when plan changes
    setDpi(newConfig.defaultDpi);
    setResolution(newConfig.defaultResolution);
    setQuality(newConfig.defaultQuality);
  }, [plan, planConfig]);
  
  // Check if user has sufficient credits
  const checkCredits = async () => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    // Check user credits
    const currentCredits = user.credits || 0;
    if (currentCredits < 1) {
      // mark insufficient via UI error state instead of separate flag
      setError('Insufficient credits, please recharge first');
      return false;
    }
    
    return true;
  };
  
  // Deduct credits
  const deductCredits = async () => {
    try {
      // Use shared apiClient so timeouts, headers and error handling are consistent
      const resp = await apiClient.post<{ success: boolean; credits: number }>('/subscriptions/credits/use', { amount: 1 }, { timeout: 8000 });
      const result = resp.data as { success: boolean; credits: number };

      // Update local user information
      if (updateUser) {
        updateUser({ ...user, credits: result.credits });
      }

      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Credit deduction failed:', error);
      throw error;
    }
  };

  // Refund credits (when generation fails)
  const refundCredits = async () => {
    try {
      if (import.meta.env.DEV) console.log('Refunding credits due to generation failure...');
      const resp = await apiClient.post<{ success: boolean; credits: number }>('/subscriptions/credits/add', { amount: 1 }, { timeout: 8000 });
      const result = resp.data as { success: boolean; credits: number };

      // Update local user information
      if (updateUser) {
        updateUser({ ...user, credits: result.credits });
      }

      if (import.meta.env.DEV) console.log('Credits refunded successfully. New balance:', result.credits);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Credit refund error:', error);
      return false;
    }
  };
  
  const generateArtWithAI = async () => {
    // Check if user is logged in
    if (!isAuthenticated || !user) {
      setError('Please login first to use AI art generation');
      return;
    }
  
    // Enforce plan defaults
    if (!currentConfig.dpiOptions.includes(dpi)) {
      setDpi(currentConfig.defaultDpi);
    }
    if (!currentConfig.resolutionOptions.find((r) => r.value === resolution)) {
      setResolution(currentConfig.defaultResolution);
    }
    if (!currentConfig.qualityOptions.includes(quality)) {
      setQuality(currentConfig.defaultQuality);
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
  
    let creditsDeducted = false;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
  
    try {
      // Quick API health check to avoid deducting credits when backend is unreachable
      try {
        await apiClient.get('/health', { timeout: 3000 });
      } catch (healthErr) {
        if (import.meta.env.DEV) console.error('API health check failed:', healthErr);
        throw new Error('Backend unreachable. Please try again later.');
      }

      // Deduct credits first
      await deductCredits();
      creditsDeducted = true;
      if (import.meta.env.DEV) console.log('Credits deducted successfully');
  
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
  
      // Generate dynamic prompt based on selected style
      const prompt = generatePrompt(styleId);
      const styleConfig = getStyleConfig(styleId);
      if (import.meta.env.DEV) console.log('Using prompt:', prompt);
      if (import.meta.env.DEV) console.log('Style config:', styleConfig);

      // Prepare API request - pass image and prompt to Gemini
      const resolutionValue = currentConfig.resolutionOptions.find((r) => r.value === resolution)?.value || currentConfig.defaultResolution;
      const shortSide = parseInt(resolutionValue, 10);
      
      // Wait for image dimensions if not yet loaded
      if (!imageDimensions) {
        if (import.meta.env.DEV) console.warn('Image dimensions not yet loaded, waiting...');
        // Wait a bit for image to load
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Calculate output dimensions based on original image aspect ratio
      const outputDimensions = calculateOutputDimensions(shortSide);
      if (import.meta.env.DEV) console.log('Original image dimensions:', imageDimensions);
      if (import.meta.env.DEV) console.log('Output dimensions:', outputDimensions, 'short side:', shortSide);
      
      // Validate dimensions
      if (!outputDimensions.width || !outputDimensions.height || outputDimensions.width <= 0 || outputDimensions.height <= 0) {
        if (import.meta.env.DEV) console.error('Invalid output dimensions, using fallback:', outputDimensions);
        // Fallback to square
        const fallbackSize = shortSide;
        outputDimensions.width = fallbackSize;
        outputDimensions.height = fallbackSize;
      }

      // Build request with all quality parameters
      const request = {
        prompt: prompt,
        image: image,
        negativePrompt: styleConfig?.negativePrompt ?? '', // Pass style-specific negative prompt (default to empty)
        dpi: currentConfig.dpiOptions.includes(dpi) ? dpi : currentConfig.defaultDpi,
        quality: quality,
        width: outputDimensions.width,
        height: outputDimensions.height,
        // Pass style parameters for better quality control
        steps: styleConfig?.parameters?.steps,
        cfgScale: styleConfig?.parameters?.cfgScale,
        sampler: styleConfig?.parameters?.sampler,
        styleId: styleId // Pass style ID for logging/debugging
      } as ImageGenerationRequest;
  
      // Call AI API to generate image
      const result = await generateImage(request);
      
      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);
      
      if (result.imageUrl) {
        // Post-process to fit target dimensions without distortion
        let displayedUrl = result.imageUrl;
        try {
          displayedUrl = await fitImageToCanvas(result.imageUrl, outputDimensions.width, outputDimensions.height);
          if (import.meta.env.DEV) console.log('Image fitted to canvas successfully with watermark');
        } catch (resizeErr) {
          if (import.meta.env.DEV) console.warn('Fit image to canvas failed, attempting to add watermark to original image:', resizeErr);
          // 即使 fitImageToCanvas 失败，也尝试添加水印
          try {
            displayedUrl = await addWatermarkToImage(result.imageUrl, outputDimensions.width, outputDimensions.height);
            if (import.meta.env.DEV) console.log('Watermark added to original image successfully');
          } catch (watermarkErr) {
            if (import.meta.env.DEV) console.error('Failed to add watermark, using original image:', watermarkErr);
            // 如果添加水印也失败，使用原始图片（可能没有水印，但至少能显示）
            displayedUrl = result.imageUrl;
            setWatermarkApplied(false); // 标记水印未应用
          }
        }

        // Display processed image（先在当前页面展示成功与对比组件，不立即跳转）
        setGeneratedArt(displayedUrl);
        const currentPlan = user?.subscription?.plan || 'free';
        const shouldHaveWatermark = currentPlan === 'free';
        if (import.meta.env.DEV) console.log('Generated art URL set:', displayedUrl);
        if (import.meta.env.DEV) console.log('Image preview URL available:', imagePreview);
        if (import.meta.env.DEV) console.log('Comparison component should be visible:', !!result.imageUrl && !!imagePreview);
        if (import.meta.env.DEV) console.log('Watermark should be applied:', shouldHaveWatermark, 'Plan:', currentPlan);
        
        // If enhancement is in progress, update when it completes (optional)
        if (result.enhancementPromise) {
          if (import.meta.env.DEV) console.log('Waiting for image enhancement to complete...');
          result.enhancementPromise
            .then((enhancedUrl) => {
              if (import.meta.env.DEV) console.log('Enhanced image ready, updating display...');
              fitImageToCanvas(enhancedUrl, outputDimensions.width, outputDimensions.height)
                .then((fitted) => {
                  if (import.meta.env.DEV) console.log('Enhanced image fitted to canvas successfully with watermark');
                  setGeneratedArt(fitted);
                })
                .catch((fitErr) => {
                  if (import.meta.env.DEV) console.warn('Fit enhanced image to canvas failed, attempting to add watermark:', fitErr);
                  // 即使 fitImageToCanvas 失败，也尝试添加水印
                  addWatermarkToImage(enhancedUrl, outputDimensions.width, outputDimensions.height)
                    .then((watermarked) => {
                      if (import.meta.env.DEV) console.log('Watermark added to enhanced image successfully');
                      // 水印状态已在 addWatermarkToImage 中设置
                      setGeneratedArt(watermarked);
                    })
                    .catch((watermarkErr) => {
                      if (import.meta.env.DEV) console.error('Failed to add watermark to enhanced image, attempting final watermark attempt:', watermarkErr);
                      // 即使 addWatermarkToImage 失败，也尝试最后一次添加水印
                      // 创建一个新的 canvas，直接使用 enhancedUrl 作为背景，然后添加水印
                      const finalCanvas = document.createElement('canvas');
                      finalCanvas.width = outputDimensions.width;
                      finalCanvas.height = outputDimensions.height;
                      const finalCtx = finalCanvas.getContext('2d');
                      if (finalCtx) {
                        // 尝试加载图片并绘制 - 使用 loadImageWithFallback 保持一致性
                        loadImageWithFallback(enhancedUrl)
                          .then((finalImg) => {
                            try {
                              finalCtx.fillStyle = '#ffffff';
                              finalCtx.fillRect(0, 0, outputDimensions.width, outputDimensions.height);
                              const scale = Math.min(outputDimensions.width / finalImg.width, outputDimensions.height / finalImg.height);
                              const drawWidth = finalImg.width * scale;
                              const drawHeight = finalImg.height * scale;
                              const offsetX = (outputDimensions.width - drawWidth) / 2;
                              const offsetY = (outputDimensions.height - drawHeight) / 2;
                              finalCtx.drawImage(finalImg, offsetX, offsetY, drawWidth, drawHeight);
                              const hadWatermark = shouldApplyWatermark();
                              addWatermarkToCanvas(finalCtx, outputDimensions.width, outputDimensions.height);
                              setWatermarkApplied(hadWatermark); // 无论是否有水印都设置状态
                              const finalDataUrl = finalCanvas.toDataURL('image/jpeg', 0.99);
                              if (import.meta.env.DEV) console.log('Final watermark attempt successful');
                              setGeneratedArt(finalDataUrl);
                            } catch (finalErr) {
                              if (import.meta.env.DEV) console.error('Final watermark attempt failed, using enhanced without watermark:', finalErr);
                              setWatermarkApplied(false); // 标记水印未应用
                              setGeneratedArt(enhancedUrl); // 最后的后备方案
                            }
                          })
                          .catch((loadErr) => {
                            if (import.meta.env.DEV) console.error('Failed to load enhanced image for final watermark attempt:', loadErr);
                            setWatermarkApplied(false); // 标记水印未应用
                            setGeneratedArt(enhancedUrl); // 最后的后备方案
                          });
                      } else {
                        if (import.meta.env.DEV) console.error('Failed to get canvas context for final watermark attempt');
                        setWatermarkApplied(false); // 添加错误边界处理
                        setGeneratedArt(enhancedUrl); // 最后的后备方案
                      }
                    });
                });
              // Optionally update the callback with enhanced image
              // onArtGenerated(enhancedUrl);
            })
            .catch((err) => {
              if (import.meta.env.DEV) console.warn('Image enhancement failed, keeping original:', err);
            });
        }
      } else {
        throw new Error('API returned invalid image URL');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Generation failed:', err);
      
      // Clear progress interval if still running
      if (progressInterval) clearInterval(progressInterval);
      
      // Detect provider quota error (from ApiError.body.raw.error or message)
      const apiErr = err as any;
      const providerQuotaError =
        (apiErr && apiErr.status === 403 && apiErr.body && apiErr.body.raw && apiErr.body.raw.error && apiErr.body.raw.error.code === 'insufficient_user_quota') ||
        (apiErr && typeof apiErr.message === 'string' && apiErr.message.toLowerCase().includes('quota'));

      // Refund credits if they were deducted
      if (creditsDeducted) {
        if (import.meta.env.DEV) console.log('Generation failed, attempting to refund credits...');
        const refundSuccess = await refundCredits();
        if (refundSuccess) {
          if (providerQuotaError) {
            setError('AI provider quota exhausted. Credits have been refunded. Please try again later or contact support.');
          } else {
          setError((err instanceof Error ? err.message : 'Error occurred during generation') + ' (Credits have been refunded)');
          }
        } else {
          setError((err instanceof Error ? err.message : 'Error occurred during generation') + ' (Failed to refund credits, please contact support)');
        }
      } else {
        if (providerQuotaError) {
          setError('AI provider quota exhausted. Please try again later or contact support.');
      } else {
        setError(err instanceof Error ? err.message : 'Error occurred during generation');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

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
    setWatermarkApplied(false); // 重置水印状态
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
    <div data-watermark={watermarkApplied}>
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
            <QualitySettings
              plan={plan}
              dpi={dpi}
              resolution={resolution}
              quality={quality}
              currentConfig={currentConfig}
              allDpiOptions={allDpiOptions}
              allResolutionOptions={allResolutionOptions}
              allQualityOptions={allQualityOptions}
              onDpiChange={setDpi}
              onResolutionChange={setResolution}
              onQualityChange={setQuality}
              onUpgradeClick={() => navigate('/subscription')}
            />
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
                <Wand className="w-4 h-4 mr-2" />
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

      <div className="grid grid-cols-10 gap-8 mb-8">
        {/* Original Image - Vertical Layout */}
        <Card className="col-span-10 lg:col-span-3">
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
        <Card className="col-span-10 lg:col-span-7">
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
                  className="w-full h-full object-contain transition-transform duration-300"
                  style={{ 
                    transform: `rotate(${autoRotateDeg + rotationDeg}deg)`,
                    transformOrigin: 'center center',
                    // 确保旋转后的图片完全可见
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    // 检查图片是否已完全加载，并且尺寸有效
                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                      // 确保原图信息已加载
                      if (imageDimensions) {
                        const detected = detectImageOrientation(img);
                        if (import.meta.env.DEV) console.log('Image loaded, detected rotation:', detected, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                        // 直接设置检测结果，允许重新检测（如果原图信息后来才加载）
                        setAutoRotateDeg(detected);
                      } else {
                        if (import.meta.env.DEV) console.warn('Original image dimensions not available yet, will retry in 100ms');
                        // 延迟重试，等待原图信息加载
                        setTimeout(() => {
                          if (imageDimensions && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                            const detected = detectImageOrientation(img);
                            if (import.meta.env.DEV) console.log('Retry: Image rotation detected:', detected);
                            setAutoRotateDeg(detected);
                          }
                        }, 100);
                      }
                    }
                  }}
                  onError={() => {
                    if (import.meta.env.DEV) console.error('Failed to load generated image');
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setRotationDeg((prev) => (prev - 90) % 360)}>
                    Rotate -90°
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setRotationDeg((prev) => (prev + 90) % 360)}>
                    Rotate +90°
                  </Button>
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

            {/* Image Comparison Slider - Show inside success section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MoveHorizontal className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Image Comparison</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Slide to compare original and AI-generated images
                </p>

                <div
                  ref={containerRef}
                  className="relative aspect-[3/4] w-full max-w-2xl mx-auto bg-gray-100 rounded-lg overflow-hidden cursor-col-resize select-none"
                  style={{
                    aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : '3/4',
                    minHeight: '360px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                  }}
                  onMouseDown={handleComparisonStart}
                  onMouseMove={handleComparisonMove}
                  onMouseUp={handleComparisonEnd}
                  onMouseLeave={handleComparisonEnd}
                  onTouchStart={handleComparisonTouch}
                  onTouchMove={handleComparisonTouch}
                  onTouchEnd={handleComparisonEnd}
                >
                  {/* Generated Image (Background) */}
                  <div className="absolute inset-0">
                    <img
                      src={generatedArt}
                      alt="AI generated art"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  {/* Original Image (Clipped overlay) */}
                  {imagePreview && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={imagePreview}
                        alt="Original pet"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Slider Handle */}
                  <div
                    className={`absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg cursor-col-resize z-10 transition-all ${
                      isDragging ? 'w-1.5' : ''
                    }`}
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className={`absolute top-1/2 left-1/2 w-6 h-6 bg-blue-600 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform ${
                        isDragging ? 'scale-110' : ''
                      }`}
                    >
                      <MoveHorizontal className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
                    Original
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
                    AI Generated
                  </div>

                  {/* Position Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                    {Math.round(sliderPosition)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button size="lg" onClick={() => onArtGenerated(generatedArt)} className="shadow-glow">
                <Wand className="w-4 h-4 mr-2" />
                Customize Products
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Wand className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-muted-foreground">AI is working on your masterpiece...</span>
          </div>
        )}
      </div>
    </div>
  );
};